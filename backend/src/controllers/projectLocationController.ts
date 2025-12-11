import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProjectLocations = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.projectLocation.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
};


export const createProjectLocation = async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
        const existing = await prisma.projectLocation.findUnique({
            where: { name }
        });

        if (existing) {
            return res.status(200).json(existing);
        }

        const location = await prisma.projectLocation.create({
            data: { name }
        });
        res.status(201).json(location);
    } catch (error) {
        console.error("Create Location Error:", error);
        res.status(500).json({
            error: 'Failed to create location',
            details: (error as any).message || String(error),
            receivedBody: req.body
        });
    }
};

export const deleteProjectLocation = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.projectLocation.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete location' });
    }
};
