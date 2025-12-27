import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

export const getContactTypes = async (req: Request, res: Response) => {
    try {
        const { category } = req.query;
        const where = category ? { category: String(category) } : {};

        const types = await prisma.contactType.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact types' });
    }
};

export const createContactType = async (req: Request, res: Response) => {
    try {
        const { name, nameEn, category } = req.body;
        const type = await prisma.contactType.create({
            data: {
                name,
                nameEn: nameEn || null, // Optional
                category: category || 'Client' // Default to Client
            }
        });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create contact type' });
    }
};

export const updateContactType = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, nameEn, category } = req.body;
        const type = await prisma.contactType.update({
            where: { id },
            data: { name, nameEn, category }
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact type' });
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
