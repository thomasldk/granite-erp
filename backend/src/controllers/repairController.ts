import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all repairs (with filters optional)
export const getRepairs = async (req: Request, res: Response) => {
    try {
        const repairs = await prisma.repairRequest.findMany({
            include: {
                equipment: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json(repairs);
    } catch (error) {
        console.error('Error fetching repairs:', error);
        res.status(500).json({ error: 'Failed to fetch repairs' });
    }
};

// Get single repair
export const getRepair = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const repair = await prisma.repairRequest.findUnique({
            where: { id },
            include: { equipment: true }
        });
        if (!repair) {
            res.status(404).json({ error: 'Repair not found' });
            return;
        }
        res.json(repair);
    } catch (error) {
        console.error('Error fetching repair:', error);
        res.status(500).json({ error: 'Failed to fetch repair' });
    }
};

// Create a new repair request

export const createRepair = async (req: Request, res: Response) => {
    try {
        const {
            equipmentId,
            title,
            description,
            priority,
            requester,
            status,
            mechanic,
            isFunctional,
            detectionDate,
            dueDate,
            closedAt,
            type // Added
        } = req.body;

        // Generate a reference number? (e.g. REP-{Date}-{Random})
        // For simplicity, UUID is ID, but users might like "REP-123".
        // I'll auto-generate a simple ref string if not provided.
        const reference = `REP-${Date.now().toString().slice(-6)}`;

        const repair = await prisma.repairRequest.create({
            data: {
                reference,
                equipmentId,
                title,
                description,
                priority: priority || 'Normal',
                status: status || 'Open',
                requester,
                mechanic,
                isFunctional: isFunctional !== undefined ? isFunctional : true,
                detectionDate: detectionDate ? new Date(detectionDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                closedAt: closedAt ? new Date(closedAt) : null,
                type: type || 'Repair'
            },

        });
        res.json(repair);
    } catch (error) {
        console.error('Error creating repair:', error);
        res.status(500).json({ error: 'Failed to create repair' });
    }
};

export const updateRepair = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            equipmentId,
            title,
            description,
            priority,
            requester,
            status,
            mechanic,
            isFunctional,
            detectionDate,
            dueDate,
            closedAt,
            type
        } = req.body;

        const data: any = {
            equipmentId,
            title,
            description,
            priority,
            status,
            requester,
            mechanic,
            isFunctional,
            type
        };

        if (detectionDate) data.detectionDate = new Date(detectionDate);
        if (dueDate) data.dueDate = new Date(dueDate);
        if (closedAt) data.closedAt = new Date(closedAt);

        const repair = await prisma.repairRequest.update({
            where: { id },
            data: data,
        });
        res.json(repair);
    } catch (error) {
        console.error('Error updating repair:', error);
        res.status(500).json({ error: 'Failed to update repair' });
    }
};

export const deleteRepair = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.repairRequest.delete({
            where: { id },
        });
        res.json({ message: 'Repair deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete repair' });
    }
};
