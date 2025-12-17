import { Request, Response } from 'express';
import prisma from '../prisma';

export const getParts = async (req: Request, res: Response) => {
    try {
        const parts = await prisma.part.findMany({
            include: {
                category: true,
                site: true
            }
        });
        res.json(parts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch parts' });
    }
};

export const createPart = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const part = await prisma.part.create({
            data: data,
        });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create part' });
    }
};

export const updatePart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const part = await prisma.part.update({
            where: { id },
            data: data,
        });
        res.json(part);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update part' });
    }
};

export const deletePart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.part.delete({
            where: { id },
        });
        res.json({ message: 'Part deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete part' });
    }
};
