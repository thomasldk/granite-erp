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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaterial = exports.updateMaterial = exports.createMaterial = exports.getMaterialById = exports.getAllMaterials = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllMaterials = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.query;
        const where = {};
        if (name) {
            where.name = String(name);
        }
        const materials = yield prisma.material.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { supplier: true }
        });
        res.json(materials);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching materials' });
    }
});
exports.getAllMaterials = getAllMaterials;
const getMaterialById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const material = yield prisma.material.findUnique({
            where: { id },
            include: { supplier: true }
        });
        if (!material)
            return res.status(404).json({ error: 'Material not found' });
        res.json(material);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching material' });
    }
});
exports.getMaterialById = getMaterialById;
const createMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category, type, 
        // Prices & Units
        purchasePrice, sellingPrice, unit, sellingUnit, // Added
        // Density & Waste
        density, densityUnit, wasteFactor, 
        // Quality
        quality, 
        // Meta
        imageUrl, supplierId } = req.body;
        const material = yield prisma.material.create({
            data: {
                name,
                category: category || 'Stone',
                type,
                purchasePrice: parseFloat(purchasePrice),
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
                unit: unit || 'sqft',
                sellingUnit: sellingUnit || 'sqft', // Default to sqft
                density: density ? parseFloat(density) : null,
                densityUnit: densityUnit || 'lb/ft3',
                wasteFactor: wasteFactor ? parseFloat(wasteFactor) : 4.0,
                quality: quality || 'S',
                imageUrl,
                supplierId
            }
        });
        res.json(material);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating material' });
    }
});
exports.createMaterial = createMaterial;
const updateMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name, category, type, purchasePrice, sellingPrice, unit, sellingUnit, // Added
    density, densityUnit, wasteFactor, quality, imageUrl, supplierId } = req.body;
    try {
        const material = yield prisma.material.update({
            where: { id },
            data: {
                name,
                category,
                type,
                purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
                sellingPrice: sellingPrice !== undefined ? (sellingPrice ? parseFloat(sellingPrice) : null) : undefined,
                unit,
                sellingUnit, // Added
                density: density !== undefined ? parseFloat(density) : undefined,
                densityUnit,
                wasteFactor: wasteFactor !== undefined ? parseFloat(wasteFactor) : undefined,
                quality,
                imageUrl,
                supplierId
            }
        });
        res.json(material);
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating material' });
    }
});
exports.updateMaterial = updateMaterial;
const deleteMaterial = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.material.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting material' });
    }
});
exports.deleteMaterial = deleteMaterial;
