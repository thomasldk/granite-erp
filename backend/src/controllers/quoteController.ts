import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import nodemailer from 'nodemailer';
import { ExcelService } from '../services/excelService';
import { PdfService } from '../services/pdfService';
import { XmlService } from '../services/xmlService';



const prisma = new PrismaClient();
const excelService = new ExcelService();
const xmlService = new XmlService();

// --- QUOTES ---

export const generateQuoteExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const quote = await prisma.quote.findUnique({
            where: { id: id },
            include: {
                items: true,
                project: {
                    include: { location: true }
                }, // Fetch Project info & Location
                client: {
                    include: {
                        contacts: true, // Fetch contacts
                        addresses: true // Fetch addresses
                    }
                },
                material: true // Fetch Material info
            }
        });

        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        const filePath = await excelService.generateQuoteExcel(quote);

        // Download file
        res.download(filePath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
            }
            // Optionally delete file after send? 
            // fs.unlinkSync(filePath); 
        });

    } catch (error) {
        console.error("Error generating Excel:", error);
        res.status(500).json({ error: 'Failed to generate Excel file' });
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
            include: {
                client: true,
                project: true,
                items: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quotes' });
    }
};

export const getQuoteById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                client: true,
                project: true,
                items: true
            }
        });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching quote' });
    }
};

export const createQuote = async (req: Request, res: Response) => {
    const { reference, projectId, thirdPartyId, contactId, currency, estimatedWeeks, materialId, exchangeRate, incoterm } = req.body;
    try {
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
                status: 'Draft',
                version: 1,
            }
        });
        res.json(quote);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating quote' });
    }
};

export const updateQuote = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, validUntil, currency, internalNotes, estimatedWeeks, materialId, exchangeRate, incoterm } = req.body;
    try {
        const quote = await prisma.quote.update({
            where: { id },
            data: {
                status,
                validUntil: validUntil ? new Date(validUntil) : undefined,
                currency,
                estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
                materialId,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined, // Handle exchangeRate update
                incoterm
            }
        });
        res.json(quote);
    } catch (error) {
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

export const reviseQuote = async (req: Request, res: Response) => {
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

        // 1. Get original quote
        const originalQuote = await prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: { include: { quotes: true } } }
        });

        if (!originalQuote || !originalQuote.project) return res.status(404).json({ error: 'Quote or Project not found' });

        // 2. Generate New Reference (DRC25-001-C{Next}R0)
        // Similar to getNextQuoteReference logic
        const project = originalQuote.project;
        const year = new Date().getFullYear().toString().slice(-2);
        const projectRefParts = project.reference.split('-'); // P-0001 or similar?
        // Actually, we should parse the project reference or just use the project sequence if stored.
        // Let's rely on the existing reference pattern if possible, or re-calculate.
        // Pattern: DRC{YY}-{Seq}-C{Index}R0
        // Quickest way: Count quotes in project and +1.
        const clientIndex = project.quotes.length; // 0-based index becomes 1-based count, or just next index?
        // If we have 2 quotes (C0, C1), length is 2. Next is C2.

        // Extract Project Seq from original reference if possible, or Project Reference
        // Original: DRC25-0001-C0R0
        // Parts: DRC25, 0001, C0R0
        const refParts = originalQuote.reference.split('-');
        let newReference = '';

        if (refParts.length >= 3) {
            const prefix = refParts.slice(0, 2).join('-'); // DRC25-0001
            newReference = `${prefix}-C${clientIndex}R0`;
        } else {
            // Fallback
            newReference = `${originalQuote.reference}-COPY`;
        }

        // 3. Create Duplicate
        const newQuote = await prisma.quote.create({
            data: {
                reference: newReference,
                projectId: originalQuote.projectId,
                thirdPartyId: originalQuote.thirdPartyId, // Keep same client? Yes, duplication usually implies same context.
                contactId: originalQuote.contactId,
                currency: originalQuote.currency,
                status: 'Draft',
                version: 1,
                estimatedWeeks: originalQuote.estimatedWeeks,
                materialId: originalQuote.materialId,
                exchangeRate: originalQuote.exchangeRate,
                incoterm: originalQuote.incoterm,
                validUntil: undefined,
                dateIssued: new Date(),
            }
        });

        // 4. Clone Items
        if (originalQuote.items.length > 0) {
            console.log(`[Duplicate] Found ${originalQuote.items.length} items to clone.`);
            console.log(`[Duplicate] First item keys:`, Object.keys(originalQuote.items[0]));

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
                // Full Clone
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
                productionStatus: 'Pending',
                productionNotes: item.productionNotes
            }));

            await prisma.quoteItem.createMany({
                data: itemsData
            });
        }

        res.json(newQuote);

    } catch (error) {
        console.error("Duplicate Error:", error);
        res.status(500).json({ error: 'Failed to duplicate quote', details: error });
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
                client: { include: { addresses: true, contacts: true, paymentTerm: true } }
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // Find Representative manually (No FK)
        let rep = null;
        if (quote.client?.repName) {
            const allReps = await prisma.representative.findMany(); // Cache efficient enough for small set
            rep = allReps.find(r => `${r.firstName} ${r.lastName}` === quote.client?.repName);
        }

        const xml = xmlService.generateQuoteXml(quote, rep);

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
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                items: true,
                project: true,
                material: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } }
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        // Find Representative manually
        let rep = null;
        if (quote.client?.repName) {
            const allReps = await prisma.representative.findMany();
            rep = allReps.find(r => `${r.firstName} ${r.lastName}` === quote.client?.repName);
        }

        console.log("Exporting to local...");
        const xml = xmlService.generateQuoteXml(quote, rep);
        console.log("XML Generated length:", xml.length);

        // Define Path
        // Define Path
        // User requested: 192.168.3.5/demo/echange
        // On macOS, assuming 'demo' is the share name mounted at /Volumes/demo
        const downloadDir = '/Volumes/demo/echange';
        console.log("Target Directory:", downloadDir);

        // Remove mkdir as requested by user
        // if (!fs.existsSync(downloadDir)) {
        //     fs.mkdirSync(downloadDir, { recursive: true });
        // }

        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const clientName = safeName(quote.client?.name);
        const materialName = safeName(quote.material?.name);
        const projectName = safeName(quote.project?.name);
        const parts = [
            quote.reference,
            clientName,
            projectName,
            materialName
        ].filter(p => p && p.trim() !== '');

        const filename = `${parts.join('_')}.rak`;

        const filePath = path.join(downloadDir, filename);
        console.log("Target File Path:", filePath);

        fs.writeFileSync(filePath, xml);
        console.log("File written successfully");

        res.json({ message: 'File exported successfully', path: filePath });

    } catch (error: any) {
        console.error("Export Local Error Stack:", error.stack);
        console.error("Export Local Error Message:", error.message);
        res.status(500).json({ error: 'Failed to export to local folder', details: error.message + " | " + (error.code || '') });
    }
};


export const downloadQuoteExcel = async (req: Request, res: Response) => {
    const logPath = path.join(__dirname, '../../backend_trace.log');
    const log = (msg: string) => fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);

    try {
        log(`Create Request received - ID: ${req.params.id}`);
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                project: true,
                material: true,
                client: true
            }
        });

        if (!quote) { log("Quote not found"); return res.status(404).json({ error: 'Quote not found' }); }
        if (!quote.project) { log("No Project"); return res.status(400).json({ error: 'Quote has no project' }); }
        if (!quote.material) { log("No Material"); return res.status(400).json({ error: 'Quote has no material' }); }

        // 1. Generate RAK XML (Trigger for Macro)
        log("Generating XML content...");
        const xmlContent = xmlService.generateQuoteXml(quote);

        // 2. Save RAK to Exchange folder
        // Use env var or default. Check for typical macOS mount points.
        const exchangePath = process.env.EXCHANGE_PATH || '/Volumes/demo/echange';

        if (!fs.existsSync(exchangePath)) {
            console.error(`Exchange path ${exchangePath} does not exist!`);
            return res.status(503).json({
                error: 'Exchange folder not reachable',
                details: `Le dossier d'échange '${exchangePath}' est introuvable. Assurez-vous que le volume est monté.`
            });
        }

        // Risky if other processes are running. We'll rely on timestamp check.

        const rakFilename = `${quote.reference.replace(/\//g, '-')}.rak`;
        const rakFilePath = path.join(exchangePath, rakFilename);
        const startTime = Date.now();

        console.log(`[DEBUG] Attempting to write RAK file...`);
        console.log(`[DEBUG] Reference: ${quote.reference}`);
        console.log(`[DEBUG] Target Absolute Path: ${rakFilePath}`);

        try {
            fs.writeFileSync(rakFilePath, xmlContent, 'utf-8');
            console.log(`[DEBUG] Write SUCCESS. Exists? ${fs.existsSync(rakFilePath)}`);
        } catch (e: any) {
            console.error(`[DEBUG] Write FAILED: ${e.message}`);
            throw e;
        }

        console.log(`Generating RAK file at: ${rakFilePath}`);

        // 3. Poll for RETURN XML (Output from Macro) in the SAME Exchange folder
        console.log("Waiting for Return XML in:", exchangePath);

        // Initial pause to let the macro wake up
        await new Promise(resolve => setTimeout(resolve, 5000));

        let attempts = 0;
        const maxAttempts = 60; // 60 seconds total
        let foundXmlPath: string | null = null;

        const checkFile = setInterval(async () => {
            attempts++;
            if (attempts % 10 === 0) log(`Polling attempt ${attempts}...`);

            try {
                if (fs.existsSync(exchangePath)) {
                    const files = fs.readdirSync(exchangePath);
                    // Match: Contains Reference AND ends with .xml AND is NOT the RAK file (rak is .rak anyway)
                    // AND is modified AFTER we wrote the RAK file.

                    const candidates = files
                        .filter(f => f.toLowerCase().includes(quote.reference.toLowerCase()) && f.toLowerCase().endsWith('.xml'))
                        .map(f => {
                            const fullPath = path.join(exchangePath, f);
                            const stats = fs.statSync(fullPath);
                            return { name: f, path: fullPath, mtime: stats.mtimeMs };
                        })
                        .filter(f => f.mtime > startTime); // Must be newer than our request

                    if (candidates.length > 0) {
                        // Pick the most recent one
                        candidates.sort((a, b) => b.mtime - a.mtime);
                        foundXmlPath = candidates[0].path;
                    }
                }
            } catch (err) {
                console.error("Error polling files:", err);
            }

            if (foundXmlPath && fs.existsSync(foundXmlPath)) {
                clearInterval(checkFile);
                log(`Return XML found at: ${foundXmlPath}`);
                console.log("Return XML found:", foundXmlPath);

                // 4. Read and Import
                try {
                    // Slight delay to ensure write flush
                    await new Promise(resolve => setTimeout(resolve, 500));

                    let xmlReturnContent = fs.readFileSync(foundXmlPath, 'utf-8');
                    // Strip BOM if present
                    xmlReturnContent = xmlReturnContent.replace(/^\uFEFF/, '');

                    log(`Reading XML content (first 200 chars): ${xmlReturnContent.substring(0, 200).replace(/\n/g, ' ')}`);

                    const items = xmlService.parseExcelReturnXml(xmlReturnContent);
                    log(`Parsed ${items.length} items from XML.`);

                    if (items.length === 0) {
                        try {
                            // Debug logging for empty parse
                            const { create } = require('xmlbuilder2');
                            const doc = create(xmlReturnContent);
                            const obj = doc.end({ format: 'object' });
                            log(`DEBUG XML Parse: Keys found -> ${JSON.stringify(Object.keys(obj))}`);
                            if ((obj as any).generation) {
                                log(`DEBUG XML Parse: generation.devis -> ${!!(obj as any).generation.devis}`);
                                if ((obj as any).generation.devis) {
                                    log(`DEBUG XML Parse: devis.externe -> ${!!(obj as any).generation.devis.externe}`);
                                }
                            }
                        } catch (debugErr: any) {
                            log(`DEBUG Parse Failed: ${debugErr.message}`);
                        }

                        throw new Error("Aucune ligne trouvée dans le fichier XML retourné. Synchronisation annulée pour protéger les données.");
                    }


                    // Update DB (Transaction)
                    await prisma.$transaction(async (prisma) => {
                        // Clear old items
                        await prisma.quoteItem.deleteMany({ where: { quoteId: id } });

                        // Insert new items
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
                                netLength: item.netLength || 0,
                                netArea: item.netArea || 0,
                                netVolume: item.netVolume || 0,
                                totalWeight: item.totalWeight || 0,
                                unitPriceCad: item.unitPriceCad || 0,
                                unitPriceUsd: item.unitPrice || 0,
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

                        // Recalculate Total
                        const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                        await prisma.quote.update({
                            where: { id },
                            data: {
                                totalAmount,
                                syncStatus: 'Synced'
                            }
                        });
                    });

                    // Cleanup returned XML? Maybe keep for audit, or delete?
                    // fs.unlinkSync(foundXmlPath); 

                    res.json({ message: 'Synchronization successful', itemsCount: items.length });

                } catch (err: any) {
                    log(`Import Error: ${err.message}\n${err.stack}`);
                    console.error("Import Error during generation:", err);
                    res.status(422).json({ error: 'Error importing returned XML', details: err.message });
                }

            } else if (attempts >= maxAttempts) {
                clearInterval(checkFile);
                console.error("Timeout: Return XML not found");
                res.status(404).json({
                    error: 'Timeout waiting for Excel/XML generated file',
                    details: "L'éditeur Excel n'a pas renvoyé le fichier XML confirmation dans les temps (60s)."
                });
            }
        }, 1000);

    } catch (error: any) {
        log(`Main Error: ${error.message}\n${error.stack}`);
        console.error("Generate Excel Error:", error);

        fs.writeFileSync(path.join(__dirname, '../../backend_error.log'), `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n`);

        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate flow', details: error.message });
        }
    }
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

// Reintegrate Excel: Uploads file to H:/Project/File
export const reintegrateExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!quote || !quote.project) {
            return res.status(404).json({ error: 'Quote or Project not found' });
        }

        const projectName = quote.project.name || 'UnknownProject';
        // Construct target path: \\192.168.3.5\travail\[Project Name]\[Original Filename]

        // Note: On non-Windows servers, this UNC path is just a string for the target logic usually,
        // but fs.copyFileSync will fail if not mounted. 
        // We will construct the path using path.join but ensure UNC prefix.

        // For writing files on the server, we assume the server has this path mounted or accessible.
        // If the server is running on the Mac, it won't be able to write to \\192.168.3.5 directly without mounting it to a local folder.
        // HOWEVER, the user asked to put it there. I will use the path as provided for the LOGIC.
        // But for the actual fs write, if on Mac/Linux, we might need a local mount point or just simulate it?
        // Given the user context "Essai thomas", I will try to write to the path but expect it might fail if not mounted.

        // Standardizing the base path
        // MAC SERVER SPECIFIC: We write to the local mount point
        const localMountPath = '/Volumes/nxerp';
        // WINDOWS CLIENT SPECIFIC: The XML must point to the mapped drive
        // User specified: F:\nxerp\Projet\Fichier
        const winBasePath = 'F:\\nxerp';

        const targetDir = path.join(localMountPath, projectName);
        const targetPath = path.join(targetDir, file.originalname);

        // The path we want in the XML
        const xmlPath = `${winBasePath}\\${projectName}\\${file.originalname}`;

        console.log(`Reintegrate: Copying from ${file.path} to ${targetPath}`);

        // Ensure target directory exists (recursive)
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                console.warn(`Could not create target directory ${targetDir} (likely permission or mount issue):`, e);
            }
        }

        try {
            fs.copyFileSync(file.path, targetPath);
        } catch (copyError) {
            console.error("Failed to copy to network drive:", copyError);
            return res.status(500).json({
                error: `Failed to save file to ${targetPath}. Check if '/Volumes/nxerp' is mounted on the server.`,
                details: String(copyError)
            });
        }

        // Cleanup temp
        fs.unlinkSync(file.path);

        res.json({
            message: 'File uploaded and saved to network',
            path: xmlPath, // Return the UNC path for the XML
            localPath: targetPath, // Debug info
            filename: file.originalname
        });

    } catch (error) {
        console.error('Reintegrate Excel Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: String(error) });
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

        // Update path logic for download

        // MAC SERVER: Check /Volumes/nxerp or fallback to Travail/nxerp or Travail
        // User asked for F:\nxerp. 
        let projectPath = path.join('/Volumes/nxerp', quote.project.name);

        if (!fs.existsSync(projectPath)) {
            return res.status(404).json({
                error: `Project folder not found at ${projectPath}.`,
                details: "Le dossier du projet est introuvable dans '/Volumes/nxerp'. Vérifiez que le dossier 'nxerp' est monté sur le serveur."
            });
        }

        const logDebug = (msg: string) => {
            fs.appendFileSync(path.join(__dirname, '../../backend_download_debug.log'), `[${new Date().toISOString()}] ${msg}\n`);
        };

        logDebug(`Download request for Quote ID: ${id}`);
        logDebug(`Project Name: ${quote.project.name}, Reference: ${quote.reference}`);
        logDebug(`Searching in Project Path: ${projectPath}`);

        // Find the excel file corresponding to this quote reference
        let files: string[] = [];
        try {
            files = fs.readdirSync(projectPath);
            logDebug(`Files found in folder (${files.length}): ${files.join(', ')}`);
        } catch (e: any) {
            logDebug(`Error reading directory: ${e.message}`);
            return res.status(404).json({ error: `Could not read project directory: ${projectPath}`, details: e.message });
        }

        // Look for .xlsx NOT starting with ~$ (temp lock files) AND NOT starting with ._ (Mac metadata)
        let excelFile = files.find(f => f.includes(quote.reference) && f.endsWith('.xlsx') && !f.startsWith('~$') && !f.startsWith('._'));
        logDebug(`Exact match search result: ${excelFile}`);

        // Fallback: Fuzzy search (e.g. if mismatch between C1R0 and C0R0, find the most recent for this Project/BaseRef)
        if (!excelFile) {
            const baseRefParts = quote.reference.split('-');
            // Assumption: Ref format is PROJECT-NUM-REV (e.g. DRC25-0011-C1R0)
            // Try matching PROJECT-NUM (e.g. DRC25-0011)
            if (baseRefParts.length >= 2) {
                const baseRef = baseRefParts.slice(0, 2).join('-');
                logDebug(`Attempting fuzzy match with baseRef: ${baseRef}`);

                const candidates = files.filter(f => f.includes(baseRef) && f.endsWith('.xlsx') && !f.startsWith('~$') && !f.startsWith('._'));
                logDebug(`Fuzzy candidates found: ${candidates.join(', ')}`);

                if (candidates.length > 0) {
                    // Sort by modification time (most recent first)
                    candidates.sort((a, b) => {
                        const statA = fs.statSync(path.join(projectPath, a));
                        const statB = fs.statSync(path.join(projectPath, b));
                        return statB.mtime.getTime() - statA.mtime.getTime();
                    });
                    excelFile = candidates[0];
                    logDebug(`Selected best candidate: ${excelFile}`);
                    console.log(`[Download Fuzzy] Found file using base ref ${baseRef}: ${excelFile}`);
                }
            }
        }

        if (!excelFile) {
            logDebug(`FAILURE: No file found matching reference.`);
            return res.status(404).json({
                error: 'Excel file not found yet. Please wait for macro to complete.',
                details: `Searched in ${projectPath} for reference ${quote.reference}`
            });
        }

        const fullPath = path.join(projectPath, excelFile);
        const stat = fs.statSync(fullPath);
        logDebug(`Sending file: ${fullPath} (Size: ${stat.size} bytes)`);

        if (stat.size === 0) {
            logDebug(`WARNING: File is empty!`);
            return res.status(500).json({ error: 'File is empty (0 bytes)' });
        }

        res.download(fullPath, excelFile, (err) => {
            if (err) {
                logDebug(`Error sending file: ${err.message}`);
            } else {
                logDebug(`File sent successfully.`);
            }
        });
    } catch (error) {
        console.error('Error downloading result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
