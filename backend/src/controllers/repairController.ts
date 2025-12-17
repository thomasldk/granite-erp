import { Request, Response } from 'express';
import prisma from '../prisma';

// Get all repairs (with filters optional)
export const getRepairs = async (req: Request, res: Response) => {
    try {
        const repairs = await prisma.repairRequest.findMany({
            include: {
                equipment: true,
                parts: {
                    include: {
                        part: true
                    }
                }
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
            include: {
                equipment: true,
                parts: {
                    include: {
                        part: true
                    }
                }
            }
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
            equipmentId, title, description, priority,
            requester, status, mechanic, isFunctional,
            detectionDate, dueDate, closedAt, type, parts,
            recurrenceFreq, recurrenceDay
        } = req.body;

        // Generate Reference (simple logic: R-timestamp)
        const reference = `REF-${Date.now()}`;

        const repair = await prisma.repairRequest.create({
            data: {
                reference,
                title,
                description,
                priority: priority || 'Normal',
                status: status || 'Open',
                requester,
                mechanic,
                isFunctional: isFunctional === 'true' || isFunctional === true,
                detectionDate: detectionDate ? new Date(detectionDate) : new Date(),
                dueDate: dueDate ? new Date(dueDate) : null,
                closedAt: closedAt ? new Date(closedAt) : null,
                type: type || 'Repair',
                equipmentId: equipmentId || null,
                recurrenceFreq,
                recurrenceDay,
                parts: parts && parts.length > 0 ? {
                    create: parts.map((p: any) => ({
                        partId: p.partId,
                        quantity: parseFloat(p.quantity) || 1,
                        action: p.action || 'USE'
                    }))
                } : undefined
            }
        });

        res.status(201).json(repair);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating repair request' });
    }
};

export const updateRepair = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            title, description, priority, status, type, equipmentId,
            mechanic, isFunctional, dueDate, parts,
            recurrenceFreq, recurrenceDay
        } = req.body;

        const updateData: any = {
            title,
            description,
            priority,
            status,
            type,
            equipmentId: equipmentId || null,
            mechanic: mechanic || null,
            recurrenceFreq,
            recurrenceDay
        };

        if (isFunctional !== undefined) {
            updateData.isFunctional = isFunctional === 'true' || isFunctional === true;
        }

        if (dueDate) {
            updateData.dueDate = new Date(dueDate);
        } else {
            // If implicit reset needed, or ensure undefined doesn't wipe it unless intended.
            // For maintenance toggling, we might want to set it null if type changes.
            // Letting simple update logic apply here.
            if (dueDate === null) updateData.dueDate = null;
        }

        // Handle Parts (Simple replace logic: delete all, re-create)
        // In chaos/production, better to use transaction or smart upsert.
        if (parts) {
            updateData.parts = {
                deleteMany: {},
                create: parts.map((p: any) => ({
                    partId: p.partId,
                    quantity: parseFloat(p.quantity) || 1,
                    action: p.action || 'USE'
                }))
            };
        }

        const repair = await prisma.repairRequest.update({
            where: { id },
            data: updateData
        });

        res.json(repair);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating repair request' });
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
