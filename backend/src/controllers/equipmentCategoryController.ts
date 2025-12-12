import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.equipmentCategory.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching categories' });
    }
};

export const getCategoryById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const category = await prisma.equipmentCategory.findUnique({
            where: { id },
        });
        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ error: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching category' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
        const newCategory = await prisma.equipmentCategory.create({
            data: { name },
        });
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Error creating category' });
    }
};

export const updateCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const updatedCategory = await prisma.equipmentCategory.update({
            where: { id },
            data: { name },
        });
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ error: 'Error updating category' });
    }
};

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.equipmentCategory.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting category' });
    }
};
