import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllMaintenanceRequests = async (req: Request, res: Response) => {
    try {
        const requests = await prisma.maintenanceRequest.findMany({
            include: {
                equipment: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching maintenance requests' });
    }
};

export const getMaintenanceRequestById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const request = await prisma.maintenanceRequest.findUnique({
            where: { id },
            include: {
                equipment: true
            }
        });
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching request' });
    }
};

export const createMaintenanceRequest = async (req: Request, res: Response) => {
    // Basic body extraction, will refine based on image fields
    const {
        reference,
        description,
        status,
        priority,
        equipmentId,
        detectionDate,
        isOperational,
        authorName,
        requesterName,
        mechanicName,
        dueDate,
        location,
        closedAt
    } = req.body;

    // Use provided reference or generate a simple one (handled by default in schema for now, but better here)
    // For now, let's trust the body or fallbacks

    try {
        const requestsCount = await prisma.maintenanceRequest.count();
        const autoReference = reference || `REP-${new Date().getFullYear()}-${String(requestsCount + 1).padStart(4, '0')}`;

        const newRequest = await prisma.maintenanceRequest.create({
            data: {
                reference: autoReference,
                description,
                status,
                priority,
                equipmentId: equipmentId || null,
                detectionDate: detectionDate ? new Date(detectionDate) : new Date(),
                isOperational: isOperational !== undefined ? isOperational : true,
                authorName,
                requesterName,
                mechanicName,
                dueDate: dueDate ? new Date(dueDate) : null,
                location,
                closedAt: closedAt ? new Date(closedAt) : null,
            }
        });
        res.status(201).json(newRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating maintenance request' });
    }
};

export const updateMaintenanceRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        reference,
        description,
        status,
        priority,
        equipmentId,
        detectionDate,
        isOperational,
        authorName,
        requesterName,
        mechanicName,
        dueDate,
        location,
        closedAt
    } = req.body;

    try {
        const updated = await prisma.maintenanceRequest.update({
            where: { id },
            data: {
                reference,
                description,
                status,
                priority,
                equipmentId: equipmentId || null,
                detectionDate: detectionDate ? new Date(detectionDate) : undefined,
                isOperational: isOperational,
                authorName,
                requesterName,
                mechanicName,
                dueDate: dueDate ? new Date(dueDate) : null,
                location,
                closedAt: closedAt ? new Date(closedAt) : null,
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Error updating maintenance request' });
    }
};

export const deleteMaintenanceRequest = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.maintenanceRequest.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Error deleting maintenance request' });
    }
};
