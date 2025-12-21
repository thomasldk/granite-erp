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
exports.deleteRepair = exports.updateRepair = exports.createRepair = exports.getRepair = exports.getRepairs = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Get all repairs (with filters optional)
const getRepairs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repairs = yield prisma_1.default.repairRequest.findMany({
            include: {
                equipment: true,
                parts: {
                    include: {
                        part: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(repairs);
    }
    catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({ error: 'Failed to fetch repairs' });
    }
});
exports.getRepairs = getRepairs;
// Get single repair
const getRepair = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const repair = yield prisma_1.default.repairRequest.findUnique({
            where: { id },
            include: {
                equipment: true,
                parts: {
                    include: {
                        part: true
                    }
                }
            }
        });
        if (!repair) {
            res.status(404).json({ error: 'Repair not found' });
            return;
        }
        res.json(repair);
    }
    catch (error) {
        console.error('Error fetching repair:', error);
        res.status(500).json({ error: 'Failed to fetch repair' });
    }
});
exports.getRepair = getRepair;
// Create a new repair request
const createRepair = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { equipmentId, title, description, priority, requester, status, mechanic, isFunctional, detectionDate, dueDate, closedAt, type, parts, recurrenceFreq, recurrenceDay } = req.body;
        // Generate Reference (simple logic: R-timestamp)
        const reference = `REF-${Date.now()}`;
        const repair = yield prisma_1.default.repairRequest.create({
            data: {
                reference,
                title,
                description,
                priority: priority || 'Normal',
                status: status || 'Open',
                requester,
                mechanic,
                isFunctional: isFunctional === 'true' || isFunctional === true,
                detectionDate: detectionDate ? new Date(detectionDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                closedAt: closedAt ? new Date(closedAt) : null,
                type: type || 'Repair',
                equipmentId: equipmentId || null,
                recurrenceFreq,
                recurrenceDay,
                parts: parts && parts.length > 0 ? {
                    create: parts.map((p) => ({
                        partId: p.partId,
                        quantity: parseFloat(p.quantity) || 1,
                        action: p.action || 'USE'
                    }))
                } : undefined
            }
        });
        res.status(201).json(repair);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating repair request' });
    }
});
exports.createRepair = createRepair;
const updateRepair = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, priority, status, type, equipmentId, mechanic, isFunctional, dueDate, parts, recurrenceFreq, recurrenceDay } = req.body;
        const updateData = {
            title,
            description,
            priority,
            status,
            type,
            equipmentId: equipmentId || null,
            mechanic: mechanic || null,
            recurrenceFreq,
            recurrenceDay
        };
        if (isFunctional !== undefined) {
            updateData.isFunctional = isFunctional === 'true' || isFunctional === true;
        }
        if (dueDate) {
            updateData.dueDate = new Date(dueDate);
        }
        else {
            // If implicit reset needed, or ensure undefined doesn't wipe it unless intended.
            // For maintenance toggling, we might want to set it null if type changes.
            // Letting simple update logic apply here.
            if (dueDate === null)
                updateData.dueDate = null;
        }
        // Handle Parts (Simple replace logic: delete all, re-create)
        // In chaos/production, better to use transaction or smart upsert.
        if (parts) {
            updateData.parts = {
                deleteMany: {},
                create: parts.map((p) => ({
                    partId: p.partId,
                    quantity: parseFloat(p.quantity) || 1,
                    action: p.action || 'USE'
                }))
            };
        }
        const repair = yield prisma_1.default.repairRequest.update({
            where: { id },
            data: updateData
        });
        res.json(repair);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating repair request' });
    }
});
exports.updateRepair = updateRepair;
const deleteRepair = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.repairRequest.delete({
            where: { id },
        });
        res.json({ message: 'Repair deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete repair' });
    }
});
exports.deleteRepair = deleteRepair;
