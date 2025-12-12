
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllMaintenanceSites = async (req: Request, res: Response) => {
    try {
        const sites = await prisma.maintenanceSite.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(sites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch maintenance sites' });
    }
};

export const createMaintenanceSite = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = await prisma.maintenanceSite.create({
            data: { name }
        });
        res.status(201).json(site);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create maintenance site' });
    }
};

export const updateMaintenanceSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = await prisma.maintenanceSite.update({
            where: { id },
            data: { name }
        });
        res.json(site);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update maintenance site' });
    }
};

export const deleteMaintenanceSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.maintenanceSite.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete maintenance site' });
    }
};
