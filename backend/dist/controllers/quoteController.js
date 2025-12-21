"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviseQuote = exports.downloadSourceExcel = exports.downloadQuoteResult = exports.emitQuote = exports.downloadQuotePdf = exports.fetchReturnXml = exports.saveRakToNetwork = exports.reintegrateExcel = exports.importNetworkXml = exports.importQuoteXml = exports.exportQuoteToLocal = exports.generateQuoteXml = exports.duplicateQuote = exports.reviseQuote_LEGACY = exports.deleteQuote = exports.deleteItem = exports.addItem = exports.updateQuote = exports.createQuote = exports.getQuoteById = exports.downloadQuoteExcel = exports.getQuotes = exports.getNextQuoteReference = exports.generateQuoteExcel = void 0;
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const excelService_1 = require("../services/excelService");
const pdfService_1 = require("../services/pdfService");
const xmlService_1 = require("../services/xmlService");
const calculationService_1 = require("../services/calculationService");
const prisma = new client_1.PrismaClient();
const excelService = new excelService_1.ExcelService();
const xmlService = new xmlService_1.XmlService();
const calculationService = new calculationService_1.CalculationService();
// --- QUOTES ---
const generateQuoteExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Mode: "Sync Agent"
    // We do NOT calculate locally. We mark it for the PC Agent to pick up.
    var _a;
    const { id } = req.params;
    try {
        const quoteFull = yield prisma.quote.findUnique({
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
        if (!rep && ((_a = quoteFull.client) === null || _a === void 0 ? void 0 : _a.repName)) {
            const allReps = yield prisma.representative.findMany();
            rep = allReps.find(r => { var _a; return `${r.firstName} ${r.lastName}` === ((_a = quoteFull.client) === null || _a === void 0 ? void 0 : _a.repName); }) || null;
        }
        const xmlContent = yield xmlService.generateQuoteXml(quoteFull, rep);
        // Save to pending_xml
        const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const filename = `${safeName(quoteFull.reference)}.xml`;
        const outputPath = path.join(__dirname, '../../pending_xml', filename);
        fs.writeFileSync(outputPath, xmlContent);
        console.log(`[Agent-Flow] XML saved to ${outputPath}`);
        console.log(`[Agent-Flow] Queuing Quote ${quoteFull.reference} for PC Agent...`);
        // 1. Mark as Pending for Agent
        yield prisma.quote.update({
            where: { id: quoteFull.id },
            data: {
                syncStatus: 'PENDING_AGENT'
            }
        });
        // 2. Return status immediately
        // Frontend should poll or listen for status change, or just show "Waiting for PC..."
        res.json({ message: 'Queued for PC Agent', status: 'PENDING_AGENT' });
    }
    catch (error) {
        console.error("Queue Error:", error);
        res.status(500).json({ error: 'Failed to queue quote', details: error.message });
    }
});
exports.generateQuoteExcel = generateQuoteExcel;
const getNextQuoteReference = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId } = req.query;
        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }
        const project = yield prisma.project.findUnique({
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
        }
        else if (projectRefParts.length >= 2) {
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
    }
    catch (error) {
        console.error("Error generating reference:", error);
        res.status(500).json({ error: 'Failed to generate reference' });
    }
});
exports.getNextQuoteReference = getNextQuoteReference;
const getQuotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const quotes = yield prisma.quote.findMany({
            where: {
                status: {
                    not: 'PENDING_CREATION' // Hide incomplete duplicates
                }
            },
            include: { project: true, client: true, items: true },
            orderBy: { dateIssued: 'desc' }
        });
        res.json(quotes);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});
exports.getQuotes = getQuotes;
const downloadQuoteExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Mode: "Sync Agent"
    // Trigger the Queue process.
    return (0, exports.generateQuoteExcel)(req, res);
});
exports.downloadQuoteExcel = downloadQuoteExcel;
const getQuoteById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const quote = yield prisma.quote.findUnique({
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
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        res.json(quote);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching quote' });
    }
});
exports.getQuoteById = getQuoteById;
const createQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { reference, projectId, thirdPartyId, contactId, currency, estimatedWeeks, materialId, exchangeRate, incoterm, incotermId, incotermCustomText, 
    // V8 Snapshot
    semiStandardRate, salesCurrency, palletPrice, palletRequired, paymentTermId, paymentDays, depositPercentage, discountPercentage, discountDays, paymentCustomText, validityDuration, // Check for explicit override
    representativeId // Added
     } = req.body;
    console.log("[CreateQuote] Payload:", JSON.stringify(req.body, null, 2));
    try {
        // Calculate Validity Duration if not provided
        let finalValidityDuration = validityDuration ? parseInt(validityDuration) : null;
        if (finalValidityDuration === null) {
            // 1. Try Client Default
            if (thirdPartyId) {
                const client = yield prisma.thirdParty.findUnique({ where: { id: thirdPartyId } });
                if (client === null || client === void 0 ? void 0 : client.validityDuration) {
                    finalValidityDuration = client.validityDuration;
                }
            }
            // 2. Try System Default (if still null)
            if (finalValidityDuration === null) {
                const config = yield prisma.systemConfig.findUnique({ where: { key: 'GLOBAL' } });
                finalValidityDuration = (_a = config === null || config === void 0 ? void 0 : config.defaultValidityDuration) !== null && _a !== void 0 ? _a : 30; // Fallback 30
            }
        }
        const quote = yield prisma.quote.create({
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
    }
    catch (error) {
        console.error("Create Quote Error Details:", error);
        res.status(500).json({ error: 'Error creating quote', details: error.message, meta: error.meta });
    }
});
exports.createQuote = createQuote;
const updateQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { contactId, // FIX
    status, validUntil, currency, internalNotes, estimatedWeeks, materialId, exchangeRate, incoterm, incotermId, incotermCustomText, numberOfLines, 
    // Optional client fields (may be undefined if not sent)
    clientName, clientAddress1, clientCity, clientState, clientZipCode, clientPhone, clientFax, clientEmail, 
    // V8 Snapshot
    // V8 Snapshot
    semiStandardRate, salesCurrency, palletPrice, palletRequired, paymentTermId, paymentDays, depositPercentage, discountPercentage, discountDays, paymentCustomText, validityDuration, representativeId } = req.body;
    try {
        console.log(`[UPDATE QUOTE] ID=${id} IncotermId=${incotermId} Incoterm=${incoterm}`);
        // 1️⃣ Update the Quote itself (same as before)
        const quote = yield prisma.quote.update({
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
            yield prisma.thirdParty.update({
                where: { id: quote.thirdPartyId },
                data: {
                    name: clientName !== null && clientName !== void 0 ? clientName : undefined,
                    addresses: clientAddress1 || clientCity || clientState || clientZipCode ? {
                        updateMany: {
                            where: { thirdPartyId: quote.thirdPartyId }, // Ensure we update addresses belonging to this client
                            data: {
                                line1: clientAddress1 !== null && clientAddress1 !== void 0 ? clientAddress1 : undefined,
                                city: clientCity !== null && clientCity !== void 0 ? clientCity : undefined,
                                state: clientState !== null && clientState !== void 0 ? clientState : undefined,
                                zipCode: clientZipCode !== null && clientZipCode !== void 0 ? clientZipCode : undefined
                            }
                        }
                    } : undefined,
                    contacts: clientPhone || clientFax || clientEmail ? {
                        updateMany: {
                            where: { thirdPartyId: quote.thirdPartyId }, // Ensure we update contacts belonging to this client
                            data: {
                                phone: clientPhone !== null && clientPhone !== void 0 ? clientPhone : undefined,
                                fax: clientFax !== null && clientFax !== void 0 ? clientFax : undefined,
                                email: clientEmail !== null && clientEmail !== void 0 ? clientEmail : undefined
                            }
                        }
                    } : undefined
                }
            });
        }
        res.json(quote);
    }
    catch (error) {
        console.error("Update Quote Error:", error);
        res.status(500).json({ error: 'Error updating quote' });
    }
});
exports.updateQuote = updateQuote;
// --- QUOTE ITEMS ---
const addItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { quoteId } = req.params;
    const { description, material, finish, length, width, thickness, quantity, numHoles, numSlots } = req.body;
    try {
        const item = yield prisma.quoteItem.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error adding item' });
    }
});
exports.addItem = addItem;
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { itemId } = req.params;
    try {
        yield prisma.quoteItem.delete({
            where: { id: itemId }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting item' });
    }
});
exports.deleteItem = deleteItem;
const deleteQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Manual Cascade: Delete items first
        yield prisma.quoteItem.deleteMany({ where: { quoteId: id } });
        // Then delete quote
        yield prisma.quote.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Delete detailed error:", error);
        res.status(500).json({ error: 'Failed to delete quote', details: error });
    }
});
exports.deleteQuote = deleteQuote;
const reviseQuote_LEGACY = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // 1. Get original quote with items
        const originalQuote = yield prisma.quote.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!originalQuote)
            return res.status(404).json({ error: 'Quote not found' });
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
        const newQuote = yield prisma.quote.create({
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
                incoterm: originalQuote.incoterm,
                validUntil: undefined, // Reset validity
                dateIssued: new Date(), // New date
                // V8
                semiStandardRate: originalQuote.semiStandardRate,
                salesCurrency: originalQuote.salesCurrency,
                palletPrice: originalQuote.palletPrice,
                palletRequired: originalQuote.palletRequired,
                // V8 Payment Snapshot
                paymentTermId: originalQuote.paymentTermId,
                paymentDays: originalQuote.paymentDays,
                depositPercentage: originalQuote.depositPercentage,
                discountPercentage: originalQuote.discountPercentage,
                discountDays: originalQuote.discountDays,
                paymentCustomText: originalQuote.paymentCustomText,
                representativeId: originalQuote.representativeId
            }
        });
        // 4. Clone Items
        if (originalQuote.items.length > 0) {
            console.log(`[Revise] Found ${originalQuote.items.length} items to clone.`);
            console.log(`[Revise] First item keys:`, Object.keys(originalQuote.items[0]));
            if (originalQuote.items[0])
                console.log(`[Revise] Sample netLength:`, originalQuote.items[0].netLength);
            const itemsData = originalQuote.items.map((item) => ({
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
            yield prisma.quoteItem.createMany({
                data: itemsData
            });
        }
    }
    catch (error) {
        console.error('Error revising quote:', error);
        res.status(500).json({ error: 'Failed to revise quote' });
    }
});
exports.reviseQuote_LEGACY = reviseQuote_LEGACY;
const duplicateQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const { newClientId, newContactId } = req.body;
        // 1. Get original quote
        const originalQuote = yield prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: { include: { quotes: true } }, client: true, material: true }
        });
        if (!originalQuote || !originalQuote.project)
            return res.status(404).json({ error: 'Quote or Project not found' });
        // 2. Resolve New Client & Contact
        let finalClientId = originalQuote.thirdPartyId;
        let finalContactId = originalQuote.contactId;
        if (newClientId) {
            finalClientId = newClientId;
            finalContactId = newContactId || null;
        }
        const newClient = yield prisma.thirdParty.findUnique({ where: { id: finalClientId }, include: { addresses: true, contacts: true, paymentTerm: true } });
        const newContact = finalContactId ? yield prisma.contact.findUnique({ where: { id: finalContactId } }) : null;
        // 3. Generate New Reference
        const project = originalQuote.project;
        const clientIndex = project.quotes.length;
        const refParts = originalQuote.reference.split('-');
        let newReference = '';
        if (refParts.length >= 3) {
            const prefix = refParts.slice(0, 2).join('-');
            newReference = `${prefix}-C${clientIndex}R0`;
        }
        else {
            newReference = `${originalQuote.reference}-COPY-${Date.now().toString().slice(-4)}`;
        }
        // 4. Create Duplicate Quote
        const newQuote = yield prisma.quote.create({
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
                semiStandardRate: originalQuote.semiStandardRate,
                salesCurrency: originalQuote.salesCurrency,
                palletPrice: originalQuote.palletPrice,
                palletRequired: originalQuote.palletRequired,
                paymentTermId: originalQuote.paymentTermId,
                paymentDays: originalQuote.paymentDays,
                depositPercentage: originalQuote.depositPercentage,
                discountPercentage: originalQuote.discountPercentage,
                discountDays: originalQuote.discountDays,
                paymentCustomText: originalQuote.paymentCustomText,
                representativeId: originalQuote.representativeId,
                syncStatus: 'PENDING_DUPLICATE' // Special status to preserve RAK
            }
        });
        // 5. Clone Items
        if (originalQuote.items.length > 0) {
            const itemsData = originalQuote.items.map((item) => ({
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
            yield prisma.quoteItem.createMany({ data: itemsData });
        }
        // 6. Generate RAK XML
        const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        // 6. LOGIC: Copy Excel File on Server (F:\nxerp OR /Volumes/nxerp)
        // We handle cross-platform paths so the Mac backend can write to the "F" drive mounted on /Volumes.
        // DETECT PLATFORM
        const isMac = process.platform === 'darwin';
        const basePath = isMac ? '/Volumes/nxerp' : 'F:\\nxerp';
        const pName = safeName(project.name);
        // 6a. Construct Source Path (Original Quote)
        // Heuristic: Most reliable is to reconstruct standard format
        const oldClientName = safeName((_a = originalQuote.client) === null || _a === void 0 ? void 0 : _a.name);
        const oldMaterialName = safeName((_b = originalQuote.material) === null || _b === void 0 ? void 0 : _b.name);
        const oldRef = safeName(originalQuote.reference);
        const oldFilename = `${oldRef}_${oldClientName}_${pName}_${oldMaterialName}.xlsx`;
        const oldPath = path.join(basePath, pName, oldFilename);
        // 6b. Construct Target Path (New Quote)
        const newClientName = safeName((newClient === null || newClient === void 0 ? void 0 : newClient.name) || 'Unknown');
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
                yield prisma.quote.update({
                    where: { id: newQuote.id },
                    data: { excelFilePath: newPath }
                });
            }
            else {
                console.warn(`[Duplicate] WARNING: Original file not found at ${oldPath}. Check mount point!`);
            }
        }
        catch (e) {
            console.error(`[Duplicate] File Copy Failed:`, e.message);
        }
        // 7. Generate RAK Trigger
        // The RAK 'cible' will point to F:\nxerp... (Windows Path) because the Agent runs on Windows.
        // We must ensure the 'cible' in the XML matches the Windows reality.
        // XmlService handles this if we pass standard objects.
        const fullNewQuote = yield prisma.quote.findUnique({
            where: { id: newQuote.id },
            include: { client: { include: { addresses: true, contacts: true, paymentTerm: true } }, project: { include: { location: true } }, material: true, items: true, incotermRef: true, paymentTerm: true }
        });
        // Use standard generation
        const xmlService = new (require('../services/xmlService').XmlService)();
        const xmlContent = yield xmlService.generateQuoteXml(fullNewQuote, null);
        const xmlFilename = `${newReference}.rak`;
        const outputPath = path.join(__dirname, '../../pending_xml', xmlFilename);
        fs.writeFileSync(outputPath, xmlContent);
        res.json(newQuote);
    }
    catch (error) {
        console.error("Duplicate Quote Error:", error);
        res.status(500).json({ error: 'Failed to duplicate quote' });
    }
});
exports.duplicateQuote = duplicateQuote;
// XML Export logic moved to top
const generateQuoteXml = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { id } = req.params;
        const quote = yield prisma.quote.findUnique({
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
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        // Find Representative manually (No FK)
        // Find Representative
        let rep = quote.representative;
        if (!rep && ((_a = quote.client) === null || _a === void 0 ? void 0 : _a.repName)) {
            const allReps = yield prisma.representative.findMany();
            const target = quote.client.repName.trim().toLowerCase();
            console.log(`[XML-DEBUG] Target Rep Name: '${target}' (Original: '${quote.client.repName}')`);
            console.log(`[XML-DEBUG] Available Reps in DB:`, allReps.map(r => `${r.firstName} ${r.lastName}`));
            rep = allReps.find(r => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === target) || null;
            if (rep)
                console.log(`[XML-DEBUG] Found Match via Name: ID ${rep.id}`);
            else
                console.warn(`[XML-DEBUG] NO MATCH FOUND for '${target}'`);
        }
        else if (rep) {
            console.log(`[XML-DEBUG] Used Linked Rep: ${rep.firstName} ${rep.lastName}`);
        }
        const xml = yield xmlService.generateQuoteXml(quote, rep);
        const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const clientName = safeName((_b = quote.client) === null || _b === void 0 ? void 0 : _b.name);
        const materialName = safeName((_c = quote.material) === null || _c === void 0 ? void 0 : _c.name);
        const projectName = safeName((_d = quote.project) === null || _d === void 0 ? void 0 : _d.name);
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
    }
    catch (error) {
        console.error("XML Gen Error:", error);
        res.status(500).json({ error: 'Failed to generate XML' });
    }
});
exports.generateQuoteXml = generateQuoteXml;
const exportQuoteToLocal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Mode: "Sync Agent"
    // Redirect to the Queue logic
    return (0, exports.generateQuoteExcel)(req, res);
});
exports.exportQuoteToLocal = exportQuoteToLocal;
const importQuoteXml = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const xmlContent = fs.readFileSync(req.file.path, 'utf-8');
        // Parse items
        const items = xmlService.parseExcelReturnXml(xmlContent);
        // Transaction to replace items
        yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            // Delete existing items
            yield prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            // Create new items
            if (items.length > 0) {
                yield prisma.quoteItem.createMany({
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
            yield prisma.quote.update({
                where: { id },
                data: {
                    totalAmount,
                    syncStatus: 'Synced'
                }
            });
        }));
        // Cleanup temp file
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.json({ message: 'Import successful', count: items.length });
    }
    catch (error) {
        console.error('Import XML Error:', error);
        res.status(500).json({ error: 'Failed to import XML', details: String(error) });
    }
});
exports.importQuoteXml = importQuoteXml;
const importNetworkXml = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        // 1. Fetch Quote to reconstruct filename
        const quote = yield prisma.quote.findUnique({
            where: { id },
            include: { project: true, material: true, client: true }
        });
        if (!quote || !quote.project || !quote.material)
            return res.status(404).json({ error: 'Quote incomplete' });
        // 2. Reconstruct Filename (Same logic as export)
        const safeName = (str) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
        const clientName = safeName((_a = quote.client) === null || _a === void 0 ? void 0 : _a.name);
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
            }
            catch (err) {
                console.error("Error during fuzzy search:", err);
            }
        }
        if (!fs.existsSync(importPath)) {
            return res.status(404).json({ error: 'Fichier XML de retour introuvable', searchedFor: filename, currentPath: importPath });
        }
        const xmlContent = fs.readFileSync(importPath, 'utf-8');
        const items = xmlService.parseExcelReturnXml(xmlContent);
        // 3. Update Items
        yield prisma.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
            yield prisma.quoteItem.deleteMany({ where: { quoteId: id } });
            if (items.length > 0) {
                yield prisma.quoteItem.createMany({
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
        }));
        // 4. Update Quote Totals
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        yield prisma.quote.update({
            where: { id },
            data: {
                totalAmount
            }
        });
        res.json({ message: 'Import réseau réussi', itemsCount: items.length });
    }
    catch (error) {
        console.error("Import Network Error:", error);
        res.status(500).json({ error: 'Failed to import from network', details: error.message });
    }
});
exports.importNetworkXml = importNetworkXml;
const reintegrateExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
        const quote = yield prisma.quote.findUnique({
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
        if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });
        const finalPath = path.join(uploadsDir, filename);
        // Move/Rename
        try {
            fs.renameSync(file.path, finalPath);
        }
        catch (mvErr) {
            fs.copyFileSync(file.path, finalPath);
            fs.unlinkSync(file.path);
        }
        console.log(`[Reintegrate] Uploaded ${originalName} -> ${finalPath}. Queuing for Agent.`);
        // Store standard relative path "uploads/..."
        yield prisma.quote.update({
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
    }
    catch (error) {
        console.error('Reintegrate Quote Error:', error);
        res.status(500).json({ error: 'Failed to queue reintegration', details: String(error) });
    }
});
exports.reintegrateExcel = reintegrateExcel;
const saveRakToNetwork = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            }
            catch (e) {
                console.warn(`Could not create target directory ${targetDir}:`, e);
                return res.status(500).json({ error: `Directory ${targetDir} does not exist and could not be created.` });
            }
        }
        fs.writeFileSync(targetPath, xmlContent, 'utf8');
        console.log(`Saved RAK to ${targetPath}`);
        res.json({ message: 'RAK saved successfully', path: targetPath });
    }
    catch (error) {
        console.error('Save RAK Error:', error);
        res.status(500).json({ error: 'Failed to save RAK file', details: String(error) });
    }
});
exports.saveRakToNetwork = saveRakToNetwork;
const fetchReturnXml = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { filename } = req.body; // e.g., envoi000001.rak (we need to change extension)
    if (!filename)
        return res.status(400).json({ error: 'Filename required' });
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
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Delete existing items
            yield tx.quoteItem.deleteMany({ where: { quoteId: id } });
            // 2. Insert new items
            for (const item of items) {
                // Determine finish (parse description or default)
                let finish = null;
                const descLower = (item.description || '').toLowerCase();
                if (descLower.includes('pol'))
                    finish = 'Polished';
                else if (descLower.includes('hon'))
                    finish = 'Honed';
                else if (descLower.includes('flamb'))
                    finish = 'Flamed';
                yield tx.quoteItem.create({
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
        }));
        // Return updated items to frontend
        const updatedItems = yield prisma.quoteItem.findMany({ where: { quoteId: id } });
        res.json({ message: 'Import successful', items: updatedItems });
    }
    catch (error) {
        console.error("Error processing return XML:", error);
        res.status(500).json({ error: 'Failed to process return XML', details: String(error) });
    }
});
exports.fetchReturnXml = fetchReturnXml;
const downloadQuotePdf = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const quote = yield prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true }
        });
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        const pdfBuffer = yield pdfService_1.PdfService.generateQuotePdf(quote);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${quote.reference}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
exports.downloadQuotePdf = downloadQuotePdf;
const emitQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const quote = yield prisma.quote.findUnique({
            where: { id },
            include: { items: true, project: true, client: true, contact: true }
        });
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        // 1. Generate PDF
        const pdfBuffer = yield pdfService_1.PdfService.generateQuotePdf(quote);
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
        const updatedQuote = yield prisma.quote.update({
            where: { id },
            data: { status: 'Sent' }
        });
        res.json({ message: 'Quote emitted successfully', quote: updatedQuote });
    }
    catch (error) {
        console.error('Error emitting quote:', error);
        res.status(500).json({ error: 'Failed to emit quote' });
    }
});
exports.emitQuote = emitQuote;
// New Endpoint to actually download the result file
const downloadQuoteResult = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const quote = yield prisma.quote.findUnique({
            where: { id },
            include: { project: true }
        });
        if (!quote || !quote.project) {
            return res.status(404).json({ error: 'Quote or Project not found' });
        }
        // STRATEGY A: Sync Agent File (Priority)
        // If status says Agent finished or we have a path, strictly try to serve it.
        // Prevent fallback to legacy if Status is Calculated.
        if (quote.syncStatus === 'Calculated (Agent)' || quote.excelFilePath) {
            console.log(`[DEBUG] Strategy A (Strict Agent). Path: ${quote.excelFilePath}, Status: ${quote.syncStatus}`);
            if (quote.excelFilePath && fs.existsSync(quote.excelFilePath)) {
                // Return the specific uploaded file
                let downloadName = path.basename(quote.excelFilePath);
                // Clean the ID prefix (separated by ___ or __)
                if (downloadName.includes('___')) {
                    downloadName = downloadName.split('___').slice(1).join('___');
                }
                else if (downloadName.includes('__')) {
                    downloadName = downloadName.split('__').slice(1).join('__');
                }
                console.log(`[DEBUG] Sending Synced Excel: ${quote.excelFilePath}. Name: ${downloadName}`);
                const stats = fs.statSync(quote.excelFilePath);
                console.log(`[DEBUG] File Size: ${stats.size} bytes`);
                // Explicitly expose the header for CORS if needed (though usually not issue for direct download)
                res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
                res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
                const fileStream = fs.createReadStream(quote.excelFilePath);
                return fileStream.pipe(res);
            }
            else {
                // File missing despite status
                console.error("Agent said calculated, but file missing at:", quote.excelFilePath);
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
        let files = [];
        try {
            files = fs.readdirSync(projectPath);
            console.log(`Files found in folder (${files.length}): ${files.join(', ')}`);
        }
        catch (e) {
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
            }
            else {
                console.log(`File sent successfully.`);
            }
        });
    }
    catch (error) {
        console.error('Error downloading result:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.downloadQuoteResult = downloadQuoteResult;
const downloadSourceExcel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const quote = yield prisma.quote.findUnique({ where: { id } });
        if (!quote || !quote.excelFilePath) {
            return res.status(404).json({ error: 'Quote or Source Excel not found' });
        }
        const filePath = path.resolve(quote.excelFilePath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File on disk not found', path: filePath });
        }
        res.download(filePath, `Source_${quote.reference}.xlsx`);
    }
    catch (error) {
        console.error("Download Source Excel Error:", error);
        res.status(500).json({ error: 'Failed to download source excel', details: error.message });
    }
});
exports.downloadSourceExcel = downloadSourceExcel;
const reviseQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { materialId, incotermId, paymentTermId, incotermCustomText, paymentCustomText, depositPercentage, delayDays, discountPercentage, discountDays, 
        // V8 Fields
        salesCurrency, exchangeRate, validityDuration, estimatedWeeks, palletRequired, quality, unitPrice // Accepted from body
         } = req.body;
        console.log(`[Revise] Request for Quote ${id}`);
        // 1. Fetch Original Quote
        const originalQuote = yield prisma.quote.findUnique({
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
        let newMaterialName;
        if (materialId) {
            const mat = yield prisma.material.findUnique({ where: { id: materialId } });
            if (mat)
                newMaterialName = mat.name;
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
        }
        else {
            newReference = `${originalQuote.reference}_R1`;
        }
        console.log(`[Revise] Reference: ${originalQuote.reference} -> ${newReference}`);
        // FIX P2002: Check if this revision already exists (Retry scenario)
        const existingRev = yield prisma.quote.findUnique({ where: { reference: newReference } });
        if (existingRev) {
            console.warn(`[Revise] Warning: Revision ${newReference} already exists. Cleaning up for retry...`);
            // Cleanup: Delete items first due to cascade? Prisma usually handles cascade if configured.
            // Safest: Delete specific relations or just delete quote.
            // If we have manual cascade:
            yield prisma.quoteItem.deleteMany({ where: { quoteId: existingRev.id } });
            yield prisma.quote.delete({ where: { id: existingRev.id } });
            console.log(`[Revise] Cleared existing revision ${newReference}.`);
        }
        // 4. Create New Quote Record
        const newQuote = yield prisma.quote.create({
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
            const itemsData = originalQuote.items.map((item) => ({
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
            yield prisma.quoteItem.createMany({
                data: itemsData
            });
        }
        // 5. Agent Delegation (No Local Copy)
        // We do NOT copy files here. The backend runs on Mac and cannot see the Windows Server (F:).
        // Instead, we mark the quote as PENDING_REVISION.
        // The PC Agent will pick this up via the Tunnel, find the original file on F:, copy/rename it, and save the result.
        console.log(`[Revise] Quote ${newQuote.reference} created. Status: PENDING_REVISION. Waiting for Agent.`);
        // Ensure status is correct for Polling
        yield prisma.quote.update({
            where: { id: newQuote.id },
            data: {
                syncStatus: 'PENDING_REVISION'
            }
        });
        res.json(newQuote);
    }
    catch (error) {
        console.error("Revise Quote Error:", error);
        res.status(500).json({ error: 'Failed to revise quote', details: error.message });
    }
});
exports.reviseQuote = reviseQuote;
