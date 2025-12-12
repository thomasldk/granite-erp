
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPartCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.partCategory.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { parts: true } } }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching part categories' });
    }
};

export const getPartCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await prisma.partCategory.findUnique({
            where: { id }
        });
        if (!category) return res.status(404).json({ error: 'Part Category not found' });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching part category' });
    }
};

export const createPartCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const category = await prisma.partCategory.create({
            data: { name }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error creating part category' });
    }
};

export const updatePartCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await prisma.partCategory.update({
            where: { id },
            data: { name }
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Error updating part category' });
    }
};

export const deletePartCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.partCategory.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting part category' });
    }
};
