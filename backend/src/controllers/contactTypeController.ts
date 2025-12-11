import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getContactTypes = async (req: Request, res: Response) => {
    try {
        const types = await prisma.contactType.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact types' });
    }
};

export const createContactType = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const type = await prisma.contactType.create({
            data: { name }
        });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create contact type' });
    }
};

export const deleteContactType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.contactType.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete contact type' });
    }
};
