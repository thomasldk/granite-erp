import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { XmlService } from '../services/xmlService';

const prisma = new PrismaClient();
const xmlService = new XmlService();

export const pollPending = async (req: Request, res: Response) => {
    try {
        // 1. Find pending quote (Creation OR Reintegration)
        // Order by priority? Reimport might be urgent? FIFO is fine.
        const pendingQuote = await prisma.quote.findFirst({
            where: {
                syncStatus: { in: ['PENDING_AGENT', 'PENDING_REIMPORT'] }
            },
            orderBy: { updatedAt: 'asc' },
            include: {
                client: { include: { addresses: true, contacts: true } },
                project: { include: { location: true } },
                material: true,
                items: true
            }
        });

        if (!pendingQuote) {
            return res.status(204).send(); // No content (Agent should sleep)
        }

        console.log(`[Sync] Poll: Found ${pendingQuote.reference} [${pendingQuote.syncStatus}]`);

        let xmlContent = '';
        let targetFilename = '';
        let jobType = 'CREATE'; // Default
        let excelUrl = '';
        let excelLocalPath = ''; // For Reimport

        if (pendingQuote.syncStatus === 'PENDING_REIMPORT') {
            jobType = 'REIMPORT';

            // Logic for Reintegration
            // 1. Determine Target Path on PC
            // Remove spaces to support legacy automation (For Folders)
            const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const clientName = safeName(pendingQuote.client?.name);
            const materialName = safeName(pendingQuote.material?.name);
            const pName = safeName(pendingQuote.project?.name);
            const parts = [
                safeName(pendingQuote.reference),
                clientName,
                pName,
                materialName
            ].filter(p => p && p.trim() !== '');

            // Determine Target Filename
            // If we have preserved the original filename in excelFilePath (with separator ___), use it.
            // Otherwise, fallback to constructed name.
            let targetExcelFilename = `${parts.join('_')}.xlsx`;

            if (pendingQuote.excelFilePath && pendingQuote.excelFilePath.includes('___')) {
                const splitParts = pendingQuote.excelFilePath.split('___');
                if (splitParts.length > 1) {
                    targetExcelFilename = splitParts[splitParts.length - 1]; // Take the last part (Original Name)
                    console.log(`[Sync] Using Preserved Filename: "${targetExcelFilename}"`);
                }
            }

            // Hardcoded "F:\nxerp" as per requirement / standard config
            const winBasePath = 'F:\\nxerp';
            const targetExcelPath = `${winBasePath}\\${pName}\\${targetExcelFilename}`;

            // 2. Generate XML Trigger
            xmlContent = await xmlService.generateReintegrationXml(targetExcelPath);

            // 3. Prepare Trigger Filename (.rak)
            // Use same base name but .rak extension or specific name?
            // User said: "le point rak". Implies .rak extension.
            targetFilename = `${parts.join('_')}.rak`;

            // 4. Excel Download Link for Agent
            // The Agent needs to download the file created/uploaded in Mac.
            // We expose it via /quotes/:id/download-source-excel
            // Assuming Agent can access API Host.
            // We pass a relative URL or full? Relative is safer if Agent knows base URL.
            excelUrl = `/api/quotes/${pendingQuote.id}/download-source-excel`;
            excelLocalPath = targetExcelPath; // Inform Agent where to put it

        } else {
            // Normal Creation
            jobType = 'CREATE';
            xmlContent = await xmlService.generateQuoteXml(pendingQuote);
            targetFilename = `${pendingQuote.reference}.rak`;
        }

        // 3. Update status to prevent double processing
        await prisma.quote.update({
            where: { id: pendingQuote.id },
            data: { syncStatus: 'AGENT_PICKED' }
        });

        console.log(`[Sync] Quote ${pendingQuote.reference} picked up by Agent (${jobType}).`);

        // 4. Return the job
        res.json({
            id: pendingQuote.id,
            reference: pendingQuote.reference,
            type: jobType,
            xmlContent: xmlContent,
            targetFilename: targetFilename, // .xml or .rak
            // For Reimport:
            excelUrl: excelUrl,
            targetPath: excelLocalPath
        });

    } catch (error: any) {
        console.error("Sync Poll Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const uploadResult = async (req: Request, res: Response) => {
    const { id } = req.params; // Quote ID

    // Expecting file upload 'file'
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        console.log(`[Sync] Received result for ${id}. Processing...`);

        // Handle both Buffer and DiskStorage
        let fileContent = '';
        if (req.file.buffer) {
            fileContent = req.file.buffer.toString('utf-8');
        } else if (req.file.path) {
            const fs = require('fs');
            fileContent = fs.readFileSync(req.file.path, 'utf-8');
            // Cleanup temp XML file
            fs.unlinkSync(req.file.path);
        } else {
            throw new Error("No buffer or path found for uploaded XML.");
        }

        // 1. Parse XML and Update Quote
        // Reuse the logic from quoteController that handled "legacy" parsing
        // We might need to expose parse logic publically in XmlService or Controller.
        // Assuming XmlService has parseExcelReturnXml(xmlString) -> Returns parsed items/totals

        console.log(`[DEBUG] XML Content Preview: ${fileContent.substring(0, 200)}...`);
        // 1. Parse XML and Update Quote
        const items = xmlService.parseExcelReturnXml(fileContent);
        console.log(`[DEBUG] Parsed Items Count: ${items.length}`);

        // 2. Transaction to replace items and update status
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
                        unitPriceUsd: 0,
                        totalPriceCad: item.totalPriceCad,
                        totalPriceUsd: 0,

                        stoneValue: item.stoneValue,

                        primarySawingCost: item.primarySawingCost,
                        secondarySawingCost: item.secondarySawingCost,
                        profilingCost: item.profilingCost,
                        finishingCost: item.finishingCost,
                        anchoringCost: item.anchoringCost,

                        unitTime: item.unitTime,
                        totalTime: item.totalTime,

                        numHoles: 0,
                        numSlots: 0,
                    }))
                });
            }

            // Update Quote Total & Status
            const totalAmount = items.reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0);
            await prisma.quote.update({
                where: { id },
                data: {
                    totalAmount,
                    syncStatus: 'Calculated (Agent)'
                }
            });
        });

        res.json({ success: true, message: 'Quote updated' });

    } catch (error: any) {
        console.error("Sync Upload Error:", error);
        // Reset status so agent/user can retry?
        await prisma.quote.update({
            where: { id },
            data: { syncStatus: 'ERROR_AGENT' }
        });
        res.status(500).json({ error: error.message });
    }
};

export const uploadExcel = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ error: 'No Excel file uploaded' });
    }

    try {
        console.log(`[Sync] Received Excel for ${id}`);
        // Handle both Buffer (MemoryStorage) and Path (DiskStorage)

        let initialPath = req.file.path;
        let finalPath = '';

        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        // Standardize filename: ID__OriginalName.xlsx
        const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_ ]/g, '_');
        const filename = `${id}__${safeOriginalName}`;
        finalPath = path.join(uploadsDir, filename);

        if (initialPath) {
            // DiskStorage: Move/Rename file to final structure
            // If already in uploads, rename it.
            // Multer usually saves to a temp name or configured name.
            try {
                fs.renameSync(initialPath, finalPath);
            } catch (mvErr: any) {
                // Fallback copy/delete if rename fails (cross-device)
                fs.copyFileSync(initialPath, finalPath);
                fs.unlinkSync(initialPath);
            }
        } else if (req.file.buffer) {
            // MemoryStorage: Write buffer
            fs.writeFileSync(finalPath, req.file.buffer);
        } else {
            throw new Error("File upload failed: No path or buffer found.");
        }

        const stats = fs.statSync(finalPath);
        console.log(`[DEBUG] Excel Uploaded. Size: ${stats.size} bytes. Path: ${finalPath}`);

        // Store RELATIVE path in DB
        // NOTE: quoteController expects 'uploads/filename' relative to project root or absolute?
        // quoteController usage: path.join(__dirname, '../../', quote.excelFilePath)
        // So 'uploads/filename' is correct if controller is in src/controllers.

        console.log(`[Sync] Saving Excel path to DB: uploads/${filename}`);
        await prisma.quote.update({
            where: { id },
            data: { excelFilePath: `uploads/${filename}` }
        });

        res.json({ success: true, path: finalPath });
    } catch (err: any) {
        console.error("Excel Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
};
