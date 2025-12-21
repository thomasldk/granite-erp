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
exports.deleteEquipment = exports.updateEquipment = exports.createEquipment = exports.getEquipments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getEquipments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const equipments = yield prisma_1.default.equipment.findMany({
            include: {
                category: true,
                site: true
            }
        });
        res.json(equipments);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch equipments' });
    }
});
exports.getEquipments = getEquipments;
const createEquipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const equipment = yield prisma_1.default.equipment.create({
            data: data,
        });
        res.json(equipment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create equipment' });
    }
});
exports.createEquipment = createEquipment;
const updateEquipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        const equipment = yield prisma_1.default.equipment.update({
            where: { id },
            data: data,
        });
        res.json(equipment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update equipment' });
    }
});
exports.updateEquipment = updateEquipment;
const deleteEquipment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.equipment.delete({
            where: { id },
        });
        res.json({ message: 'Equipment deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
});
exports.deleteEquipment = deleteEquipment;
