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
exports.generateQuoteXml = exports.deleteQuote = exports.addQuoteItem = exports.getQuoteById = exports.createQuote = exports.deleteProject = exports.getProjects = exports.updateProject = exports.createProject = exports.getNextProjectReference = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
// --- PROJECTS ---
const getNextProjectReference = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const year = new Date().getFullYear().toString().slice(-2); // 25
        const prefix = `P${year}-`;
        const lastProject = yield prisma_1.default.project.findFirst({
            where: { reference: { startsWith: prefix } },
            orderBy: { createdAt: 'desc' }
        });
        let nextNum = 1;
        if (lastProject) {
            const parts = lastProject.reference.split('-');
            if (parts.length >= 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num))
                    nextNum = num + 1;
            }
        }
        const reference = `${prefix}${nextNum.toString().padStart(4, '0')}`;
        res.json({ reference });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate project reference' });
    }
});
exports.getNextProjectReference = getNextProjectReference;
const createProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, thirdPartyId, status, locationId, locationName, measureSystem, estimatedWeeks, numberOfLines, reference: providedRef } = req.body;
        let reference = providedRef;
        // If no reference provided, generate one
        if (!reference) {
            const year = new Date().getFullYear().toString().slice(-2);
            const prefix = `P${year}-`;
            const lastProject = yield prisma_1.default.project.findFirst({
                where: { reference: { startsWith: prefix } },
                orderBy: { createdAt: 'desc' }
            });
            let nextNum = 1;
            if (lastProject) {
                const parts = lastProject.reference.split('-');
                if (parts.length >= 2) {
                    const num = parseInt(parts[1]);
                    if (!isNaN(num))
                        nextNum = num + 1;
                }
            }
            reference = `${prefix}${nextNum.toString().padStart(4, '0')}`;
        }
        let finalLocationId = locationId;
        // Handle text-based location creation/lookup
        if (!finalLocationId && locationName) {
            // Try to find existing by name
            const existingLoc = yield prisma_1.default.projectLocation.findUnique({
                where: { name: locationName }
            });
            if (existingLoc) {
                finalLocationId = existingLoc.id;
            }
            else {
                // Create new
                const newLoc = yield prisma_1.default.projectLocation.create({
                    data: { name: locationName }
                });
                finalLocationId = newLoc.id;
            }
        }
        const project = yield prisma_1.default.project.create({
            data: {
                name,
                reference,
                status: status || 'Prospect',
                thirdPartyId: thirdPartyId || undefined, // Optional now
                locationId: finalLocationId || undefined,
                measureSystem: measureSystem || 'Imperial',
                estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
                numberOfLines: numberOfLines ? parseInt(numberOfLines) : undefined
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create project', details: error });
    }
});
exports.createProject = createProject;
const updateProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, thirdPartyId, status, locationId, locationName, measureSystem, estimatedWeeks, numberOfLines } = req.body;
        let finalLocationId = locationId;
        // Handle text-based location creation/lookup
        if (locationName) {
            // Try to find existing by name
            const existingLoc = yield prisma_1.default.projectLocation.findUnique({
                where: { name: locationName }
            });
            if (existingLoc) {
                finalLocationId = existingLoc.id;
            }
            else {
                // Create new
                const newLoc = yield prisma_1.default.projectLocation.create({
                    data: { name: locationName }
                });
                finalLocationId = newLoc.id;
            }
        }
        // Build data object dynamically to allow partial updates
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (status !== undefined)
            updateData.status = status;
        if (measureSystem !== undefined)
            updateData.measureSystem = measureSystem;
        // Handle Nullable fields: If present but empty/falsy/null, set to null. If undefined, ignore.
        // For IDs/Relations:
        if (thirdPartyId !== undefined)
            updateData.thirdPartyId = thirdPartyId || null;
        if (finalLocationId !== undefined || locationId !== undefined)
            updateData.locationId = finalLocationId || null;
        // For Numbers:
        if (estimatedWeeks !== undefined)
            updateData.estimatedWeeks = estimatedWeeks ? parseInt(estimatedWeeks) : null;
        if (numberOfLines !== undefined)
            updateData.numberOfLines = numberOfLines ? parseInt(numberOfLines) : null;
        const project = yield prisma_1.default.project.update({
            where: { id },
            data: updateData
        });
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update project', details: error });
    }
});
exports.updateProject = updateProject;
const getProjects = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const projects = yield prisma_1.default.project.findMany({
            include: {
                client: true,
                quotes: {
                    include: {
                        client: {
                            include: { addresses: true }
                        },
                        material: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                location: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});
exports.getProjects = getProjects;
// ... (existing getProjects) ...
const deleteProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Manual Cascade: Delete related quotes first (items are deleted by deleteQuote logic usually, but here we do raw deleteMany)
        // First find quotes to delete their items? Or trust Cascade if defined?
        // Let's do manual clean up to be safe.
        const quotes = yield prisma_1.default.quote.findMany({ where: { projectId: id } });
        for (const q of quotes) {
            yield prisma_1.default.quoteItem.deleteMany({ where: { quoteId: q.id } });
        }
        yield prisma_1.default.quote.deleteMany({ where: { projectId: id } });
        // Finally delete project
        yield prisma_1.default.project.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ error: 'Failed to delete project', details: error });
    }
});
exports.deleteProject = deleteProject;
// --- QUOTES ---
const createQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { projectId, thirdPartyId, contactId, currency } = req.body;
        if (!thirdPartyId) {
            return res.status(400).json({ error: 'ThirdPartyId is required for a quote' });
        }
        // Generate reference logic: DRC25-XXXX-C0R0
        const year = new Date().getFullYear().toString().slice(-2);
        // Find last quote to increment sequence
        const lastQuote = yield prisma_1.default.quote.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        let sequence = '0001';
        if (lastQuote && lastQuote.reference && lastQuote.reference.startsWith(`DRC${year}-`)) {
            // Try to extract the 4 digits
            const parts = lastQuote.reference.split('-');
            if (parts.length >= 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) {
                    sequence = (num + 1).toString().padStart(4, '0');
                }
            }
        }
        else if (lastQuote && !lastQuote.reference.startsWith(`DRC${year}-`)) {
            // Reset sequence if new year or different pattern? 
            // Ideally we just count, but let's stick to 0001 if no pattern match for safety or simplicity
            // Actually, if we have previous quotes (Q-...), we should probably just count total?
            // Let's stick to finding the last *matching* pattern or just counting.
            // Safest simple logical increment:
            const count = yield prisma_1.default.quote.count();
            sequence = (count + 1).toString().padStart(4, '0');
        }
        const reference = `DRC${year}-${sequence}-C0R0`;
        const quote = yield prisma_1.default.quote.create({
            data: {
                reference,
                projectId,
                thirdPartyId,
                contactId,
                currency: currency || 'CAD',
                status: 'Draft',
                version: 1
            }
        });
        res.status(201).json(quote);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create quote', details: error });
    }
});
exports.createQuote = createQuote;
const getQuoteById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const quote = yield prisma_1.default.quote.findUnique({
            where: { id },
            include: {
                project: { include: { client: true } },
                items: true // No longer relational to catalog
            }
        });
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        res.json(quote);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
});
exports.getQuoteById = getQuoteById;
const addQuoteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { quoteId } = req.params;
        // Updated payload to match free-text schema:
        const { tag, material, description, quantity, unit, length, width, thickness } = req.body;
        // Basic Price defaults (User sets this later in Excel usually, but we init to 0)
        let unitPrice = 0;
        const totalPrice = 0;
        const item = yield prisma_1.default.quoteItem.create({
            data: {
                quoteId,
                tag,
                material,
                description,
                quantity: parseFloat(quantity),
                unit,
                length: length ? parseFloat(length) : undefined,
                width: width ? parseFloat(width) : undefined,
                thickness: thickness ? parseFloat(thickness) : undefined,
                unitPrice,
                totalPrice
            }
        });
        res.status(201).json(item);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add item', details: error });
    }
});
exports.addQuoteItem = addQuoteItem;
const deleteQuote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Manually delete related items first to ensure no FK constraint error
        // even if DB cascade is missing
        yield prisma_1.default.quoteItem.deleteMany({
            where: { quoteId: id }
        });
        // Now delete the quote
        yield prisma_1.default.quote.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete quote', details: error });
    }
});
exports.deleteQuote = deleteQuote;
const xmlService_1 = require("../services/xmlService");
const generateQuoteXml = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const quote = yield prisma_1.default.quote.findUnique({
            where: { id },
            include: {
                project: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } },
                items: true, // Removed productionSite include as it's not used in XML anymore and caused type issues
                contact: true,
                material: true
            }
        });
        if (!quote)
            return res.status(404).json({ error: 'Quote not found' });
        const quoteAny = quote; // Cast to any to avoid strict type checks on deep relations
        // Fetch Representative if exists
        let rep = null;
        if ((_a = quoteAny.client) === null || _a === void 0 ? void 0 : _a.repName) {
            const [firstName, ...rest] = quoteAny.client.repName.split(' ');
            const lastName = rest.join(' ');
            rep = yield prisma_1.default.representative.findFirst({
                where: {
                    firstName: { contains: firstName },
                    lastName: { contains: lastName }
                }
            });
        }
        const xmlService = new xmlService_1.XmlService();
        const xmlContent = yield xmlService.generateQuoteXml(quote, rep);
        res.header('Content-Type', 'application/xml');
        res.attachment(`${quote.reference}.rak`); // Extension changed to .rak
        res.send(xmlContent);
    }
    catch (error) {
        console.error("XML Gen Error:", error);
        res.status(500).json({ error: 'Failed to generate XML', details: error });
    }
});
exports.generateQuoteXml = generateQuoteXml;
