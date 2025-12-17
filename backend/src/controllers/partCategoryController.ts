import { Request, Response } from 'express';
import prisma from '../prisma';

export const getPartCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.partCategory.findMany();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch part categories' });
    }
};

export const createPartCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const category = await prisma.partCategory.create({
            data: { name },
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create part category' });
    }
};

export const updatePartCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = await prisma.partCategory.update({
            where: { id },
            data: { name },
        });
        res.json(category);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update part category' });
    }
};

export const deletePartCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.partCategory.delete({
            where: { id },
        });
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete part category' });
    }
};
