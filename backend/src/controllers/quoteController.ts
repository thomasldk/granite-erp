import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import nodemailer from 'nodemailer';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import { XmlService } from '../services/xmlService';
import { CalculationService } from '../services/calculationService';

const prisma = new PrismaClient();
const excelService = new ExcelService();
const xmlService = new XmlService();
const calculationService = new CalculationService();

// --- QUOTES ---

export const generateQuoteExcel = async (req: Request, res: Response) => {
    // Mode: "Sync Agent"
    // We do NOT calculate locally. We mark it for the PC Agent to pick up.

    const { id } = req.params;
    try {
        const quoteFull = await prisma.quote.findUnique({
            where: { id: id },
            include: {
                items: true,
                project: true,
                material: true,
                contact: true,
                paymentTerm: true,
                representative: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } }
            }
        });

        if (!quoteFull) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // Generate XML
        let rep = quoteFull.representative;
        if (!rep && quoteFull.client?.repName) {
            const allReps = await prisma.representative.findMany();
            rep = allReps.find(r => `${r.firstName} ${r.lastName}` === quoteFull.client?.repName) || null;
        }

        const xmlContent = await xmlService.generateQuoteXml(quoteFull, rep);

        // Save to pending_xml
        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const filename = `${safeName(quoteFull.reference)}.rak`;
        const outputPath = path.join(__dirname, '../../pending_xml', filename);

        fs.writeFileSync(outputPath, xmlContent);
        console.log(`[Agent-Flow] XML saved to ${outputPath}`);

        console.log(`[Agent-Flow] Queuing Quote ${quoteFull.reference} for PC Agent...`);

        // 1. Mark as Pending for Agent
        await prisma.quote.update({
            where: { id: quoteFull.id },
            data: {
                syncStatus: 'PENDING_AGENT'
            }
        });

        // 2. Return status immediately
        // Frontend should poll or listen for status change, or just show "Waiting for PC..."
        res.json({ message: 'Queued for PC Agent', status: 'PENDING_AGENT' });

    } catch (error: any) {
        console.error("Queue Error:", error);
        res.status(500).json({ error: 'Failed to queue quote', details: error.message });
    }
};

export const getNextQuoteReference = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }

        const project = await prisma.project.findUnique({
            where: { id: String(projectId) },
            include: { quotes: true }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Logic: DRC{YY}-{ProjectSeq}-C{ClientIndex}R{Revision}
        // Extract Project Sequence from "P25-0001" -> "0001"
        // If project ref is not standard, fallback or use "0000"
        let projectSeq = '0000';
        const year = new Date().getFullYear().toString().slice(-2); // 25

        // Try to parse standard P25-XXXX format
        // Expected: P25-XXXX
        const projectRefParts = project.reference.split('-');
        if (project.reference.startsWith(`P${year}-`) && projectRefParts.length >= 2) {
            projectSeq = projectRefParts[1];
        } else if (projectRefParts.length >= 2) {
            // Handle case where project might be P24-XXXX but we are in 2025? 
            // Or non-standard. Let's just take the last part if numeric.
            const potentialSeq = projectRefParts[projectRefParts.length - 1];
            if (!isNaN(parseInt(potentialSeq))) {
                projectSeq = potentialSeq;
            }
        }

        // Calculate Client Index (Cx)
        // Count existing quotes in this project
        // Note: Revisions (R1, R2) might be separate quotes or versions of same quote?
        // User said: "1 veux dire autre client". So distinct quotes = distinct clients/options.
        // We count total quotes for this project.
        const clientIndex = project.quotes.length;

        const reference = `DRC${year}-${projectSeq}-C${clientIndex}R0`;

        res.json({ reference });
    } catch (error) {
        console.error("Error generating reference:", error);
        res.status(500).json({ error: 'Failed to generate reference' });
    }
};

export const getQuotes = async (req: Request, res: Response) => {
    try {
        const quotes = await prisma.quote.findMany({
            where: {
                status: {
                    not: 'PENDING_CREATION' // Hide incomplete duplicates
                }
            },
            include: { project: true, client: true, items: true },
            orderBy: { dateIssued: 'desc' }
        });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
};

export const downloadQuoteExcel = async (req: Request, res: Response) => {
    // Mode: "Sync Agent"
    // Trigger the Queue process.
    return generateQuoteExcel(req, res);
};

export const getQuoteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                client: true,
                project: true,
                items: true,
                paymentTerm: true,
                representative: true,
                contact: true
            }
        });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote' });
    }
};

export const createQuote = async (req: Request, res: Response) => {
    const {
        reference, projectId, thirdPartyId, contactId, currency, estimatedWeeks, materialId, exchangeRate, incoterm,
        incotermId, incotermCustomText,
        // V8 Snapshot
        semiStandardRate, salesCurrency, palletPrice, palletRequired,
        paymentTermId, paymentDays, depositPercentage, discountPercentage, discountDays, paymentCustomText,
        validityDuration, // Check for explicit override
        representativeId // Added
    } = req.body;
    console.log("[CreateQuote] Payload:", JSON.stringify(req.body, null, 2));
    try {
        // Calculate Validity Duration if not provided
        let finalValidityDuration = validityDuration ? parseInt(validityDuration) : null;

        if (finalValidityDuration === null) {
            // 1. Try Client Default
            if (thirdPartyId) {
                const client = await prisma.thirdParty.findUnique({ where: { id: thirdPartyId } });
                if (client?.validityDuration) {
                    finalValidityDuration = client.validityDuration;
                }
            }
            // 2. Try System Default (if still null)
            if (finalValidityDuration === null) {
                const config = await prisma.systemConfig.findUnique({ where: { key: 'GLOBAL' } });
                finalValidityDuration = config?.defaultValidityDuration ?? 30; // Fallback 30
            }
        }

        const quote = await prisma.quote.create({
            data: {
                reference,
                projectId,
                thirdPartyId,
                contactId,
                currency,
                estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : null,
                materialId,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0, // Handle exchangeRate
                incoterm: incoterm || 'Ex Works',
                incotermId: incotermId || null,
                incotermCustomText,
                status: 'Draft',
                version: 1,
                // V8
                semiStandardRate: semiStandardRate ? parseFloat(semiStandardRate) : null,
                salesCurrency,
                palletPrice: palletPrice ? parseFloat(palletPrice) : null,
                palletRequired: (palletRequired !== undefined && palletRequired !== null) ? Boolean(palletRequired) : null,
                // V8 Payment Snapshot
                paymentTermId,
                paymentDays: paymentDays ? parseInt(paymentDays) : 0,
                depositPercentage: depositPercentage ? parseFloat(depositPercentage) : 0,
                discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
                discountDays: discountDays ? parseInt(discountDays) : 0,
                paymentCustomText,
                validityDuration: finalValidityDuration,
                representativeId: representativeId || null
            }
        });
        res.json(quote);
    } catch (error: any) {
        console.error("Create Quote Error Details:", error);
        res.status(500).json({ error: 'Error creating quote', details: error.message, meta: error.meta });
    }
};

export const updateQuote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        contactId, // FIX
        status,
        validUntil,
        currency,
        internalNotes,
        estimatedWeeks,
        materialId,
        exchangeRate,
        incoterm,
        incotermId,
        incotermCustomText,
        numberOfLines,
        // Optional client fields (may be undefined if not sent)
        clientName,
        clientAddress1,
        clientCity,
        clientState,
        clientZipCode,
        clientPhone,
        clientFax,
        clientEmail,
        // V8 Snapshot
        // V8 Snapshot
        semiStandardRate, salesCurrency, palletPrice, palletRequired,
        paymentTermId, paymentDays, depositPercentage, discountPercentage, discountDays, paymentCustomText,
        validityDuration, representativeId
    } = req.body;
    try {
        console.log(`[UPDATE QUOTE] ID=${id} IncotermId=${incotermId} Incoterm=${incoterm}`);
        // 1️⃣ Update the Quote itself (same as before)
        const quote = await prisma.quote.update({
            where: { id },
            data: {
                contactId: contactId !== undefined ? (contactId || null) : undefined,
                status,
                validUntil: validUntil ? new Date(validUntil) : undefined,
                currency,
                estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
                materialId: materialId !== undefined ? (materialId || null) : undefined,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined,
                incoterm,
                incotermId: incotermId !== undefined ? (incotermId || null) : undefined,
                incotermCustomText,
                // Also update the Project if numberOfLines is provided
                project: numberOfLines ? {
                    update: {
                        numberOfLines: parseInt(numberOfLines)
                    }
                } : undefined,
                // V8
                semiStandardRate: semiStandardRate !== undefined ? (semiStandardRate ? parseFloat(semiStandardRate) : null) : undefined,
                salesCurrency: salesCurrency !== undefined ? salesCurrency : undefined,
                palletPrice: palletPrice !== undefined ? (palletPrice ? parseFloat(palletPrice) : null) : undefined,
                palletRequired: (palletRequired !== undefined) ? (palletRequired ? true : false) : undefined,
                // V8 Payment
                paymentTermId: paymentTermId !== undefined ? (paymentTermId || null) : undefined,
                paymentDays: (paymentDays !== undefined && paymentDays !== '') ? parseInt(paymentDays) : undefined,
                depositPercentage: (depositPercentage !== undefined && depositPercentage !== '') ? parseFloat(depositPercentage) : undefined,
                discountPercentage: (discountPercentage !== undefined && discountPercentage !== '') ? parseFloat(discountPercentage) : undefined,
                discountDays: (discountDays !== undefined && discountDays !== '') ? parseInt(discountDays) : undefined,
                paymentCustomText,
                validityDuration: (validityDuration !== undefined && validityDuration !== '') ? parseInt(validityDuration) : undefined,
                representativeId: representativeId !== undefined ? (representativeId || null) : undefined
            },
            include: { project: true, client: true } // Include client to get clientId for update
        });
        // 2️⃣ If any client fields were sent, update the related ThirdParty (client) record
        if (clientName || clientAddress1 || clientCity || clientState || clientZipCode || clientPhone || clientFax || clientEmail) {
            await prisma.thirdParty.update({
                where: { id: quote.thirdPartyId },
                data: {
                    name: clientName ?? undefined,
                    addresses: clientAddress1 || clientCity || clientState || clientZipCode ? {
                        updateMany: {
                            where: { thirdPartyId: quote.thirdPartyId }, // Ensure we update addresses belonging to this client
                            data: {
                                line1: clientAddress1 ?? undefined,
                                city: clientCity ?? undefined,
                                state: clientState ?? undefined,
                                zipCode: clientZipCode ?? undefined
                            }
                        }
                    } : undefined,
                    contacts: clientPhone || clientFax || clientEmail ? {
                        updateMany: {
                            where: { thirdPartyId: quote.thirdPartyId }, // Ensure we update contacts belonging to this client
                            data: {
                                phone: clientPhone ?? undefined,
                                fax: clientFax ?? undefined,
                                email: clientEmail ?? undefined
                            }
                        }
                    } : undefined
                }
            });
        } res.json(quote);
    } catch (error) {
        console.error("Update Quote Error:", error);
        res.status(500).json({ error: 'Error updating quote' });
    }
};

// --- QUOTE ITEMS ---

export const addItem = async (req: Request, res: Response) => {
    const { quoteId } = req.params;
    const { description, material, finish, length, width, thickness, quantity, numHoles, numSlots } = req.body;

    try {
        const item = await prisma.quoteItem.create({
            data: {
                quoteId,
                description,
                material,
                finish,
                length: length ? parseFloat(length) : null,
                width: width ? parseFloat(width) : null,
                thickness: thickness ? parseFloat(thickness) : null,
                quantity: quantity ? parseFloat(quantity) : 1,
                numHoles: numHoles ? parseInt(numHoles) : 0,
                numSlots: numSlots ? parseInt(numSlots) : 0,
                unit: 'pi2', // Default unit, logic to be refined
                unitPrice: 0, // Will be updated by Excel sync
                totalPrice: 0
            }
        });
        res.json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding item' });
    }
};

export const deleteItem = async (req: Request, res: Response) => {
    const { itemId } = req.params;
    try {
        await prisma.quoteItem.delete({
            where: { id: itemId }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting item' });
    }
};

export const deleteQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Manual Cascade: Delete items first
        await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        // Then delete quote
        await prisma.quote.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Delete detailed error:", error);
        res.status(500).json({ error: 'Failed to delete quote', details: error });
    }
};

export const reviseQuote_LEGACY = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Get original quote with items
        const originalQuote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!originalQuote) return res.status(404).json({ error: 'Quote not found' });

        // 2. Generate new reference (R0 -> R1)
        // Format: ...-R0, ...-R1
        let newReference = originalQuote.reference;
        const parts = originalQuote.reference.split('R');
        if (parts.length > 1) {
            const revNum = parseInt(parts[parts.length - 1]);
            if (!isNaN(revNum)) {
                // Reconstruct everything before the last R
                const prefix = parts.slice(0, -1).join('R');
                newReference = `${prefix}R${revNum + 1}`;
            }
        }
        // Fallback or safety check? (If format is weird, maybe append -R1?)
        if (newReference === originalQuote.reference) {
            newReference = `${originalQuote.reference}-R1`;
        }

        // 3. Create new Quote
        const newQuote = await prisma.quote.create({
            data: {
                reference: newReference,
                projectId: originalQuote.projectId,
                thirdPartyId: originalQuote.thirdPartyId,
                contactId: originalQuote.contactId,
                currency: originalQuote.currency,
                status: 'Draft', // Reset status
                version: originalQuote.version + 1, // Or track via reference? Let's increment internal version too
                estimatedWeeks: originalQuote.estimatedWeeks,
                materialId: originalQuote.materialId,
                exchangeRate: originalQuote.exchangeRate,
                incoterm: (originalQuote as any).incoterm,
                validUntil: undefined, // Reset validity
                dateIssued: new Date(), // New date
                // V8
                semiStandardRate: (originalQuote as any).semiStandardRate,
                salesCurrency: (originalQuote as any).salesCurrency,
                palletPrice: (originalQuote as any).palletPrice,
                palletRequired: (originalQuote as any).palletRequired,
                // V8 Payment Snapshot
                paymentTermId: (originalQuote as any).paymentTermId,
                paymentDays: (originalQuote as any).paymentDays,
                depositPercentage: (originalQuote as any).depositPercentage,
                discountPercentage: (originalQuote as any).discountPercentage,
                discountDays: (originalQuote as any).discountDays,
                paymentCustomText: (originalQuote as any).paymentCustomText,
                representativeId: originalQuote.representativeId
            }
        });

        // 4. Clone Items
        if (originalQuote.items.length > 0) {
            console.log(`[Revise] Found ${originalQuote.items.length} items to clone.`);
            console.log(`[Revise] First item keys:`, Object.keys(originalQuote.items[0]));
            if (originalQuote.items[0] as any) console.log(`[Revise] Sample netLength:`, (originalQuote.items[0] as any).netLength);

            const itemsData = originalQuote.items.map((item: any) => ({
                quoteId: newQuote.id,
                tag: item.tag,
                material: item.material,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                length: item.length,
                width: item.width,
                thickness: item.thickness,
                finish: item.finish,
                numHoles: item.numHoles,
                numSlots: item.numSlots,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                // Full Clone of Cost/Tech Fields
                netLength: item.netLength,
                netArea: item.netArea,
                netVolume: item.netVolume,
                totalWeight: item.totalWeight,
                unitPriceCad: item.unitPriceCad,
                totalPriceCad: item.totalPriceCad,
                stoneValue: item.stoneValue,
                primarySawingCost: item.primarySawingCost,
                secondarySawingCost: item.secondarySawingCost,
                profilingCost: item.profilingCost,
                finishingCost: item.finishingCost,
                anchoringCost: item.anchoringCost,
                unitTime: item.unitTime,
                totalTime: item.totalTime,
                productionStatus: 'Pending', // Reset production status
                productionNotes: item.productionNotes
            }));

            await prisma.quoteItem.createMany({
                data: itemsData
            });
        }

    } catch (error) {
        console.error('Error revising quote:', error);
        res.status(500).json({ error: 'Failed to revise quote' });
    }
};

export const duplicateQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newClientId, newContactId } = req.body;

        // 1. Get original quote
        const originalQuote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: { include: { quotes: true } }, client: true, material: true }
        });

        if (!originalQuote || !originalQuote.project) return res.status(404).json({ error: 'Quote or Project not found' });

        // 2. Resolve New Client & Contact
        let finalClientId = originalQuote.thirdPartyId;
        let finalContactId = originalQuote.contactId;

        if (newClientId) {
            finalClientId = newClientId;
            finalContactId = newContactId || null;
        }

        const newClient = await prisma.thirdParty.findUnique({ where: { id: finalClientId }, include: { addresses: true, contacts: true, paymentTerm: true } });
        const newContact = finalContactId ? await prisma.contact.findUnique({ where: { id: finalContactId } }) : null;

        // 3. Generate New Reference
        const project = originalQuote.project;
        const clientIndex = project.quotes.length;

        const refParts = originalQuote.reference.split('-');
        let newReference = '';
        if (refParts.length >= 3) {
            const prefix = refParts.slice(0, 2).join('-');
            newReference = `${prefix}-C${clientIndex}R0`;
        } else {
            newReference = `${originalQuote.reference}-COPY-${Date.now().toString().slice(-4)}`;
        }

        // 4. Create Duplicate Quote
        const newQuote = await prisma.quote.create({
            data: {
                reference: newReference,
                projectId: originalQuote.projectId,
                thirdPartyId: finalClientId,
                contactId: finalContactId,
                currency: originalQuote.currency,
                status: 'PENDING_CREATION', // Hidden until PC Agent returns
                version: 1,
                estimatedWeeks: originalQuote.estimatedWeeks,
                materialId: originalQuote.materialId,
                exchangeRate: originalQuote.exchangeRate,
                incoterm: originalQuote.incoterm,
                incotermId: originalQuote.incotermId,
                incotermCustomText: originalQuote.incotermCustomText,
                validUntil: undefined,
                dateIssued: new Date(),
                semiStandardRate: (originalQuote as any).semiStandardRate,
                salesCurrency: (originalQuote as any).salesCurrency,
                palletPrice: (originalQuote as any).palletPrice,
                palletRequired: (originalQuote as any).palletRequired,
                paymentTermId: (originalQuote as any).paymentTermId,
                paymentDays: (originalQuote as any).paymentDays,
                depositPercentage: (originalQuote as any).depositPercentage,
                discountPercentage: (originalQuote as any).discountPercentage,
                discountDays: (originalQuote as any).discountDays,
                paymentCustomText: (originalQuote as any).paymentCustomText,
                representativeId: originalQuote.representativeId,
                syncStatus: 'PENDING_DUPLICATE' // Special status to preserve RAK
            }
        });

        // 5. Clone Items
        if (originalQuote.items.length > 0) {
            const itemsData = originalQuote.items.map((item: any) => ({
                quoteId: newQuote.id,
                tag: item.tag,
                material: item.material,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                length: item.length,
                width: item.width,
                thickness: item.thickness,
                finish: item.finish,
                numHoles: item.numHoles,
                numSlots: item.numSlots,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                netLength: item.netLength,
                netArea: item.netArea,
                netVolume: item.netVolume,
                totalWeight: item.totalWeight,
                unitPriceCad: item.unitPriceCad,
                totalPriceCad: item.totalPriceCad,
                stoneValue: item.stoneValue,
                primarySawingCost: item.primarySawingCost,
                secondarySawingCost: item.secondarySawingCost,
                profilingCost: item.profilingCost,
                finishingCost: item.finishingCost,
                anchoringCost: item.anchoringCost,
                unitTime: item.unitTime,
                totalTime: item.totalTime,
                unitPriceInternal: item.unitPriceInternal,
                totalPriceInternal: item.totalPriceInternal,
                productionStatus: 'Pending',
                productionNotes: item.productionNotes
            }));

            await prisma.quoteItem.createMany({ data: itemsData });
        }

        // 6. Generate RAK XML
        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');

        // 6. LOGIC: Copy Excel File on Server (F:\nxerp OR /Volumes/nxerp)
        // We handle cross-platform paths so the Mac backend can write to the "F" drive mounted on /Volumes.

        // DETECT PLATFORM
        const isMac = process.platform === 'darwin';
        const basePath = isMac ? '/Volumes/nxerp' : 'F:\\nxerp';

        const pName = safeName(project.name);

        // 6a. Construct Source Path (Original Quote)
        // Heuristic: Most reliable is to reconstruct standard format
        const oldClientName = safeName(originalQuote.client?.name);
        const oldMaterialName = safeName(originalQuote.material?.name);
        const oldRef = safeName(originalQuote.reference);
        const oldFilename = `${oldRef}_${oldClientName}_${pName}_${oldMaterialName}.xlsx`;
        const oldPath = path.join(basePath, pName, oldFilename);

        // 6b. Construct Target Path (New Quote)
        const newClientName = safeName(newClient?.name || 'Unknown');
        const newRef = safeName(newReference);
        const newFilename = `${newRef}_${newClientName}_${pName}_${oldMaterialName}.xlsx`;
        const newPath = path.join(basePath, pName, newFilename);

        console.log(`[Duplicate] Platform: ${process.platform}. BasePath: ${basePath}`);
        console.log(`[Duplicate] Copying: ${oldPath} -> ${newPath}`);

        try {
            if (fs.existsSync(oldPath)) {
                // Ensure target dir exists
                if (!fs.existsSync(path.dirname(newPath))) {
                    fs.mkdirSync(path.dirname(newPath), { recursive: true });
                }
                fs.copyFileSync(oldPath, newPath);
                console.log(`[Duplicate] Excel copied successfully.`);

                // Save the new path to the quote record
                await prisma.quote.update({
                    where: { id: newQuote.id },
                    data: { excelFilePath: newPath }
                });

            } else {
                console.warn(`[Duplicate] WARNING: Original file not found at ${oldPath}. Check mount point!`);
            }
        } catch (e: any) {
            console.error(`[Duplicate] File Copy Failed:`, e.message);
        }

        // 7. Generate RAK Trigger
        // The RAK 'cible' will point to F:\nxerp... (Windows Path) because the Agent runs on Windows.
        // We must ensure the 'cible' in the XML matches the Windows reality.
        // XmlService handles this if we pass standard objects.

        const fullNewQuote = await prisma.quote.findUnique({
            where: { id: newQuote.id },
            include: { client: { include: { addresses: true, contacts: true, paymentTerm: true } }, project: { include: { location: true } }, material: true, items: true, incotermRef: true, paymentTerm: true }
        });

        // Use standard generation
        const xmlService = new (require('../services/xmlService').XmlService)();
        const xmlContent = await xmlService.generateQuoteXml(fullNewQuote, null);

        const xmlFilename = `${newReference}.rak`;
        const outputPath = path.join(__dirname, '../../pending_xml', xmlFilename);
        fs.writeFileSync(outputPath, xmlContent);

        res.json(newQuote);

    } catch (error) {
        console.error("Duplicate Quote Error:", error);
        res.status(500).json({ error: 'Failed to duplicate quote' });
    }
};
// XML Export logic moved to top


export const generateQuoteXml = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                project: true,
                material: true,
                contact: true, // Specific contact selected
                paymentTerm: true, // Needed for Code (1-8)
                representative: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } }
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // Find Representative manually (No FK)
        // Find Representative
        let rep = quote.representative;
        if (!rep && quote.client?.repName) {
            const allReps = await prisma.representative.findMany();
            const target = quote.client.repName.trim().toLowerCase();
            console.log(`[XML-DEBUG] Target Rep Name: '${target}' (Original: '${quote.client.repName}')`);

            console.log(`[XML-DEBUG] Available Reps in DB:`, allReps.map(r => `${r.firstName} ${r.lastName}`));

            rep = allReps.find(r => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === target) || null;

            if (rep) console.log(`[XML-DEBUG] Found Match via Name: ID ${rep.id}`);
            else console.warn(`[XML-DEBUG] NO MATCH FOUND for '${target}'`);
        } else if (rep) {
            console.log(`[XML-DEBUG] Used Linked Rep: ${rep.firstName} ${rep.lastName}`);
        }

        const xml = await xmlService.generateQuoteXml(quote, rep);

        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const clientName = safeName(quote.client?.name);
        const materialName = safeName(quote.material?.name);
        const projectName = safeName(quote.project?.name);
        const parts = [
            safeName(quote.reference),
            clientName,
            projectName,
            materialName
        ].filter(p => p && p.trim() !== '');

        const filename = `${parts.join('_')}.rak`;

        res.header('Content-Type', 'application/xml');
        res.attachment(filename);
        res.send(xml);

    } catch (error) {
        console.error("XML Gen Error:", error);
        res.status(500).json({ error: 'Failed to generate XML' });
    }
};


export const exportQuoteToLocal = async (req: Request, res: Response) => {
    // Mode: "Sync Agent"
    // Redirect to the Queue logic
    return generateQuoteExcel(req, res);
};



export const importQuoteXml = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const xmlContent = fs.readFileSync(req.file.path, 'utf-8');
        // Parse items
        const items = xmlService.parseExcelReturnXml(xmlContent);

        // Transaction to replace items
        await prisma.$transaction(async (prisma) => {
            // Delete existing items
            await prisma.quoteItem.deleteMany({ where: { quoteId: id } });

            // Create new items
            if (items.length > 0) {
                await prisma.quoteItem.createMany({
                    data: items.map(item => ({
                        quoteId: id,
                        tag: item.tag,
                        description: item.description,
                        material: item.material,
                        quantity: item.quantity,
                        unit: item.unit,

                        length: item.length,
                        width: item.width,
                        thickness: item.thickness,

                        netLength: item.netLength,
                        netArea: item.netArea,
                        netVolume: item.netVolume,
                        totalWeight: item.totalWeight,

                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,

                        // Dual currency / Internal
                        unitPriceCad: item.unitPriceCad,
                        unitPriceUsd: 0, // Default or parse if available
                        totalPriceCad: item.totalPriceCad,
                        totalPriceUsd: 0,

                        stoneValue: item.stoneValue,

                        numHoles: 0,
                        numSlots: 0,
                    }))
                });
            }

            // Update Quote Total
            const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            await prisma.quote.update({
                where: { id },
                data: {
                    totalAmount,
                    syncStatus: 'Synced'
                }
            });
        });

        // Cleanup temp file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json({ message: 'Import successful', count: items.length });
    } catch (error) {
        console.error('Import XML Error:', error);
        res.status(500).json({ error: 'Failed to import XML', details: String(error) });
    }
};

export const importNetworkXml = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // 1. Fetch Quote to reconstruct filename
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { project: true, material: true, client: true }
        });
        if (!quote || !quote.project || !quote.material) return res.status(404).json({ error: 'Quote incomplete' });

        // 2. Reconstruct Filename (Same logic as export)
        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const clientName = safeName(quote.client?.name);
        const materialName = safeName(quote.material.name);
        const projectName = safeName(quote.project.name);

        const parts = [
            quote.reference,
            clientName,
            projectName,
            materialName
        ].filter(p => p && p.trim() !== '');

        const filename = `${parts.join('_')}.xml`; // Import looks for .xml
        const sharePath = '/Volumes/demo/echange';

        console.log("Looking for strict match:", filename);

        let targetFile = filename;
        let importPath = path.join(sharePath, targetFile);

        // SMART MATCHING: If strict file not found, look for fuzzy match on Reference
        if (!fs.existsSync(importPath)) {
            console.log("Strict match not found, attempting fuzzy search for Ref:", quote.reference);
            try {
                if (fs.existsSync(sharePath)) {
                    const files = fs.readdirSync(sharePath);
                    // Find files starting with the reference (Case Insensitive)
                    const candidates = files.filter(f => f.toLowerCase().startsWith(quote.reference.toLowerCase()) && f.endsWith('.xml'));

                    if (candidates.length > 0) {
                        // Pick the most recent one
                        candidates.sort((a, b) => {
                            const statA = fs.statSync(path.join(sharePath, a));
                            const statB = fs.statSync(path.join(sharePath, b));
                            return statB.mtime.getTime() - statA.mtime.getTime();
                        });
                        targetFile = candidates[0];
                        importPath = path.join(sharePath, targetFile);
                        console.log("Fuzzy match found:", targetFile);
                    }
                }
            } catch (err) {
                console.error("Error during fuzzy search:", err);
            }
        }

        if (!fs.existsSync(importPath)) {
            return res.status(404).json({ error: 'Fichier XML de retour introuvable', searchedFor: filename, currentPath: importPath });
        }

        const xmlContent = fs.readFileSync(importPath, 'utf-8');
        const items = xmlService.parseExcelReturnXml(xmlContent);

        // 3. Update Items
        await prisma.$transaction(async (prisma) => {
            await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            if (items.length > 0) {
                await prisma.quoteItem.createMany({
                    data: items.map(item => ({
                        quoteId: id,
                        tag: item.tag,
                        description: item.description,
                        length: item.length,
                        width: item.width,
                        thickness: item.thickness || 0,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        material: item.material,
                        finish: item.finish || 'Standard',
                        unit: item.unit,
                        // Added fields
                        netLength: item.netLength || 0,
                        netArea: item.netArea || 0,
                        netVolume: item.netVolume || 0,
                        totalWeight: item.totalWeight || 0,
                        unitPriceCad: item.unitPriceCad || 0,
                        unitPriceUsd: item.unitPrice || 0, // Assuming unitPrice is the external one (USD or otherwise)
                        totalPriceCad: item.totalPriceCad || 0,
                        totalPriceUsd: item.totalPrice || 0,
                        stoneValue: item.stoneValue || 0,
                        primarySawingCost: item.primarySawingCost || 0,
                        secondarySawingCost: item.secondarySawingCost || 0,
                        profilingCost: item.profilingCost || 0,
                        finishingCost: item.finishingCost || 0,
                        anchoringCost: item.anchoringCost || 0,
                        unitTime: item.unitTime || 0,
                        totalTime: item.totalTime || 0
                    }))
                });
            }
        });

        // 4. Update Quote Totals
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        await prisma.quote.update({
            where: { id },
            data: {
                totalAmount
            }
        });

        res.json({ message: 'Import réseau réussi', itemsCount: items.length });

    } catch (error: any) {
        console.error("Import Network Error:", error);
        res.status(500).json({ error: 'Failed to import from network', details: error.message });
    }
};

export const reintegrateExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { project: true, material: true, client: true }
        });

        if (!quote || !quote.project) {
            return res.status(404).json({ error: 'Quote or Project not found' });
        }

        // Rename logic to persist ORIGINAL filename (for PC matching)
        // Use triple underscore as separator to avoid confusion
        // We do NOT replace spaces here, we want the exact PC name.
        const originalName = file.originalname;
        const filename = `${id}___${originalName}`;

        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const finalPath = path.join(uploadsDir, filename);

        // Move/Rename
        try {
            fs.renameSync(file.path, finalPath);
        } catch (mvErr) {
            fs.copyFileSync(file.path, finalPath);
            fs.unlinkSync(file.path);
        }

        console.log(`[Reintegrate] Uploaded ${originalName} -> ${finalPath}. Queuing for Agent.`);

        // Store standard relative path "uploads/..."
        await prisma.quote.update({
            where: { id },
            data: {
                syncStatus: 'PENDING_REIMPORT',
                excelFilePath: `uploads/${filename}`
            }
        });

        res.json({
            message: 'Queued for Reintegration',
            status: 'PENDING_REIMPORT'
        });

    } catch (error) {
        console.error('Reintegrate Quote Error:', error);
        res.status(500).json({ error: 'Failed to queue reintegration', details: String(error) });
    }
};

export const saveRakToNetwork = async (req: Request, res: Response) => {
    const { xmlContent, filename } = req.body;

    if (!xmlContent || !filename) {
        return res.status(400).json({ error: 'Missing xmlContent or filename' });
    }

    try {
        // Target path: /Volumes/demo/echange/[filename]
        // Assuming this volume is mounted on the server (Mac)
        const targetDir = '/Volumes/demo/echange/';
        const targetPath = path.join(targetDir, filename);

        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                console.warn(`Could not create target directory ${targetDir}:`, e);
                return res.status(500).json({ error: `Directory ${targetDir} does not exist and could not be created.` });
            }
        }

        fs.writeFileSync(targetPath, xmlContent, 'utf8');
        console.log(`Saved RAK to ${targetPath}`);

        res.json({ message: 'RAK saved successfully', path: targetPath });

    } catch (error) {
        console.error('Save RAK Error:', error);
        res.status(500).json({ error: 'Failed to save RAK file', details: String(error) });
    }
};

export const fetchReturnXml = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { filename } = req.body; // e.g., envoi000001.rak (we need to change extension)

    if (!filename) return res.status(400).json({ error: 'Filename required' });

    // Target XML filename: envoi000001.xml
    const targetFilename = filename.replace('.rak', '.xml');
    // Location: /Volumes/demo/echange/
    const targetPath = path.join('/Volumes/demo/echange/', targetFilename);

    console.log(`Fetching Return XML: ${targetPath}`);

    if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: 'XML de retour non trouvé. L\'éditeur Excel n\'a peut-être pas encore terminé.', path: targetPath });
    }

    try {
        const xmlContent = fs.readFileSync(targetPath, 'utf-8');
        const items = xmlService.parseExcelReturnXml(xmlContent);

        // Transaction: Delete existing items for this quote and create new ones
        // Note: Similar to importQuoteXml but using the parsed items directly
        await prisma.$transaction(async (tx) => {
            // 1. Delete existing items
            await tx.quoteItem.deleteMany({ where: { quoteId: id } });

            // 2. Insert new items
            for (const item of items) {
                // Determine finish (parse description or default)
                let finish = null;
                const descLower = (item.description || '').toLowerCase();
                if (descLower.includes('pol')) finish = 'Polished';
                else if (descLower.includes('hon')) finish = 'Honed';
                else if (descLower.includes('flamb')) finish = 'Flamed';

                await tx.quoteItem.create({
                    data: {
                        quoteId: id,
                        description: item.description || 'Imported Item',
                        material: item.material || 'N/A',
                        length: item.length || 0,
                        width: item.width || 0,
                        thickness: item.thickness || 0,
                        quantity: typeof item.quantity === 'number' ? item.quantity : 1, // Ensure number
                        unitPrice: item.unitPrice || 0, // USD
                        totalPrice: item.totalPrice || 0, // USD
                        // Additional fields from XML return
                        netLength: item.netLength,
                        netArea: item.netArea,
                        netVolume: item.netVolume,
                        totalWeight: item.totalWeight,
                        unitPriceCad: item.unitPriceCad,
                        totalPriceCad: item.totalPriceCad,
                        stoneValue: item.stoneValue,
                        primarySawingCost: item.primarySawingCost,
                        secondarySawingCost: item.secondarySawingCost,
                        profilingCost: item.profilingCost,
                        finishingCost: item.finishingCost,
                        anchoringCost: item.anchoringCost,
                        tag: item.tag,
                        finish: finish
                    }
                });
            }
        });

        // Return updated items to frontend
        const updatedItems = await prisma.quoteItem.findMany({ where: { quoteId: id } });
        res.json({ message: 'Import successful', items: updatedItems });

    } catch (error) {
        console.error("Error processing return XML:", error);
        res.status(500).json({ error: 'Failed to process return XML', details: String(error) });
    }
};

export const downloadQuotePdf = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        const pdfBuffer = await PdfService.generateQuotePdf(quote as any);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${quote.reference}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

export const emitQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // 1. Generate PDF
        const pdfBuffer = await PdfService.generateQuotePdf(quote as any);

        // 2. Send Email (Mock for now, logging to console)
        // To configure real email, we need SMTP settings in .env
        /*
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        */

        console.log(`[EMIT] Sending email to thomasldk@gmail.com for quote ${quote.reference}`);
        console.log(`[EMIT] PDF generated (${pdfBuffer.length} bytes). Attachment ready.`);

        // Mock Send
        // await transporter.sendMail(...)

        // 3. Update Status
        const updatedQuote = await prisma.quote.update({
            where: { id },
            data: { status: 'Sent' }
        });

        res.json({ message: 'Quote emitted successfully', quote: updatedQuote });

    } catch (error) {
        console.error('Error emitting quote:', error);
        res.status(500).json({ error: 'Failed to emit quote' });
    }
};

// New Endpoint to actually download the result file
export const downloadQuoteResult = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!quote || !quote.project) {
            return res.status(404).json({ error: 'Quote or Project not found' });
        }

        // STRATEGY A: Sync Agent File (Priority)
        // If status says Agent finished or we have a path, strictly try to serve it.
        // Prevent fallback to legacy if Status is Calculated.
        // FIX: Premature Download Protection. Even if we have excelFilePath, DO NOT serve if PENDING_REVISION.
        const isPending = quote.syncStatus === 'PENDING_REVISION' || quote.syncStatus === 'PENDING';

        if ((quote.syncStatus === 'Calculated (Agent)' || quote.excelFilePath) && !isPending) {
            console.log(`[DEBUG] Strategy A (Strict Agent). Path: ${quote.excelFilePath}, Status: ${quote.syncStatus}`);

            let servePath = quote.excelFilePath;

            // FIX: Translate Windows Path (F:) to Mac Path (/Volumes/nxerp)
            // OR Handle Local Uploads (Tunnel Mode)
            if (servePath && (servePath.startsWith('uploads/') || servePath.startsWith('uploads\\'))) {
                // Local Upload Mode
                servePath = path.join(__dirname, '../../', servePath);
                console.log(`[DEBUG] Serving Local Upload: ${servePath}`);
            } else if (servePath && (servePath.startsWith('F:') || servePath.startsWith('f:'))) {
                // Windows Path Mode (Local Network)
                // Remove drive letter and convert backslashes
                let relativePath = servePath.substring(2).replace(/\\/g, '/'); // \nxerp\Projet\Fichier.xlsx -> /nxerp/Projet/Fichier.xlsx
                // Check if it starts with /nxerp, if so, map to /Volumes/nxerp
                if (relativePath.toLowerCase().startsWith('/nxerp')) {
                    servePath = `/Volumes${relativePath}`; // /Volumes/nxerp/...
                } else {
                    servePath = `/Volumes/nxerp${relativePath}`; // Fallback if no nxerp in path
                }
                console.log(`[DEBUG] Path Translated for Mac: ${quote.excelFilePath} -> ${servePath}`);
            }

            if (servePath && fs.existsSync(servePath)) {
                // Return the specific uploaded file
                let downloadName = path.basename(servePath);
                // Clean the ID prefix (separated by ___ or __)
                if (downloadName.includes('___')) {
                    downloadName = downloadName.split('___').slice(1).join('___');
                } else if (downloadName.includes('__')) {
                    downloadName = downloadName.split('__').slice(1).join('__');
                }
                console.log(`[DEBUG] Sending Synced Excel: ${servePath}. Name: ${downloadName}`);
                const stats = fs.statSync(servePath);
                console.log(`[DEBUG] File Size: ${stats.size} bytes`);

                // Explicitly expose the header for CORS if needed (though usually not issue for direct download)
                res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
                res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
                const fileStream = fs.createReadStream(servePath);
                return fileStream.pipe(res);
            } else {
                // File missing despite status
                console.error("Agent said calculated, but file missing at:", servePath);
                return res.status(404).json({
                    error: "Le fichier Excel n'est pas encore disponible.",
                    details: "L'agent a signalé la fin du calcul, mais le fichier n'est pas encore arrivé sur le serveur. Veuillez réessayer dans quelques secondes."
                });
            }
        }

        // STRATEGY B: Legacy Fallback: Search in Network Drive /Volumes/nxerp
        // Only reachable if not in Agent mode (or if quote pre-dates agent)
        console.log(`[Download] Fallback to Network Search for ${quote.reference}...`);

        let projectPath = path.join('/Volumes/nxerp', quote.project.name);

        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({
                error: `Excel file not found (Sync pending? Network path invalid?)`,
                details: `Tried local upload and ${projectPath}`
            });
        }

        console.log(`Download request for Quote ID: ${id}`);
        console.log(`Project Name: ${quote.project.name}, Reference: ${quote.reference}`);
        console.log(`Searching in Project Path: ${projectPath}`);

        // Find the excel file corresponding to this quote reference
        let files: string[] = [];
        try {
            files = fs.readdirSync(projectPath);
            console.log(`Files found in folder (${files.length}): ${files.join(', ')}`);
        } catch (e: any) {
            console.log(`Error reading directory: ${e.message}`);
            return res.status(404).json({ error: `Could not read project directory: ${projectPath}`, details: e.message });
        }

        // Look for .xlsx NOT starting with ~$ (temp lock files) AND NOT starting with ._ (Mac metadata)
        let excelFile = files.find(f => f.includes(quote.reference) && f.endsWith('.xlsx') && !f.startsWith('~$') && !f.startsWith('._'));
        console.log(`Exact match search result: ${excelFile}`);

        // Fallback: Fuzzy search
        if (!excelFile) {
            const baseRefParts = quote.reference.split('-');
            if (baseRefParts.length >= 2) {
                const baseRef = baseRefParts.slice(0, 2).join('-');
                console.log(`Attempting fuzzy match with baseRef: ${baseRef}`);

                const candidates = files.filter(f => f.includes(baseRef) && f.endsWith('.xlsx') && !f.startsWith('~$') && !f.startsWith('._'));

                if (candidates.length > 0) {
                    candidates.sort((a, b) => {
                        const statA = fs.statSync(path.join(projectPath, a));
                        const statB = fs.statSync(path.join(projectPath, b));
                        return statB.mtime.getTime() - statA.mtime.getTime();
                    });
                    excelFile = candidates[0];
                    console.log(`[Download Fuzzy] Found file using base ref ${baseRef}: ${excelFile}`);
                }
            }
        }

        if (!excelFile) {
            console.log(`FAILURE: No file found matching reference.`);
            return res.status(404).json({
                error: 'Excel file not found yet. Please wait for macro to complete.',
                details: `Searched in ${projectPath} for reference ${quote.reference}`
            });
        }

        const fullPath = path.join(projectPath, excelFile);
        const stat = fs.statSync(fullPath);
        console.log(`Sending file: ${fullPath} (Size: ${stat.size} bytes)`);

        if (stat.size === 0) {
            console.log(`WARNING: File is empty!`);
            return res.status(500).json({ error: 'File is empty (0 bytes)' });
        }

        res.download(fullPath, excelFile, (err) => {
            if (err) {
                console.log(`Error sending file: ${err.message}`);
            } else {
                console.log(`File sent successfully.`);
            }
        });

    } catch (error) {
        console.error('Error downloading result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const downloadSourceExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const quote = await prisma.quote.findUnique({ where: { id } });
        if (!quote || !quote.excelFilePath) {
            return res.status(404).json({ error: 'Quote or Source Excel not found' });
        }

        const filePath = path.resolve(quote.excelFilePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File on disk not found', path: filePath });
        }

        res.download(filePath, `Source_${quote.reference}.xlsx`);
    } catch (error: any) {
        console.error("Download Source Excel Error:", error);
        res.status(500).json({ error: 'Failed to download source excel', details: error.message });
    }
};



export const reviseQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            materialId, incotermId, paymentTermId,
            incotermCustomText, paymentCustomText,
            depositPercentage, delayDays, discountPercentage, discountDays,
            // V8 Fields
            salesCurrency, exchangeRate, validityDuration, estimatedWeeks, palletRequired,
            quality, unitPrice // Accepted from body
        } = req.body;

        console.log(`[Revise] Request for Quote ${id}`);

        // 1. Fetch Original Quote
        const originalQuote = await prisma.quote.findUnique({
            where: { id },
            include: {
                client: { include: { addresses: true, contacts: true, paymentTerm: true } },
                project: { include: { location: true } },
                material: true,
                items: true,
                contact: true
            }
        });

        if (!originalQuote) {
            return res.status(404).json({ error: 'Original quote not found' });
        }

        // Pre-fetch Material Name if ID is changing
        let newMaterialName: string | undefined;
        if (materialId) {
            const mat = await prisma.material.findUnique({ where: { id: materialId } });
            if (mat) newMaterialName = mat.name;
        }

        // 3. Calculate New Reference (C same, R+1)
        const refRegex = /C(\d+)R(\d+)/;
        let newReference = originalQuote.reference;
        const match = originalQuote.reference.match(refRegex);

        if (match) {
            const cVal = match[1];
            const rVal = parseInt(match[2], 10);
            const newR = rVal + 1;
            newReference = originalQuote.reference.replace(`C${cVal}R${rVal}`, `C${cVal}R${newR}`);
        } else {
            newReference = `${originalQuote.reference}_R1`;
        }

        console.log(`[Revise] Reference: ${originalQuote.reference} -> ${newReference}`);

        // FIX P2002: Check if this revision already exists (Retry scenario)
        const existingRev = await prisma.quote.findUnique({ where: { reference: newReference } });
        if (existingRev) {
            console.warn(`[Revise] Warning: Revision ${newReference} already exists. Cleaning up for retry...`);
            // Cleanup: Delete items first due to cascade? Prisma usually handles cascade if configured.
            // Safest: Delete specific relations or just delete quote.
            // If we have manual cascade:
            await prisma.quoteItem.deleteMany({ where: { quoteId: existingRev.id } });
            await prisma.quote.delete({ where: { id: existingRev.id } });
            console.log(`[Revise] Cleared existing revision ${newReference}.`);
        }

        // 4. Create New Quote Record
        const newQuote = await prisma.quote.create({
            data: {
                reference: newReference,
                projectId: originalQuote.projectId,
                thirdPartyId: originalQuote.thirdPartyId,
                contactId: originalQuote.contactId,
                representativeId: originalQuote.representativeId,

                // NEW VALUES (or keep old if not provided)
                materialId: materialId || originalQuote.materialId,
                incotermId: incotermId || originalQuote.incotermId,
                paymentTermId: paymentTermId || originalQuote.paymentTermId,

                // Financials
                depositPercentage: depositPercentage !== undefined ? Number(depositPercentage) : originalQuote.depositPercentage,
                paymentDays: delayDays !== undefined ? Number(delayDays) : originalQuote.paymentDays,
                discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : originalQuote.discountPercentage,
                discountDays: discountDays !== undefined ? Number(discountDays) : originalQuote.discountDays,

                incotermCustomText: incotermCustomText !== undefined ? incotermCustomText : originalQuote.incotermCustomText,
                paymentCustomText: paymentCustomText !== undefined ? paymentCustomText : originalQuote.paymentCustomText,

                // V8 Commercial Fields
                salesCurrency: salesCurrency || originalQuote.salesCurrency,
                exchangeRate: exchangeRate !== undefined ? Number(exchangeRate) : originalQuote.exchangeRate,
                validityDuration: validityDuration !== undefined ? Number(validityDuration) : originalQuote.validityDuration,
                estimatedWeeks: estimatedWeeks !== undefined ? Number(estimatedWeeks) : originalQuote.estimatedWeeks,
                palletRequired: palletRequired !== undefined ? Boolean(palletRequired) : originalQuote.palletRequired,

                status: 'PENDING_REVISION',
                syncStatus: 'PENDING'
            }
        });

        // 5. Copy Items (Robustly)
        if (originalQuote.items.length > 0) {
            const itemsData = originalQuote.items.map((item: any) => ({
                quoteId: newQuote.id,
                tag: item.tag || '',
                material: newMaterialName || item.material, // Update material name if changed
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                length: item.length,
                width: item.width,
                thickness: item.thickness,
                finish: quality || item.finish, // Update finish/quality if changed

                // --- COSTING FIELDS (Crucial for avoiding data loss) ---
                numHoles: item.numHoles,
                numSlots: item.numSlots,
                unitPrice: unitPrice ? Number(unitPrice) : item.unitPrice,
                totalPrice: unitPrice ? (Number(unitPrice) * item.quantity) : item.totalPrice,
                netLength: item.netLength,
                netArea: item.netArea,
                netVolume: item.netVolume,
                totalWeight: item.totalWeight,
                unitPriceCad: item.unitPriceCad,
                totalPriceCad: item.totalPriceCad,
                stoneValue: item.stoneValue,
                primarySawingCost: item.primarySawingCost,
                secondarySawingCost: item.secondarySawingCost,
                profilingCost: item.profilingCost,
                finishingCost: item.finishingCost,
                anchoringCost: item.anchoringCost,
                unitTime: item.unitTime,
                totalTime: item.totalTime,
                unitPriceInternal: item.unitPriceInternal,
                totalPriceInternal: item.totalPriceInternal,
                productionStatus: 'Pending',
                productionNotes: item.productionNotes
            }));

            await prisma.quoteItem.createMany({
                data: itemsData
            });
        }

        // 5. Agent Delegation (No Local Copy)
        // We do NOT copy files here. The backend runs on Mac and cannot see the Windows Server (F:).
        // Instead, we mark the quote as PENDING_REVISION.
        // The PC Agent will pick this up via the Tunnel, find the original file on F:, copy/rename it, and save the result.

        console.log(`[Revise] Quote ${newQuote.reference} created. Status: PENDING_REVISION. Waiting for Agent.`);

        // Ensure status is correct for Polling
        await prisma.quote.update({
            where: { id: newQuote.id },
            data: {
                syncStatus: 'PENDING_REVISION'
            }
        });



        res.json(newQuote);

    } catch (error: any) {
        console.error("Revise Quote Error:", error);
        res.status(500).json({ error: 'Failed to revise quote', details: error.message });
    }
};

// --- AGENT POLLING ---

export const listPendingXmls = async (req: Request, res: Response) => {
    try {
        // Use process.cwd() to be safe (runs from /backend root)
        const pendingDir = path.join(process.cwd(), 'pending_xml');
        console.log(`[Agent-Poll] Checking dir: ${pendingDir}`);

        if (!fs.existsSync(pendingDir)) {
            console.log(`[Agent-Poll] Creating dir: ${pendingDir}`);
            fs.mkdirSync(pendingDir, { recursive: true });
        }

        const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.xml') || f.endsWith('.rak'));
        console.log(`[Agent-Poll] Found ${files.length} files.`);

        const result = files.map(f => ({
            filename: f
        }));

        res.json(result);
    } catch (error: any) {
        console.error("List Pending CRITICAL Error:", error);
        // Do not crash, return empty list
        res.json([]);
    }
};

export const downloadPendingXml = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        const pendingDir = path.join(process.cwd(), 'pending_xml');
        const safeName = path.basename(filename);
        const filePath = path.join(pendingDir, safeName);
        console.log(`[Agent-Download] Serving: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.download(filePath);
    } catch (error: any) {
        console.error("Download Pending Error:", error);
        res.status(500).json({ error: 'Failed to download file' });
    }
};

export const ackPendingXml = async (req: Request, res: Response) => {
    try {
        const { filename } = req.body;
        const pendingDir = path.join(process.cwd(), 'pending_xml');
        const safeName = path.basename(filename);
        const filePath = path.join(pendingDir, safeName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[Agent-Flow] Ack & Deleted: ${filePath}`);

            // Update Quote Status to SYNCED
            // Filename format: Ref.rak (or .xml)
            const reference = safeName.replace(/\.(rak|xml)$/i, '');
            const quote = await prisma.quote.findFirst({ where: { reference } });

            if (quote) {
                await prisma.quote.update({
                    where: { id: quote.id },
                    data: { syncStatus: 'SYNCED_PC' }
                });
                console.log(`[Agent-Flow] Quote ${reference} marked as SYNCED_PC.`);
            }
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Ack Error:", error);
        res.status(500).json({ error: 'Ack failed' });
    }
};

export const processAgentBundle = async (req: Request, res: Response) => {
    try {
        console.log('[Agent-Bundle] Received return bundle');
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const xmlFile = files['xml'] ? files['xml'][0] : null;
        const excelFile = files['excel'] ? files['excel'][0] : null;

        if (!xmlFile) {
            return res.status(400).json({ error: 'Missing XML return file' });
        }

        // 1. Parse XML and Update Database
        const xmlContent = fs.readFileSync(xmlFile.path, 'utf-8');
        const items = xmlService.parseExcelReturnXml(xmlContent);

        // Deduction of Reference from XML filename (Standard format: Ref.xml)
        let reference = xmlFile.originalname.replace(/\.(xml|rak)$/i, '');
        // Or send reference in body from Agent? Let's rely on filename for now as Agent preserves it.

        console.log(`[Agent-Bundle] Processing Quote Ref: ${reference}, found ${items.length} items`);

        const quote = await prisma.quote.findFirst({ where: { reference } });
        if (quote) {
            // Update Items
            await prisma.$transaction(async (prisma) => {
                await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
                if (items.length > 0) {
                    await prisma.quoteItem.createMany({
                        data: items.map(item => ({
                            quoteId: quote.id,
                            tag: item.tag,
                            lineNo: item.lineNo,
                            refReference: item.refReference,
                            product: item.product,
                            description: item.description,
                            material: item.material,
                            quantity: item.quantity,
                            unit: item.unit,
                            length: item.length,
                            width: item.width,
                            thickness: item.thickness,
                            netLength: item.netLength,
                            netArea: item.netArea,
                            netVolume: item.netVolume,
                            totalWeight: item.totalWeight,
                            unitPrice: item.unitPrice,
                            totalPrice: item.totalPrice,
                            // Internal/Dual
                            unitPriceCad: item.unitPriceCad,
                            unitPriceUsd: 0,
                            totalPriceCad: item.totalPriceCad || item.totalPriceInternal || 0, // Fallback to internal if CAD missing
                            totalPriceUsd: 0,
                            stoneValue: item.stoneValue,

                            // Manufacturing Costs (Added Fix)
                            primarySawingCost: item.primarySawingCost,
                            secondarySawingCost: item.secondarySawingCost,
                            profilingCost: item.profilingCost,
                            finishingCost: item.finishingCost,
                            anchoringCost: item.anchoringCost,

                            // Time (Added Fix)
                            unitTime: item.unitTime,
                            totalTime: item.totalTime,

                            // Internal Prices (Added Fix)
                            unitPriceInternal: item.unitPriceInternal,
                            totalPriceInternal: item.totalPriceInternal,

                            numHoles: 0,
                            numSlots: 0,
                        }))
                    });
                }
                const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                await prisma.quote.update({
                    where: { id: quote.id },
                    data: { totalAmount, syncStatus: 'Synced' }
                });
            });
            console.log(`[Agent-Bundle] DB Updated for ${reference}`);
        } else {
            console.warn(`[Agent-Bundle] Quote not found for ref ${reference}`);
        }


        // 2. Save Excel to Downloads
        if (excelFile) {
            const userDownloadsDir = path.join('/Users/thomasleguendekergolan', 'Downloads');
            // Hardcoded for verified user environment
            const destPath = path.join(userDownloadsDir, excelFile.originalname);

            fs.copyFileSync(excelFile.path, destPath);
            fs.unlinkSync(excelFile.path); // cleanup temp
            console.log(`[Agent-Bundle] Excel saved to: ${destPath}`);
        } else {
            console.warn(`[Agent-Bundle] No Excel file in bundle for ${reference}`);
        }

        // Cleanup XML temp
        if (fs.existsSync(xmlFile.path)) fs.unlinkSync(xmlFile.path);

        res.json({ success: true });

    } catch (error: any) {
        console.error("Agent Bundle Error:", error);
        res.status(500).json({ error: error.message });
    }
};
