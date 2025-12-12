import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllEquipment = async (req: Request, res: Response) => {
    try {
        const equipment = await prisma.equipment.findMany({
            include: {
                productionSite: true,
                supplier: true
            },
            orderBy: { number: 'asc' }
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching equipment' });
    }
};

export const getEquipmentById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const equipment = await prisma.equipment.findUnique({
            where: { id },
            include: {
                productionSite: true,
                supplier: true,
                parts: true,
                requests: true
            }
        });
        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching equipment' });
    }
};

export const createEquipment = async (req: Request, res: Response) => {
    const { number, name, serialNumber, category, productionSiteId, supplierId } = req.body;
    try {
        const content = await prisma.equipment.create({
            data: {
                number,
                name,
                serialNumber,
                category,
                productionSiteId: productionSiteId || null,
                supplierId: supplierId || null
            }
        });
        res.status(201).json(content);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating equipment' });
    }
};

export const updateEquipment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { number, name, serialNumber, category, productionSiteId, supplierId } = req.body;
    try {
        const updated = await prisma.equipment.update({
            where: { id },
            data: {
                number,
                name,
                serialNumber,
                category,
                productionSiteId: productionSiteId || null,
                supplierId: supplierId || null
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Error updating equipment' });
    }
};

export const deleteEquipment = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.equipment.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting equipment' });
    }
};
