import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getRepresentatives = async (req: Request, res: Response) => {
    try {
        const reps = await prisma.representative.findMany({
            orderBy: { lastName: 'asc' }
        });
        res.json(reps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch representatives' });
    }
};

export const createRepresentative = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, phone, mobile, fax } = req.body;
        const rep = await prisma.representative.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                mobile,
                fax,
                active: true
            }
        });
        res.status(201).json(rep);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create representative', details: error });
    }
};

export const updateRepresentative = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, mobile, fax, active } = req.body;
        const rep = await prisma.representative.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                mobile,
                fax,
                active
            }
        });
        res.json(rep);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update representative', details: error });
    }
};

export const deleteRepresentative = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.representative.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete representative' });
    }
};
