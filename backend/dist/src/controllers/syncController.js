"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadExcel = exports.uploadResult = exports.pollPending = void 0;
// import { PrismaClient } from '@prisma/client';
const xmlService_1 = require("../services/xmlService");
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const xmlService = new xmlService_1.XmlService();
const pollPending = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    try {
        // 1. Find pending quote (Creation OR Reintegration)
        // Order by priority? Reimport might be urgent? FIFO is fine.
        const criteria = { in: ['PENDING_AGENT', 'PENDING_REIMPORT', 'PENDING_DUPLICATE', 'PENDING_REVISION'] };
        const pendingCount = yield prisma_1.default.quote.count({ where: { syncStatus: criteria } });
        console.log(`[Sync] Debug Poll: ${pendingCount} quotes pending.`);
        const pendingQuote = yield prisma_1.default.quote.findFirst({
            where: {
                syncStatus: criteria
            },
            orderBy: { updatedAt: 'asc' },
            include: {
                client: { include: { addresses: true, contacts: true, paymentTerm: true } },
                project: { include: { location: true } }, // Need project for path
                contact: true,
                material: true,
                items: true,
                representative: true, // rep info
                paymentTerm: true, // payment conditions
                incotermRef: true
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
        let fileParams = {}; // Extra params for Agent (Source/Target paths)
        if (pendingQuote.syncStatus === 'PENDING_REIMPORT') {
            jobType = 'REIMPORT';
            // Logic for Reintegration
            // 1. Determine Target Path on PC
            // Remove spaces to support legacy automation (For Folders)
            const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const clientName = safeName((_a = pendingQuote.client) === null || _a === void 0 ? void 0 : _a.name);
            const materialName = safeName((_b = pendingQuote.material) === null || _b === void 0 ? void 0 : _b.name);
            const pName = safeName((_c = pendingQuote.project) === null || _c === void 0 ? void 0 : _c.name);
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
            xmlContent = yield xmlService.generateReintegrationXml(targetExcelPath, pendingQuote.id);
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
        }
        else if (pendingQuote.syncStatus === 'PENDING_DUPLICATE') {
            // Duplicate Quote (Recopier)
            jobType = 'DUPLICATE';
            // The RAK XML was already generated by duplicateQuote and saved.
            // We just need to serve it.
            // Filename: Reference.rak (e.g. DRC25-0001-C1R0.rak)
            targetFilename = `${pendingQuote.reference}.rak`;
            const fs = require('fs');
            const path = require('path');
            const rakPath = path.join(__dirname, '../../pending_xml', targetFilename);
            if (fs.existsSync(rakPath)) {
                xmlContent = fs.readFileSync(rakPath, 'utf-8');
                console.log(`[Sync] Served pre-generated RAK for Duplicate: ${targetFilename}`);
            }
            else {
                console.error(`[Sync] ERROR: Pre-generated RAK not found: ${rakPath}`);
                xmlContent = '<error>RAK File Missing</error>';
            }
        }
        else if (pendingQuote.syncStatus === 'PENDING_REVISION') {
            // --- REVISION LOGIC (Agent Side) ---
            // User Request: "Tu prends le fichier... et tu la copie"
            // We use explicit 'REVISE' job type to tell Agent to perform fs.copyFile()
            jobType = 'REVISE';
            // 1. Determine References
            let prevRef = pendingQuote.reference;
            const refRegex = /(.*-C\d+R)(\d+)$/;
            const match = pendingQuote.reference.match(refRegex);
            if (match && match.length >= 3) {
                const prefix = match[1];
                const currentVer = parseInt(match[2]);
                if (currentVer > 0) {
                    prevRef = `${prefix}${currentVer - 1}`;
                }
            }
            console.log(`[Sync] REVISION detected. Generating REVISE Job for ${pendingQuote.reference} (Old: ${prevRef})`);
            // 2. Paths (Windows)
            const winBasePath = 'F:\\nxerp';
            const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const clientName = safeName((_d = pendingQuote.client) === null || _d === void 0 ? void 0 : _d.name);
            const materialName = safeName((_e = pendingQuote.material) === null || _e === void 0 ? void 0 : _e.name);
            const pName = safeName((_f = pendingQuote.project) === null || _f === void 0 ? void 0 : _f.name);
            const makeFilename = (ref) => {
                const parts = [safeName(ref), clientName, pName, materialName].filter(p => p && p.trim() !== '');
                return `${parts.join('_')}.xlsx`;
            };
            const newFilename = makeFilename(pendingQuote.reference);
            const winFullPath = `${winBasePath}\\${pName}\\${newFilename}`;
            // Paths on Windows (Explicit for Agent)
            // CRITICAL FIX: We must fetch the PREVIOUS quote to know its filename (Material might have changed!)
            let oldFilename = makeFilename(prevRef); // Default (if no change)
            let prevQuote = null;
            if (prevRef !== pendingQuote.reference) {
                prevQuote = yield prisma_1.default.quote.findUnique({
                    where: { reference: prevRef },
                    include: { client: true, project: true, material: true }
                });
                if (prevQuote) {
                    const oldClientName = safeName((_g = prevQuote.client) === null || _g === void 0 ? void 0 : _g.name);
                    const oldPName = safeName((_h = prevQuote.project) === null || _h === void 0 ? void 0 : _h.name);
                    const oldMatName = safeName((_j = prevQuote.material) === null || _j === void 0 ? void 0 : _j.name);
                    const parts = [safeName(prevRef), oldClientName, oldPName, oldMatName].filter(p => p && p.trim() !== '');
                    oldFilename = `${parts.join('_')}.xlsx`;
                    console.log(`[Sync] Found Previous Quote. Source File: ${oldFilename}`);
                }
                else {
                    console.warn(`[Sync] Warning: Previous Quote ${prevRef} not found in DB. Assuming default naming.`);
                }
            }
            const sourcePath = `${winBasePath}\\${pName}\\${oldFilename}`; // Assuming Project Folder didn't change name?
            // If Project Name changed, we might be in trouble (Source in different folder?).
            // For now assume Project Name is stable.
            // const sourcePath = `${winBasePath}\\${pName}\\${oldFilename}`; // oldFilename usage requires standardizing
            const targetPath = `${winBasePath}\\${pName}\\${newFilename}`; // winFullPath is same format
            // FIX: Save the expected Excel Path to DB immediately so Download works later
            yield prisma_1.default.quote.update({
                where: { id: pendingQuote.id },
                data: { excelFilePath: targetPath }
            });
            console.log(`[Sync] Saved excelFilePath for Agent: ${targetPath}`);
            // 3. Prepare Revision Data for XmlService
            // CORRECTED: modele must point to the SOURCE file (existing), not the TARGET (non-existent)
            const revisionData = {
                cible: targetPath, // Result
                modele: sourcePath, // Source (The file to "Revise")
                ancienNom: prevRef,
                nouveauNom: pendingQuote.reference,
                ancienCouleur: ((_k = prevQuote === null || prevQuote === void 0 ? void 0 : prevQuote.material) === null || _k === void 0 ? void 0 : _k.name) || '',
                nouveauCouleur: ((_l = pendingQuote.material) === null || _l === void 0 ? void 0 : _l.name) || '',
                ancienQualite: (((_m = prevQuote === null || prevQuote === void 0 ? void 0 : prevQuote.material) === null || _m === void 0 ? void 0 : _m.id) || '').replace(/-/g, '').toUpperCase(),
                nouvelleQualite: (((_o = pendingQuote.material) === null || _o === void 0 ? void 0 : _o.id) || '').replace(/-/g, '').toUpperCase()
            };
            fileParams = {
                sourcePath: sourcePath,
                targetPath: targetPath,
                // REMOTE SUPPORT: Provide ID and URL for Agent to download source if local copy fails
                prevId: prevQuote ? prevQuote.id : null,
                downloadUrl: prevQuote ? `/quotes/${prevQuote.id}/download-source` : null
            };
            // 4. Find Rep
            let rep = null;
            if ((_p = pendingQuote.client) === null || _p === void 0 ? void 0 : _p.repName) {
                const allReps = yield prisma_1.default.representative.findMany();
                const target = pendingQuote.client.repName.trim().toLowerCase();
                rep = allReps.find(r => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === target);
            }
            // 5. Generate XML (Action: REVISER)
            // Agent copies file FIRST (Source -> Target). Macro then opens Target (Modele=Cible) and updates it.
            console.log(`[Sync] Revision Strategy: Using 'Reviser' (Standard) logic.`);
            xmlContent = yield xmlService.generateQuoteXml(pendingQuote, rep, revisionData);
            targetFilename = `${pendingQuote.reference}.rak`;
        }
        else {
            // Normal Creation
            jobType = 'CREATE';
            // Find Representative manually (Fuzzy Logic for Sync)
            let rep = null;
            if ((_q = pendingQuote.client) === null || _q === void 0 ? void 0 : _q.repName) {
                const allReps = yield prisma_1.default.representative.findMany();
                const target = pendingQuote.client.repName.trim().toLowerCase();
                console.log(`[Sync-DEBUG] Target Rep: '${target}'`);
                rep = allReps.find(r => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === target);
                if (rep)
                    console.log(`[Sync-DEBUG] Matched Rep: ${rep.firstName} ${rep.lastName}`);
            }
            xmlContent = yield xmlService.generateQuoteXml(pendingQuote, rep);
            targetFilename = `${pendingQuote.reference}.rak`;
        }
        // 3. Update status to prevent double processing
        yield prisma_1.default.quote.update({
            where: { id: pendingQuote.id },
            data: { syncStatus: 'AGENT_PICKED' }
        });
        console.log(`[Sync] Quote ${pendingQuote.reference} picked up by Agent (${jobType}).`);
        // Construct targetPath for Agent (Mirroring xmlService logic)
        const safe = (s) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
        const filename = `${safe(pendingQuote.reference)}_${safe((_r = pendingQuote.client) === null || _r === void 0 ? void 0 : _r.name)}_${safe((_s = pendingQuote.project) === null || _s === void 0 ? void 0 : _s.name)}_${safe((_t = pendingQuote.material) === null || _t === void 0 ? void 0 : _t.name)}.xlsx`;
        const defaultFullPath = `F:\\nxerp\\${((_u = pendingQuote.project) === null || _u === void 0 ? void 0 : _u.name) || 'Projet'}\\${filename}`;
        res.json({
            id: pendingQuote.id,
            reference: pendingQuote.reference,
            jobType: jobType,
            xmlContent: xmlContent,
            targetFilename: `${pendingQuote.reference}.rak`,
            // For Reimport:
            reimportPath: null,
            // Files:
            fileParams: {
                targetPath: defaultFullPath // FIXED: Agent needs this to know where to look/write
            },
            files: {}
        });
    }
    catch (error) {
        console.error("Sync Poll Error:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.pollPending = pollPending;
const uploadResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        }
        else if (req.file.path) {
            const fs = require('fs');
            fileContent = fs.readFileSync(req.file.path, 'utf-8');
            // Cleanup temp XML file
            fs.unlinkSync(req.file.path);
        }
        else {
            throw new Error("No buffer or path found for uploaded XML.");
        }
        console.log(`[DEBUG] XML Content Length: ${fileContent.length} chars.`);
        console.log(`[DEBUG] XML Content Preview (First 1000): ${fileContent.substring(0, 1000)}...`);
        // 1. Parse XML and Update Quote
        // Reuse the logic from quoteController that handled "legacy" parsing
        // We might need to expose parse logic publically in XmlService or Controller.
        // Assuming XmlService has parseExcelReturnXml(xmlString) -> Returns parsed items/totals
        // 1. Parse XML and Update Quote
        const items = xmlService.parseExcelReturnXml(fileContent);
        console.log(`[DEBUG] Parsed Items Count: ${items.length}`);
        if (items.length > 0) {
            console.log(`[Sync] Inserting Items... Sample Material: '${items[0].material}'`);
        }
        // 2. Transaction to replace items and update status
        yield prisma_1.default.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete existing items
            yield prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            // Create new items
            if (items.length > 0) {
                yield prisma.quoteItem.createMany({
                    data: items.map((item) => ({
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
            const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
            yield prisma.quote.update({
                where: { id },
                data: {
                    totalAmount,
                    syncStatus: 'Calculated (Agent)',
                    status: 'Draft' // Activate the quote (was PENDING_CREATION)
                }
            });
        }));
        // FIX: Add 3s Delay before confirming success (User Request for Download Timing)
        console.log('[Sync] Implementation: Delaying final response by 3s...');
        yield new Promise(resolve => setTimeout(resolve, 3000));
        res.json({ success: true, message: 'Quote updated' });
    }
    catch (error) {
        console.error("Sync Upload Error:", error);
        // Reset status so agent/user can retry?
        try {
            yield prisma_1.default.quote.update({
                where: { id },
                data: { syncStatus: 'ERROR_AGENT' }
            });
        }
        catch (ignored) {
            // Quote might be deleted (Rollback) or invalid
            console.warn(`Could not update syncStatus for quote ${id}: ${ignored}`);
        }
        res.status(500).json({ error: error.message });
    }
});
exports.uploadResult = uploadResult;
const uploadExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });
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
            }
            catch (mvErr) {
                // Fallback copy/delete if rename fails (cross-device)
                fs.copyFileSync(initialPath, finalPath);
                fs.unlinkSync(initialPath);
            }
        }
        else if (req.file.buffer) {
            // MemoryStorage: Write buffer
            fs.writeFileSync(finalPath, req.file.buffer);
        }
        else {
            throw new Error("File upload failed: No path or buffer found.");
        }
        const stats = fs.statSync(finalPath);
        console.log(`[DEBUG] Excel Uploaded. Size: ${stats.size} bytes. Path: ${finalPath}`);
        // Store RELATIVE path in DB
        // NOTE: quoteController expects 'uploads/filename' relative to project root or absolute?
        // quoteController usage: path.join(__dirname, '../../', quote.excelFilePath)
        // So 'uploads/filename' is correct if controller is in src/controllers.
        console.log(`[Sync] Saving Excel path to DB: uploads/${filename}`);
        yield prisma_1.default.quote.update({
            where: { id },
            data: { excelFilePath: `uploads/${filename}` }
        });
        res.json({ success: true, path: finalPath });
    }
    catch (err) {
        console.error("Excel Upload Error:", err);
        res.status(500).json({ error: err.message });
    }
});
exports.uploadExcel = uploadExcel;
