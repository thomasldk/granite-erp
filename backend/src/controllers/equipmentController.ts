import { Request, Response } from 'express';
import prisma from '../prisma';

export const getEquipments = async (req: Request, res: Response) => {
    try {
        const equipments = await prisma.equipment.findMany({
            include: {
                category: true,
                site: true
            }
        });
        res.json(equipments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch equipments' });
    }
};

export const createEquipment = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const equipment = await prisma.equipment.create({
            data: data,
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create equipment' });
    }
};

export const updateEquipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const equipment = await prisma.equipment.update({
            where: { id },
            data: data,
        });
        res.json(equipment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update equipment' });
    }
};

export const deleteEquipment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.equipment.delete({
            where: { id },
        });
        res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete equipment' });
    }
};
