
import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

export const getAllProductionSites = async (req: Request, res: Response) => {
    try {
        const sites = await prisma.productionSite.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(sites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch production sites' });
    }
};

export const createProductionSite = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = await prisma.productionSite.create({
            data: { name }
        });
        res.status(201).json(site);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create production site' });
    }
};

export const updateProductionSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = await prisma.productionSite.update({
            where: { id },
            data: { name }
        });
        res.json(site);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update production site' });
    }
};

export const deleteProductionSite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.productionSite.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete production site' });
    }
};
