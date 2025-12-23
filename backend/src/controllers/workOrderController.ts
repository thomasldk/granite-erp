import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';

// Helper: Generate BT Reference (BT25-0001)
const generateNextWorkOrderReference = async (): Promise<string> => {
    const yearShort = new Date().getFullYear().toString().slice(-2); // 25
    const prefix = `BT${yearShort}-`;

    // Find last WO starting with BT25-
    const lastWO = await prisma.workOrder.findFirst({
        where: { reference: { startsWith: prefix } },
        orderBy: { reference: 'desc' }
    });

    if (!lastWO) {
        return `${prefix}0001`;
    }

    // Extract number
    const lastRef = lastWO.reference; // BT25-0001
    const parts = lastRef.split('-');
    if (parts.length === 2 && !isNaN(parseInt(parts[1]))) {
        const lastNum = parseInt(parts[1]);
        const nextNum = (lastNum + 1).toString().padStart(4, '0');
        return `${prefix}${nextNum}`;
    }

    // Fallback if format is weird
    return `${prefix}${Date.now()}`;
};

export const createWorkOrder = async (req: Request, res: Response) => {
    try {
        const {
            quoteId,
            productionWeeks,
            clientPO,
            projectManagerId,
            accountingContactId,
            note,
            productionSiteId // Extract
            // Dates are handled below
        } = req.body;

        const file = req.file; // From Multer

        // 1. Check if Quote exists
        const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
        if (!quote) {
            return res.status(404).json({ error: 'Quote not found' });
        }

        // 2. Check if WO already exists
        const existingWO = await prisma.workOrder.findUnique({ where: { quoteId } });
        if (existingWO) {
            return res.status(400).json({ error: 'Work Order already exists for this Quote' });
        }

        // 3. Generate Reference
        const reference = await generateNextWorkOrderReference();

        // 4. Calculate Dates
        const mepDate = new Date();
        const weeks = parseInt(productionWeeks) || quote.estimatedWeeks || 4;
        const deadlineDate = new Date(mepDate);
        deadlineDate.setDate(deadlineDate.getDate() + (weeks * 7));

        // Default delivery/required to deadline if not provided (logic can be expanded)
        const deliveryDate = deadlineDate;
        const clientRequiredDate = deadlineDate;

        // 5. Handle File
        let clientPOFilePath = null;
        if (file) {
            // Move from temp to final? Or just use the path provided by Multer setup
            // Assuming Multer saves to uploads/client_pos, we store the relative path
            clientPOFilePath = file.path;
        }

        // 6. Create Work Order
        const newWO = await prisma.workOrder.create({
            data: {
                reference,
                quoteId,
                status: 'Open',
                mepDate,
                deadlineDate,
                deliveryDate,
                clientRequiredDate,
                productionWeeks: weeks,
                clientPO: clientPO || null,
                clientPOFilePath,
                projectManagerId: projectManagerId || null,
                accountingContactId: accountingContactId || null,
                note: note || null,
                productionSiteId: productionSiteId || null // Save
            }
        });

        // 7. Update Quote Status
        await prisma.quote.update({
            where: { id: quoteId },
            data: { status: 'In Production' }
        });

        res.status(201).json(newWO);

    } catch (error: any) {
        console.error('Error creating Work Order:', error);
        res.status(500).json({ error: 'Failed to create Work Order', details: error.message });
    }
};

export const getWorkOrders = async (req: Request, res: Response) => {
    try {
        const wos = await prisma.workOrder.findMany({
            include: {
                quote: {
                    include: {
                        client: true,
                        project: true,
                        items: true // Needed for Production Line View
                    }
                },
                productionSite: true // Include Site Name
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(wos);
    } catch (error) {
        console.error('Error fetching Work Orders:', error);
        res.status(500).json({ error: 'Failed to fetch Work Orders' });
    }
};

export const getWorkOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const wo = await prisma.workOrder.findUnique({
            where: { id },
            include: {
                quote: {
                    include: {
                        client: true,
                        project: true,
                        items: true // For detailed view
                    }
                },
                projectManager: true,
                accountingContact: true,
                pallets: {
                    include: { items: true }
                }
            }
        });

        if (!wo) return res.status(404).json({ error: 'Work Order not found' });

        res.json(wo);
    } catch (error) {
        console.error('Error fetching Work Order:', error);
        res.status(500).json({ error: 'Failed to fetch Work Order' });
    }
};

export const updateWorkOrder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updatedWO = await prisma.workOrder.update({
            where: { id },
            data: data
        });

        res.json(updatedWO);
    } catch (error) {
        console.error('Error updating Work Order:', error);
        res.status(500).json({ error: 'Failed to update Work Order' });
    }
};

export const createPallet = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // WorkOrderId
        const { items } = req.body; // Array of { quoteItemId, quantity }

        // Get next pallet number for this WO
        const lastPallet = await prisma.pallet.findFirst({
            where: { workOrderId: id },
            orderBy: { number: 'desc' }
        });
        const number = (lastPallet?.number || 0) + 1;

        // Create Pallet
        const pallet = await prisma.pallet.create({
            data: {
                workOrderId: id,
                number,
                status: 'Open',
                items: {
                    create: items.map((item: any) => ({
                        quoteItemId: item.quoteItemId,
                        quantity: parseFloat(item.quantity)
                    }))
                }
            },
            include: { items: true }
        });

        res.status(201).json(pallet);
    } catch (error) {
        console.error('Error creating Pallet:', error);
        res.status(500).json({ error: 'Failed to create Pallet' });
    }
};

// 9. View Client PO
export const viewClientPO = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const wo = await prisma.workOrder.findUnique({ where: { id } });

        if (!wo || !wo.clientPOFilePath) {
            return res.status(404).json({ error: 'Fichier PO introuvable' });
        }

        // Construct absolute path
        const filePath = path.resolve(wo.clientPOFilePath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Fichier physique introuvable sur le serveur' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('Error viewing PO:', error);
        res.status(500).json({ error: 'Failed to view PO' });
    }
};

// 10. Get Next Reference (API Endpoint)
export const getNextReference = async (req: Request, res: Response) => {
    try {
        const reference = await generateNextWorkOrderReference();
        res.json({ reference });
    } catch (error) {
        console.error('Error getting next reference:', error);
        res.status(500).json({ error: 'Failed to generate reference' });
    }
};
