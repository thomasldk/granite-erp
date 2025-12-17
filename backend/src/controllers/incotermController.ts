import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

export const getIncoterms = async (req: Request, res: Response) => {
    try {
        const incoterms = await prisma.incoterm.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(incoterms);
    } catch (error) {
        console.error('Error fetching incoterms:', error);
        res.status(500).json({ error: 'Error fetching incoterms' });
    }
};
