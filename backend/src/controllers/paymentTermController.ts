
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPaymentTerms = async (req: Request, res: Response) => {
    try {
        const paymentTerms = await prisma.paymentTerm.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(paymentTerms);
    } catch (error) {
        console.error('Error fetching payment terms:', error);
        res.status(500).json({ error: 'Failed to fetch payment terms' });
    }
};
