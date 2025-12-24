import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resend = new Resend(process.env.RESEND_API_KEY);
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import { XmlService } from '../services/xmlService';
import { CalculationService } from '../services/calculationService';

import prisma from '../prisma';
// const prisma = new PrismaClient();
const excelService = new ExcelService();
const xmlService = new XmlService();
const calculationService = new CalculationService();
import { BackupService } from '../services/BackupService';
const backupService = new BackupService();

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
        const outputPath = path.join(process.cwd(), 'pending_xml', filename);

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

export const generatePdf = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[PDF] Trigger requested for Quote ID: ${id}`);

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                project: true,
                client: true,
                material: true
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // 1. Construct Paths (Assumption: Files are on F:\nxerp structure)
        const safe = (s: string | undefined | null) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');

        // Filename Logic (Must match what was generated)
        // Format: Ref_Client_Project_Material.xlsx
        const filename = `${safe(quote.reference)}_${safe(quote.client?.name)}_${safe(quote.project?.name)}_${safe(quote.material?.name)}.xlsx`;

        // Project Path (Target for standard files)
        const projectPath = `F:\\nxerp\\${quote.project?.name || 'Projet'}`;

        // 2. Generate RAK
        const xmlContent = await xmlService.generatePdfXml(quote, projectPath, filename);

        // 3. Save RAK
        // We use .rak extension, same naming convention as main file but maybe distinct?
        // Agent processes .rak files.
        const rakFilename = `${safe(quote.reference)}_PDF.rak`; // Add _PDF suffix to avoid collision/confusion
        const outputPath = path.join(process.cwd(), 'pending_xml', rakFilename);

        fs.writeFileSync(outputPath, xmlContent);
        console.log(`[PDF] RAK saved to ${outputPath}`);

        // 4. Update Status
        await prisma.quote.update({
            where: { id },
            data: {
                syncStatus: 'PENDING_PDF', // Specific status for frontend loader
                // Do not change main 'status' (Draft/Sent)
            }
        });

        res.json({ message: 'PDF Generation Queued', status: 'PENDING_PDF' });

    } catch (error: any) {
        console.error("Generate PDF Error:", error);
        res.status(500).json({ error: 'Failed to trigger PDF', details: error.message });
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

export const downloadSourceExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const quote = await prisma.quote.findUnique({ where: { id } });

        // 1. Try Specific File Path from DB
        if (quote && quote.excelFilePath) {
            // resolve relative paths like 'uploads/...' or absolute paths if any
            // Our system usually stores relative to project root or 'uploads'
            // Let's assume relative to backend root or uploads logic
            const filePath = path.join(process.cwd(), quote.excelFilePath);
            if (fs.existsSync(filePath)) {
                return res.download(filePath);
            }
        }

        // 2. Fallback: Default Template (PREVENT AGENT 404)
        // If the specific file is missing, the Agent needs a base file to work with.
        console.warn(`[Download-Source] Excel not found for ${id}. Serving Default Template as fallback.`);
        // Found in uploads/Modele de cotation defaut.xlsx
        const defaultTemplatePath = path.join(process.cwd(), 'uploads', 'Modele de cotation defaut.xlsx');

        if (fs.existsSync(defaultTemplatePath)) {
            const filename = quote ? `${quote.reference}.xlsx` : 'Modele_Defaut.xlsx';
            return res.download(defaultTemplatePath, filename);
        }

        // 3. Last Resort: 404
        console.error("Critical: Default Template also missing.");
        return res.status(404).json({ error: 'Excel file and Default Template missing.' });

    } catch (error) {
        console.error("Download Source Excel Error:", error);
        res.status(500).json({ error: 'Failed to download source Excel' });
    }
};

export const getQuoteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        let quote = await prisma.quote.findUnique({
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

        // PASSIVE POLLING: Check for return XML if pending
        // The frontend polls this endpoint. If we find the file, we process it NOW.
        // PASSIVE POLLING: ROBUST SYNC (Always check for XML)
        // Check for return XML regardless of status (handles manual drops)
        const safeRef = (quote.reference || id).replace(/[^a-zA-Z0-9-_]/g, '');
        const targetXmlName = `${safeRef}.xml`;
        const targetXmlPath = path.join('/Volumes/demo/echange', targetXmlName);

        if (fs.existsSync(targetXmlPath)) {
            console.log(`[Robust-Sync] Found Return XML at ${targetXmlPath}. Processing...`);
            try {
                await processReturnXmlFile(id, targetXmlPath);

                // RENAME to avoid infinite loop
                const processedPath = targetXmlPath + '.processed';
                fs.renameSync(targetXmlPath, processedPath);
                console.log(`[Robust-Sync] Processed & Renamed to ${processedPath}`);

                // Re-fetch to get updated items
                quote = await prisma.quote.findUnique({
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
            } catch (err) {
                console.error(`[Robust-Sync] Error processing XML: ${err}`);
                // Fallthrough to return original quote, don't crash the GET
            }
        }

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
                representativeId: representativeId !== undefined ? (representativeId || null) : undefined,

                // CRITICAL: Any update invalidates the PDF and Sync Status
                pdfFilePath: null,
                syncStatus: 'Draft'
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

        // INVALIDATE PDF on Item Add
        await prisma.quote.update({
            where: { id: quoteId },
            data: { pdfFilePath: null, syncStatus: 'Draft' }
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
        const deletedItem = await prisma.quoteItem.delete({
            where: { id: itemId }
        });

        // INVALIDATE PDF on Item Delete
        await prisma.quote.update({
            where: { id: deletedItem.quoteId },
            data: { pdfFilePath: null, syncStatus: 'Draft' }
        });

        res.json(deletedItem);
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

        // 3b. Resolve Defaults: If switching client, use Target Client's defaults. Otherwise, keep Original.
        let valMaterialId = originalQuote.materialId;
        let valIncoterm = originalQuote.incoterm;
        let valIncotermId = originalQuote.incotermId;
        let valIncotermCustomText = originalQuote.incotermCustomText;
        let valPaymentTermId = originalQuote.paymentTermId;
        let valPaymentCustomText = originalQuote.paymentCustomText;
        let valDeposit = originalQuote.depositPercentage;
        let valDiscount = originalQuote.discountPercentage;
        let valDiscountDays = originalQuote.discountDays;
        let valPaymentDays = originalQuote.paymentDays;
        let valCurrency = (originalQuote as any).salesCurrency;
        let valExchange = originalQuote.exchangeRate;
        let valRepId = originalQuote.representativeId;
        let valSemiStandard = (originalQuote as any).semiStandardRate;
        let valPalletPrice = (originalQuote as any).palletPrice;
        let valPalletRequired = (originalQuote as any).palletRequired;
        let valValidity = originalQuote.validityDuration ?? 30;

        if (newClientId && newClient) {
            console.log(`[Duplicate] Switching to Client: ${newClient.name}. applying Defaults...`);

            // Incoterm
            valIncotermId = newClient.incotermId || null;
            valIncoterm = newClient.incoterm || 'Ex Works';
            valIncotermCustomText = newClient.incotermCustomText || '';

            // Payment Terms
            valPaymentTermId = newClient.paymentTermId || null;
            valPaymentCustomText = newClient.paymentCustomText || '';
            valPaymentDays = newClient.paymentDays || 0;
            valDeposit = newClient.depositPercentage || 0;
            valDiscount = newClient.discountPercentage || 0;
            valDiscountDays = newClient.discountDays || 0;

            // Commercial
            valCurrency = newClient.salesCurrency || 'CAD';
            valExchange = newClient.exchangeRate || 1.0;
            valSemiStandard = newClient.semiStandardRate;
            valPalletPrice = newClient.palletPrice;
            valPalletRequired = newClient.palletRequired;
            valValidity = newClient.validityDuration || 30;

            // Representative (Try to resolve ID from string name if needed, or if ThirdParty has repId)
            // Note: Schema might not have representativeId on ThirdParty, checks QuoteForm...
            // QuoteForm sends `representativeId` from state. `selectedClient.repName` is used to default.
            if (newClient.repName) {
                const allReps = await prisma.representative.findMany();
                const foundRep = allReps.find(r => `${r.firstName} ${r.lastName}` === newClient.repName);
                if (foundRep) {
                    valRepId = foundRep.id;
                    console.log(`[Duplicate] Resolved Rep: ${foundRep.firstName} ${foundRep.lastName}`);
                } else {
                    console.warn(`[Duplicate] Could not resolve Rep from name: ${newClient.repName}`);
                }
            }
        }

        // 4. Create Duplicate Quote
        const newQuote = await prisma.quote.create({
            data: {
                reference: newReference,
                projectId: originalQuote.projectId,
                thirdPartyId: finalClientId,
                contactId: finalContactId,
                currency: valCurrency, // Use Sales Currency as main or keep legacy? Schema uses currency. QuoteForm sends salesCurrency.
                status: 'PENDING_CREATION', // Hidden until PC Agent returns
                version: 1,
                estimatedWeeks: originalQuote.estimatedWeeks,
                materialId: valMaterialId,
                exchangeRate: valExchange,
                incoterm: valIncoterm,
                incotermId: valIncotermId,
                incotermCustomText: valIncotermCustomText,
                validUntil: undefined,
                validityDuration: valValidity,
                dateIssued: new Date(),
                semiStandardRate: valSemiStandard,
                salesCurrency: valCurrency,
                palletPrice: valPalletPrice,
                palletRequired: valPalletRequired,
                paymentTermId: valPaymentTermId,
                paymentDays: valPaymentDays,
                depositPercentage: valDeposit,
                discountPercentage: valDiscount,
                discountDays: valDiscountDays,
                paymentCustomText: valPaymentCustomText,
                representativeId: valRepId,
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
        // 6. GENERATE RAK TRIGGER
        const xmlService = new (require('../services/xmlService').XmlService)();

        // Helper for filenames
        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_');

        // Fetch full new quote first as it's needed for both paths (XML generation)
        const fullNewQuote = await prisma.quote.findUnique({
            where: { id: newQuote.id },
            include: {
                material: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } },
                project: true,
                contact: true,
                representative: true,
                incotermRef: true,
                paymentTerm: true
            }
        });

        // CHECK SOURCE STATUS: Does the source file actually exist?
        // User reported crashes when copying from a quote that wasn't fully generated (e.g. 'Draft' or missing file).
        const isSourceAvailable = (originalQuote.syncStatus === 'Synced' || originalQuote.syncStatus === 'Calculated (Agent)');

        // Prepare RAK Content
        let xmlContent = '';
        // Prepare Filename (Standard RAK name)
        const rakFilename = `${safeName(newReference)}.rak`;

        // FIX: The Agent polls the API, which reads from 'pending_xml' in the backend folder.
        // We must write to this local folder, NOT C:\Lotus... directly (unless mapped).
        // Since Agent is local and polling API, API needs the file in pending_xml.
        const exchangeDir = path.join(process.cwd(), 'pending_xml');
        const rakPath = path.join(exchangeDir, rakFilename);

        if (isSourceAvailable) {
            // === SCENARIO A: SOURCE EXISTS -> COPY (RECOPIER) ===
            console.log(`[Duplicate] Source Excel Available (Status: ${originalQuote.syncStatus}). Using 'RECOPIER' workflow.`);

            // Paths construction for Automate
            const folderName = project.name || 'Projet';

            // Use underscores for consistency (User requirement)
            const safeNameU = (s: string | undefined) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');

            const safeProjectName = safeNameU(project.name);
            const basePath = 'F:\\nxerp';

            // Source Path
            const oldClientName = safeNameU(originalQuote.client?.name);
            const oldMaterialName = safeNameU(originalQuote.material?.name);
            const oldRef = safeNameU(originalQuote.reference);
            const oldFilename = `${oldRef}_${oldClientName}_${safeProjectName}_${oldMaterialName}.xlsx`;
            const oldPath = `${basePath}\\${folderName}\\${oldFilename}`;

            // Target Path
            const newClientName = safeNameU(newClient?.name || 'Unknown');
            const newRef = safeNameU(newReference);
            const rProjectName = safeNameU(project.name || 'Projet');
            // FULL FORMAT: Ref_Client_Project_Material
            const newFilename = `${newRef}_${newClientName}_${rProjectName}_${oldMaterialName}.xlsx`;
            const newPath = `${basePath}\\${folderName}\\${newFilename}`;

            console.log(`[Duplicate] Predicted Path: ${newPath}`);

            console.log(`[Duplicate] Copying: ${oldPath} -> ${newPath}`);

            // Generate "Recopier" XML
            xmlContent = await xmlService.generateDuplicateXml(fullNewQuote, oldPath, newPath, originalQuote.reference);

            // Update DB with predicted path (will be overwritten by Agent Return if successful)
            await prisma.quote.update({
                where: { id: newQuote.id },
                data: { excelFilePath: newPath }
            });

        } else {
            // === SCENARIO B: SOURCE MISSING -> GENERATE NEW (EMCOT) ===
            console.warn(`[Duplicate] Source Excel MISSING (Status: ${originalQuote.syncStatus}). Fallback to 'GENERER' (New Excel).`);

            // Generate Standard Quote XML (Emcot)
            // This tells Agent to create a fresh Excel from the DB data we just cloned.
            xmlContent = await xmlService.generateQuoteXml(fullNewQuote);

            // Note: excelFilePath will be set when Agent returns with the result.
        }

        // 7. Write RAK File to Pending XML (for API pickup)
        if (!fs.existsSync(exchangeDir)) {
            try { fs.mkdirSync(exchangeDir, { recursive: true }); } catch (e) { }
        }

        fs.writeFileSync(rakPath, xmlContent, 'utf8');
        console.log(`✅ [Duplicate] RAK Generated: ${rakPath}`);

        res.json({ message: 'Duplicate initiated', id: newQuote.id, reference: newReference });

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
                incotermRef: true, // Fix: Ensure Incoterm data is available for XML
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
                    data: items.map((item: any) => ({
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
            const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
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
                    data: items.map((item: any) => ({
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
        const totalAmount = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
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
        console.log(`[Reintegrate] START. ID=${id}, File=${file?.originalname}`);
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { project: true, material: true, client: true }
        });

        if (!quote || !quote.project) {
            console.error(`[Reintegrate] Quote or Project Not Found for ID ${id}`);
            return res.status(404).json({ error: 'Quote or Project not found' });
        }

        // Rename logic to persist ORIGINAL filename (for PC matching)
        const originalName = file.originalname;
        const filename = `${id}___${originalName}`;

        // FIX: Use process.cwd() to match Multer config and avoid __dirname issues
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const finalPath = path.join(uploadsDir, filename);

        // Move/Rename
        try {
            fs.renameSync(file.path, finalPath);
        } catch (mvErr) {
            console.error(`[Reintegrate] Rename FAILED: ${mvErr}`);
            try {
                fs.copyFileSync(file.path, finalPath);
                fs.unlinkSync(file.path);
            } catch (copyErr) {
                console.error(`[Reintegrate] Copy/Unlink ALSO FAILED: ${copyErr}`);
                // Throw to return 500
                throw new Error(`Upload Move Failed: ${copyErr}`);
            }
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

        const sanitizeWindows = (s: string) => (s || '').replace(/[<>:"/\\|?*]/g, '');
        const pName = sanitizeWindows(quote.project.name);
        const fName = originalName;

        // Target path on PC (F:)
        const targetPathOnPC = `F:\\nxerp\\${pName}\\${fName}`;
        console.log(`[Reintegrate] Target Path on PC: ${targetPathOnPC}`);

        const rakContent = await xmlService.generateReintegrationXml(targetPathOnPC, id);
        console.log(`[Reintegrate] RAK Content Generated (Length: ${rakContent.length})`);

        // Save RAK 
        const safeRef = (quote.reference || id).replace(/[^a-zA-Z0-9-_]/g, '');
        const rakFilename = `${safeRef}.rak`;

        // Note: The Agent polls pending_xml.
        // FIX: Use process.cwd() for consistency with listPendingXmls
        const pendingDir = path.join(process.cwd(), 'pending_xml');
        console.log(`[Reintegrate] Pending Dir: ${pendingDir}`);

        if (!fs.existsSync(pendingDir)) {
            console.log(`[Reintegrate] Creating pending_xml dir...`);
            fs.mkdirSync(pendingDir, { recursive: true });
        }

        const rakFinalPath = path.join(pendingDir, rakFilename);
        fs.writeFileSync(rakFinalPath, rakContent);

        if (fs.existsSync(rakFinalPath)) {
            console.log(`[Reintegrate] RAK Trigger CONFIRMED created at: ${rakFinalPath}`);
        } else {
            console.error(`[Reintegrate] CRITICAL: File failed to appear at ${rakFinalPath}`);
        }

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

// Helper to process return XML (Refactored for Passive Polling)
export const processReturnXmlFile = async (quoteId: string, targetPath: string) => {
    console.log(`[Process-XML] Processing Return XML for ${quoteId} at ${targetPath}`);
    const xmlContent = fs.readFileSync(targetPath, 'utf-8');
    // Parse items AND metadata (cible)
    const parsed = await xmlService.parseExcelReturnXml(xmlContent);
    // Handle legacy return (array) vs new object
    const items = Array.isArray(parsed) ? parsed : parsed.items;
    const metadata = Array.isArray(parsed) ? {} : parsed.metadata;

    // Transaction: Delete existing items for this quote and create new ones
    await prisma.$transaction(async (tx) => {
        // 0. Update Quote Path if provided by Agent
        let updateData: any = { syncStatus: 'Synced' }; // Mark as Synced

        if (metadata && metadata.cible) {
            console.log(`[Import] Updating Excel Path from Agent Report: ${metadata.cible}`);
            updateData.excelFilePath = metadata.cible;
        }

        await tx.quote.update({
            where: { id: quoteId },
            data: updateData
        });

        // 1. Delete existing items
        await tx.quoteItem.deleteMany({ where: { quoteId: quoteId } });

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
                    quoteId: quoteId,
                    lineNo: item.no ? String(item.no) : null,      // NEW: Maps to NL
                    refReference: item.ref ? String(item.ref) : null, // NEW: Maps to REF
                    product: item.product ? String(item.product) : null, // NEW: Maps to PDT
                    description: item.description || 'Imported Item',
                    material: item.material || 'N/A',
                    length: item.length || 0,
                    width: item.width || 0,
                    thickness: item.thickness || 0,
                    quantity: typeof item.quantity === 'number' ? item.quantity : 1,
                    unitPrice: item.unitPrice || 0,
                    totalPrice: item.totalPrice || 0,
                    // Additional fields
                    netLength: item.netLength,
                    netArea: item.netArea,
                    netVolume: item.netVolume,
                    totalWeight: item.totalWeight,
                    // FIX: Map available CAD price to Internal Price for UI display
                    unitPriceInternal: item.unitPriceCad || 0,
                    totalPriceInternal: item.totalPriceCad || 0,

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

    console.log(`[Process-XML] Successfully processed ${items.length} items for ${quoteId}`);
    return items;
};

export const fetchReturnXml = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { filename } = req.body; // e.g., envoi000001.rak

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
        const updatedItems = await processReturnXmlFile(id, targetPath);
        // Return updated items to frontend
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

        // STRATEGY: Prefer Agent-Generated PDF if available
        if (quote.syncStatus === 'Synced' && quote.pdfFilePath) {
            const possiblePath = path.join(process.cwd(), quote.pdfFilePath);
            if (fs.existsSync(possiblePath)) {
                // Ensure proper headers for inline viewing
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${path.basename(possiblePath)}"`);

                const fileStream = fs.createReadStream(possiblePath);
                return fileStream.pipe(res);
            }
        }

        // REMOVED LEGACY FALLBACK (User Request: "NO FAKE MODEL")
        console.warn(`⚠️ [downloadQuotePdf] No Agent PDF found for ${quote.reference}. Returning 404.`);
        return res.status(404).json({ error: 'Aucun PDF officiel (Agent) disponible. Utilisez "Créer PDF".' });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};


// --- HELPER: Ensure Agent PDF Exists ---
const ensureAgentPdf = async (quote: any): Promise<string> => {
    // 1. Check if we already have a valid PDF linked and existing
    if (quote.pdfFilePath) {
        let currentPath = quote.pdfFilePath;
        if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath);

        if (fs.existsSync(currentPath)) {
            console.log(`✅ [ensureAgentPdf] Found existing PDF at ${currentPath}`);
            return currentPath;
        } else {
            console.warn(`⚠️ [ensureAgentPdf] DB says ${currentPath} but file missing. Triggering regeneration.`);
        }
    }

    // 2. Trigger Agent Generation (RAK)
    console.log(`🚀 [ensureAgentPdf] Triggering Window Agent for Quote ${quote.reference}...`);

    // Generate XML content
    let rep = quote.representative;
    if (!rep && quote.client?.repName) {
        const allReps = await prisma.representative.findMany();
        rep = allReps.find(r => `${r.firstName} ${r.lastName}` === quote.client?.repName) || null;
    }
    const xmlContent = await xmlService.generateQuoteXml(quote, rep);

    // Save .rak file to pending_xml
    const pendingDir = path.join(process.cwd(), 'pending_xml');
    if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });

    const rakFilename = `${quote.reference}.rak`;
    const rakPath = path.join(pendingDir, rakFilename);
    fs.writeFileSync(rakPath, xmlContent);
    console.log(`📄 [ensureAgentPdf] RAK file deposited: ${rakPath}`);

    // 3. Wait/Poll for the Agent to return the PDF
    // The Agent should process the RAK, generate PDF, upload it to /uploads via API, and update the quote.
    // We poll the DB or the uploads folder.

    console.log(`⏳ [ensureAgentPdf] Waiting for Agent to return PDF... (Max 30s)`);
    const maxRetries = 30; // 30 seconds
    const expectedFilename = `${quote.reference}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const expectedPath = path.join(uploadsDir, expectedFilename);

    for (let i = 0; i < maxRetries; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Sleep 1s

        // Check if file appeared
        if (fs.existsSync(expectedPath)) {
            console.log(`🎉 [ensureAgentPdf] PDF appeared at ${expectedPath}!`);

            // Update DB if not already done by the Agent's callback
            await prisma.quote.update({
                where: { id: quote.id },
                data: { pdfFilePath: `uploads/${expectedFilename}`, syncStatus: 'Synced' }
            });

            return expectedPath;
        }
    }

    throw new Error("Timeout: Agent did not return PDF in time. Is the Agent running?");
};

// Initialize Resend


export const emitQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true, representative: true }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // 1. Determine Recipient
        // Prefer Contact Email, fallback to Client Email (if schema allowed, but let's stick to Contact)
        const recipientEmail = quote.contact?.email;
        if (!recipientEmail) {
            return res.status(400).json({ error: 'Aucun email trouvé pour le contact associé.' });
        }

        console.log(`[EMIT] Preparing to email ${recipientEmail} for Quote ${quote.reference}`);

        // 2. Obtain PDF Buffer
        // Strategy: 
        // A. If we have a synced PDF file path (Agent generated), use it. (Highest fidelity)
        // B. Fallback: Generate fresh PDF using PdfService (Node).

        let pdfBuffer: Buffer;
        let pdfFilename = `${quote.reference}.pdf`;

        if (quote.syncStatus === 'Synced' && quote.pdfFilePath) {
            const possiblePath = path.join(process.cwd(), quote.pdfFilePath); // 'uploads/XXX.pdf'
            if (fs.existsSync(possiblePath)) {
                console.log(`[EMIT] Using existing Agent-generated PDF: ${possiblePath}`);
                pdfBuffer = fs.readFileSync(possiblePath);
                // Extract filename from path if possible, or keep generated name
                pdfFilename = path.basename(possiblePath);
            } else {
                console.warn(`[EMIT] Synced PDF path found but file missing: ${possiblePath}. Generating fallback PDF.`);
                pdfBuffer = await PdfService.generateQuotePdf(quote as any);
            }
        } else {
            console.log(`[EMIT] No existing PDF found (Status: ${quote.syncStatus}). Requesting Agent PDF.`);
            try {
                const pdfPath = await ensureAgentPdf(quote);
                pdfBuffer = fs.readFileSync(pdfPath);
                pdfFilename = path.basename(pdfPath);
            } catch (agentError) {
                console.error("Agent PDF Error during Emit:", agentError);
                // Fail gracefull or hard? User wants REAL PDF.
                // We will throw error so they know it failed.
                return res.status(503).json({
                    error: "Impossible d'obtenir le PDF officiel de l'Agent.",
                    details: "L'agent Windows n'a pas répondu à temps. Vérifiez le tunnel."
                });
            }
        }

        // 3. Send Email via Resend
        const { message, subject } = req.body;

        let emailHtml = '';

        if (message) {
            // Convert newlines to <br> for HTML email
            const formattedMessage = message.replace(/\n/g, '<br>');
            emailHtml = `<p>${formattedMessage}</p>`;
        } else {
            // Fallback default
            emailHtml = `
                <p>Bonjour ${quote.contact?.firstName || 'Client'},</p>
                <p>Veuillez trouver ci-joint votre soumission <strong>${quote.reference}</strong> pour le projet <strong>${quote.project?.name}</strong>.</p>
                <p>Cordialement,</p>
                <p><strong>L'équipe Granite DRC</strong></p>
            `;
        }

        const { data, error } = await resend.emails.send({
            from: 'Soumissions Granite DRC <onboarding@resend.dev>',
            // RESTRICTION RESEND mode Test: Envoi uniquement autorisé vers l'email du compte
            // to: [recipientEmail],
            to: ['thomasldk@granitedrc.com'], // OVERRIDE DEV MODE

            // cc: quote.representative?.email ? [quote.representative.email] : undefined,
            subject: subject || `Soumission pour le Projet ${quote.project?.name || quote.reference}`,
            html: emailHtml,
            attachments: [
                {
                    filename: pdfFilename,
                    content: pdfBuffer,
                },
            ],
        });

        if (error) {
            console.error('Resend API Error:', error);
            return res.status(500).json({ error: 'Failed to send email via Resend', details: error });
        }

        console.log(`[EMIT] Email sent successfully! ID: ${data?.id}`);

        // 4. Update Status
        const updatedQuote = await prisma.quote.update({
            where: { id },
            data: { status: 'Sent' }
        });

        res.json({ message: 'Quote emitted successfully', quote: updatedQuote, emailId: data?.id });

    } catch (error: any) {
        console.error('Error emitting quote:', error);
        res.status(500).json({ error: 'Failed to emit quote', details: error.message });
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
                servePath = path.join(process.cwd(), servePath);
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
                // Clean the ID prefix (separated by ___ only)
                // WARNING: Do NOT split on '__' (double underscore) as it is used in filenames (Client__Project)
                if (downloadName.includes('___')) {
                    downloadName = downloadName.split('___').slice(1).join('___');
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
            console.warn(`[Download] Network path invalid: ${projectPath}. Fallback to Source.`);
            return downloadSourceExcel(req, res);
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
        console.log(`[Revise] Body materialId: ${materialId}, quality: ${quality}, unitPrice: ${unitPrice}`);

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
        console.log(`[Revise] Found Original Quote ${originalQuote.reference} with ${originalQuote.items.length} items.`);

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

        // --- RAK GENERATION FOR REVISION ---
        // 1. Fetch NEW Quote Full Data (needed for XML generation)
        const quoteFull = await prisma.quote.findUnique({
            where: { id: newQuote.id },
            include: {
                items: true,
                project: true,
                material: true,
                contact: true,
                paymentTerm: true,
                representative: true,
                incotermRef: true, // Fix: Include Incoterm Config for XML generation
                client: { include: { addresses: true, contacts: true, paymentTerm: true } }
            }
        });

        if (quoteFull) {
            // Rep Logic
            let rep = quoteFull.representative;
            if (!rep && quoteFull.client?.repName) {
                const allReps = await prisma.representative.findMany();
                rep = allReps.find(r => `${r.firstName} ${r.lastName}` === quoteFull.client?.repName) || null;
            }

            // Path Helpers (Same as xmlService for consistency)
            const safe = (s: string | undefined) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const targetBase = 'f:\\nxerp';

            // Old Filename (Modele)
            // Use Short Reference for ROBUSTNESS (Agent will search startsWith(Ref))
            // This handles cases where the file on disk is "DRC...xlsx" OR "DRC..._Client...xlsx"
            const oldFilename = `${safe(originalQuote.reference)}`;

            // New Filename (Target)
            const newClientName = quoteFull.client?.name;
            const newProjectName = quoteFull.project?.name;
            const newMaterialNameUsed = quoteFull.material?.name;
            const newFilename = `${safe(newQuote.reference)}_${safe(newClientName)}_${safe(newProjectName)}_${safe(newMaterialNameUsed)}.xlsx`;

            const ciblePath = `${targetBase}\\${newProjectName || 'Projet'}\\${newFilename}`;

            // 6. Generate XML using Revision Service
            const revisionData = {
                sourceQuoteId: originalQuote.id,
                cible: ciblePath,
                // USER REQUEST: ancienNom/nouveauNom MUST BE THE REFERENCE ONLY, NOT FILENAME
                ancienNom: originalQuote.reference,
                nouveauNom: newQuote.reference,
                ancienCouleur: originalQuote.material?.name || '',
                nouveauCouleur: quoteFull.material?.name || '',
                ancienQualite: originalQuote.material?.quality || '',
                nouvelleQualite: quoteFull.material?.quality || ''
            };

            const xmlContent = await xmlService.generateQuoteXml(quoteFull, rep, revisionData);

            // Save to pending_xml
            const safeRef = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
            const rakFilename = `${safeRef(newQuote.reference)}.rak`;
            const pendingDir = path.join(process.cwd(), 'pending_xml');

            let outputPath = '';
            try {
                if (!fs.existsSync(pendingDir)) {
                    console.log(`[Revise] Creating dir: ${pendingDir}`);
                    fs.mkdirSync(pendingDir, { recursive: true });
                }
                outputPath = path.join(pendingDir, rakFilename);
                fs.writeFileSync(outputPath, xmlContent);
                console.log(`[Revise] RAK saved to ${outputPath}`);
            } catch (fsError: any) {
                console.error("[Revise] FS Error:", fsError);
                res.header("Access-Control-Allow-Origin", "*"); // FORCE CORS
                return res.status(500).json({ error: 'File System Error', details: `FS_FAIL: ${fsError.message} (Path: ${pendingDir})` });
            }

            console.log(`[Revise] Quote ${newQuote.reference} created. Status: PENDING_REVISION. Waiting for Agent.`);

            // Ensure status is correct for Polling
            await prisma.quote.update({
                where: { id: newQuote.id },
                data: {
                    syncStatus: 'PENDING_REVISION' // or 'Calculated (Agent)' will be set later
                }
            });

            res.json(newQuote);
        }
    } catch (error: any) {
        console.error("Revise Quote Error:", error);
        res.header("Access-Control-Allow-Origin", "*"); // FORCE CORS
        res.status(500).json({ error: 'Failed to revise quote', details: `CRITICAL: ${error.message}` });
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

            // [Agent-Flow] File Picked Up. Waiting for bundle return...
            console.log(`[Agent-Flow] Quote ${reference} picked up by Agent (Pending -> Processing).`);
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
        const pdfFile = files['pdf'] ? files['pdf'][0] : null;

        if (!xmlFile) {
            return res.status(400).json({ error: 'Missing XML return file' });
        }

        // --- SAFETY BACKUP (USER RULE) ---
        // console.log('🛡️ [Agent-Bundle] Triggering SAFETY BACKUP before update...');
        // await backupService.performBackupToDisk(); // Optimization: DISABLED to prevent 502 OOM on Railway (Hourly backup suffices)
        // console.log('✅ [Agent-Bundle] Safety Backup Complete.');

        // 1. Parse XML and Update Database
        const xmlContent = fs.readFileSync(xmlFile.path, 'utf-8');
        // console.log(`[Agent-Bundle] XML Content (Preview): ${xmlContent.substring(0, 500)}`);

        // --- ETIQUETTE / LABEL HANDLING ---
        // If this is a Label Return, we just stash the Excel for the User to download.
        // We do NOT update any Quote/DB.
        if (xmlContent.includes("type='Etiquette'") || xmlContent.includes('type="Etiquette"')) {
            console.log('📦 [Agent-Bundle] Label (Etiquette) Bundle Detected. Saving files only.');

            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            if (excelFile) {
                const dest = path.join(uploadsDir, excelFile.originalname);
                fs.copyFileSync(excelFile.path, dest);
                console.log(`✅ [Agent-Bundle] Label Excel Saved: ${dest}`);
                try { fs.unlinkSync(excelFile.path); } catch (e) { }
            }
            // If PDF label logic is ever restored...
            if (pdfFile) {
                const dest = path.join(uploadsDir, pdfFile.originalname);
                fs.copyFileSync(pdfFile.path, dest);
                console.log(`✅ [Agent-Bundle] Label PDF Saved: ${dest}`);
                try { fs.unlinkSync(pdfFile.path); } catch (e) { }
            }

            // Clean XML
            try { fs.unlinkSync(xmlFile.path); } catch (e) { }

            return res.json({ success: true, mode: 'label' });
        }

        // --- END ETIQUETTE HANDLING ---

        // FIX: Handle Object Return ({ items, metadata }) vs Legacy Array
        const parsed = xmlService.parseExcelReturnXml(xmlContent);
        const items = Array.isArray(parsed) ? parsed : parsed.items;

        // Deduction of Reference from XML filename
        // Standard: Ref.xml
        // PDF: Ref_PDF.xml -> Ref
        let reference = xmlFile.originalname.replace(/\.(xml|rak)$/i, '');
        // FIX: Strip _PDF suffix if present
        if (reference.endsWith('_PDF')) {
            reference = reference.substring(0, reference.length - 4);
        }

        console.log(`[Agent-Bundle] Processing Quote Ref: ${reference}, found ${items.length} items`);

        const quote = await prisma.quote.findFirst({ where: { reference } });
        if (quote) {
            // Update Items Transaction
            await prisma.$transaction(async (prisma) => {
                // SAFETY: Only overwrite items if we actually received items from the XML.
                // For PDF generation, XML might be empty or same as before?
                // If items.length is 0, we assume it's just a PDF return?
                // Check if items are meaningful.
                if (items.length > 0) {
                    console.log(`[Agent-Bundle] Overwriting ${quote.id} with ${items.length} new items from XML.`);
                    // 1. Clear existing items
                    await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });

                    // 2. Insert new items
                    // MAPPING: Use fields from xmlService output directly
                    // xmlService returns item.no (NL), item.ref (REF), item.product (PDT)
                    const quotaItems = items.map((i: any) => {
                        console.log(`[Agent-Bundle-DEBUG] Item ${i.no} (Ref: ${i.ref}): CAD=${i.unitPriceCad}, Internal=${i.unitPriceInternal}, Mapping to Internal=${i.unitPriceCad}`);
                        return {
                            quoteId: quote.id,
                            tag: i.tag,
                            lineNo: i.no,            // Mapped
                            refReference: i.ref,     // Mapped
                            product: i.product,
                            description: i.description,
                            material: i.material,
                            quantity: i.quantity,
                            unit: i.unit,
                            length: i.length,
                            width: i.width,
                            thickness: i.thickness,
                            netLength: i.netLength,
                            netArea: i.netArea,
                            netVolume: i.netVolume,
                            totalWeight: i.totalWeight,
                            unitPrice: i.unitPrice,
                            totalPrice: i.totalPrice,

                            // FIX: Map available CAD price to Internal Price for UI display
                            unitPriceInternal: i.unitPriceCad || 0,
                            totalPriceInternal: i.totalPriceCad || 0,

                            unitPriceCad: i.unitPriceCad,
                            totalPriceCad: i.totalPriceCad,

                            stoneValue: i.stoneValue,
                            primarySawingCost: i.primarySawingCost,
                            secondarySawingCost: i.secondarySawingCost,
                            profilingCost: i.profilingCost,
                            finishingCost: i.finishingCost,
                            anchoringCost: i.anchoringCost,
                            unitTime: i.unitTime,
                            totalTime: i.totalTime
                        }; // Return object
                    }); // End Map
                    await prisma.quoteItem.createMany({ data: quotaItems });
                }
            });
            console.log(`[Agent-Bundle] DB Updated for ${reference}`);
        } else {
            console.warn(`[Agent-Bundle] Quote not found for ref ${reference}`);
        }

        // 2. Save Excel
        if (excelFile) {
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const backendFilename = excelFile.originalname;
            const backendPath = path.join(uploadsDir, backendFilename);

            fs.copyFileSync(excelFile.path, backendPath);
            console.log(`[Agent-Bundle] Excel saved to Uploads: ${backendPath}`);
            fs.unlinkSync(excelFile.path);

            await new Promise(resolve => setTimeout(resolve, 2000));
            if (quote) {
                const totalAmount = items.length > 0 ? items.reduce((sum: number, i: any) => sum + i.totalPrice, 0) : quote.totalAmount;
                await prisma.quote.update({
                    where: { id: quote.id },
                    data: {
                        totalAmount,
                        syncStatus: 'Synced',
                        status: 'Draft',
                        excelFilePath: `uploads/${backendFilename}`
                    }
                });
            }
        }

        // 3. Save PDF (NEW)
        // 3. Save PDF (NEW)
        if (pdfFile) {
            console.log(`[Agent-Bundle] PDF File Received: ${pdfFile.originalname}`);
            const uploadsDir = path.join(process.cwd(), 'uploads');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            // TRUST THE AGENT: Agent derives PDF name from the Excel RAK target.
            // It sends the correct "Long Name" (e.g. Ref_Client_Project.pdf).
            const pdfFilename = pdfFile.originalname;
            console.log(`[Agent-Bundle] Using PDF Filename from Agent: ${pdfFilename}`);

            const backendPdfPath = path.join(uploadsDir, pdfFilename);

            // A. Save to Backend (Critical)
            fs.copyFileSync(pdfFile.path, backendPdfPath);
            console.log(`[Agent-Bundle] PDF saved to Uploads: ${backendPdfPath}`);

            // B. Update Database (Critical)
            if (quote) {
                try {
                    await prisma.quote.update({
                        where: { id: quote.id },
                        data: {
                            pdfFilePath: `uploads/${pdfFilename}`,
                            syncStatus: 'Synced' // Unlock UI
                        }
                    });
                    console.log(`✅ [Agent-Bundle] DB Updated: Quote ${quote.reference} has PDF: uploads/${pdfFilename}`);
                } catch (dbErr) {
                    console.error(`❌ [Agent-Bundle] DB Update Failed for PDF: ${dbErr}`);
                }
            } else {
                console.warn(`⚠️ [Agent-Bundle] No quote found to link PDF to.`);
            }

            // C. Save to User Downloads (Mac - Optional Convenience)
            try {
                const homedir = os.homedir();
                const userDownloads = path.join(homedir, 'Downloads');
                if (fs.existsSync(userDownloads)) {
                    fs.copyFileSync(backendPdfPath, path.join(userDownloads, pdfFilename));
                    console.log(`✅ [Agent-Bundle] Copied PDF to User Downloads: ${path.join(userDownloads, pdfFilename)}`);
                }
            } catch (dlErr: any) {
                console.warn(`⚠️ [Agent-Bundle] Failed to copy PDF to user downloads: ${dlErr}`);
            }

            // Cleanup Temp
            try {
                if (fs.existsSync(pdfFile.path)) fs.unlinkSync(pdfFile.path);
            } catch (cleanupErr) { }
        }

        // Cleanup XML
        if (fs.existsSync(xmlFile.path)) fs.unlinkSync(xmlFile.path);

        res.json({ success: true });

    } catch (error: any) {
        console.error("Agent Bundle Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const serveQuotePdf = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`🔍 [serveQuotePdf] Request for Quote ID: ${id}`);

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true, representative: true, material: true, paymentTerm: true }
        });

        if (!quote) {
            return res.status(404).json({ error: 'Soumission introuvable.' });
        }

        try {
            // FORCE AGENT PDF
            const pdfPath = await ensureAgentPdf(quote);

            console.log(`✅ [serveQuotePdf] Serving file: ${pdfPath}`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="Soumission_${quote.reference}.pdf"`);
            const fileStream = fs.createReadStream(pdfPath);
            fileStream.pipe(res);

        } catch (err: any) {
            console.error(`❌ [serveQuotePdf] Error:`, err);
            // Fallback to error message, DO NOT generate "fake" PDF
            res.status(503).json({
                error: "Le PDF n'est pas encore prêt.",
                details: "L'agent Windows n'a pas répondu à temps (30s) ou le tunnel est lent. Réessayez."
            });
        }

    } catch (error: any) {
        console.error('❌ [serveQuotePdf] Server Error:', error);
        res.status(500).json({ error: 'Erreur serveur.', details: error.message });
    }
};

// Check if PDF physically exists
export const checkPdfStatus = async (req: Request, res: Response) => {
    // console.log(`[checkPdfStatus] Checking for ${req.params.id}`);
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({ where: { id } });

        if (!quote || !quote.pdfFilePath) {
            return res.json({ ready: false });
        }

        const fullPath = path.join(process.cwd(), quote.pdfFilePath);
        if (fs.existsSync(fullPath)) {
            return res.json({ ready: true });
        } else {
            return res.json({ ready: false });
        }
    } catch (error) {
        console.error("Check PDF Status Error:", error);
        res.status(500).json({ error: 'Check failed' });
    }
};
