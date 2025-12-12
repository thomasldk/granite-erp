
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getParts = async (req: Request, res: Response) => {
    try {
        const parts = await prisma.part.findMany({
            include: {
                category: true,
                equipment: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(parts);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching parts' });
    }
};

export const getPartById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const part = await prisma.part.findUnique({
            where: { id },
            include: {
                category: true,
                equipment: true
            }
        });
        if (!part) return res.status(404).json({ error: 'Part not found' });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching part' });
    }
};

export const createPart = async (req: Request, res: Response) => {
    try {
        const { name, reference, stockQuantity, minQuantity, categoryId, equipmentId, description, location, note, supplier } = req.body;
        const part = await prisma.part.create({
            data: {
                name,
                reference,
                stockQuantity: parseInt(stockQuantity) || 0,
                minQuantity: parseInt(minQuantity) || 0,
                description,
                location,
                note,
                supplier,
                categoryId: categoryId || null,
                equipmentId: equipmentId || null
            }
        });
        res.status(201).json(part);
    } catch (error) {
        res.status(500).json({ error: 'Error creating part' });
    }
};

export const updatePart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, reference, stockQuantity, minQuantity, categoryId, equipmentId, description, location, note, supplier } = req.body;
        const part = await prisma.part.update({
            where: { id },
            data: {
                name,
                reference,
                stockQuantity: parseInt(stockQuantity) || 0,
                minQuantity: parseInt(minQuantity) || 0,
                description,
                location,
                note,
                supplier,
                categoryId: categoryId || null,
                equipmentId: equipmentId || null
            }
        });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: 'Error updating part' });
    }
};

export const deletePart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.part.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting part' });
    }
};
