import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

export const getAllMaterials = async (req: Request, res: Response) => {
    try {
        const { name } = req.query;
        const where: any = {};
        if (name) {
            where.name = String(name);
        }

        const materials = await prisma.material.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { supplier: true }
        });
        res.json(materials);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching materials' });
    }
};

export const getMaterialById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const material = await prisma.material.findUnique({
            where: { id },
            include: { supplier: true }
        });
        if (!material) return res.status(404).json({ error: 'Material not found' });
        res.json(material);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching material' });
    }
};

export const createMaterial = async (req: Request, res: Response) => {
    try {
        const {
            name, category, type,
            // Prices & Units
            purchasePrice, sellingPrice, unit,
            sellingUnit, // Added
            // Density & Waste
            density, densityUnit, wasteFactor,
            // Quality
            quality,
            // Meta
            imageUrl, supplierId
        } = req.body;

        const material = await prisma.material.create({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating material' });
    }
};

export const updateMaterial = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        name, category, type,
        purchasePrice, sellingPrice, unit,
        sellingUnit, // Added
        density, densityUnit, wasteFactor, quality,
        imageUrl, supplierId
    } = req.body;
    try {
        const material = await prisma.material.update({
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
    } catch (error) {
        res.status(500).json({ error: 'Error updating material' });
    }
};

export const deleteMaterial = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.material.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting material' });
    }
};
