import { Request, Response } from 'express';
import prisma from '../prisma';
import path from 'path';
import fs from 'fs';
import { XmlService } from '../services/xmlService';

const xmlService = new XmlService();

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
                productionSite: true, // Include Site Name
                pallets: {
                    include: { items: true }
                }
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

export const updatePallet = async (req: Request, res: Response) => {
    try {
        const { id, palletId } = req.params; // id=workOrder, palletId=pallet
        const { status, items } = req.body; // items = [{ quoteItemId, quantity }]

        // 1. Update Status & Items
        // If items are provided, we replace them entirely (Transaction-like)
        const updateData: any = {};
        if (status) updateData.status = status;

        // If generic update (status only), simple update
        if (!items) {
            const updated = await prisma.pallet.update({
                where: { id: palletId },
                data: updateData,
                include: { items: true }
            });
            return res.json(updated);
        }

        // If items provided, use transaction to replace items
        const updatedPallet = await prisma.$transaction(async (tx) => {
            // Update pallet details
            const p = await tx.pallet.update({
                where: { id: palletId },
                data: updateData
            });

            // Delete old items
            await tx.palletItem.deleteMany({
                where: { palletId }
            });

            // Create new items (filter out 0 quantity)
            const validItems = items.filter((i: any) => parseFloat(i.quantity) > 0);

            if (validItems.length > 0) {
                await tx.palletItem.createMany({
                    data: validItems.map((item: any) => ({
                        palletId,
                        quoteItemId: item.quoteItemId,
                        quantity: parseFloat(item.quantity)
                    }))
                });
            }

            return tx.pallet.findUnique({
                where: { id: palletId },
                include: { items: true }
            });
        });

        res.json(updatedPallet);

    } catch (error) {
        console.error('Error updating Pallet:', error);
        res.status(500).json({ error: 'Failed to update Pallet' });
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
// 11. Print Pallet Label
export const printPalletLabel = async (req: Request, res: Response) => {
    try {
        const { palletId } = req.params;
        const { printerName } = req.body;
        const authUser = (req as any).user;

        if (!printerName) {
            return res.status(400).json({ error: 'Printer name is required' });
        }

        // Fetch full user for name
        const user = await prisma.user.findUnique({ where: { id: authUser.id } });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const pallet = await prisma.pallet.findUnique({
            where: { id: palletId },
            include: { items: true }
        });

        if (!pallet) return res.status(404).json({ error: 'Pallet not found' });

        const wo = await prisma.workOrder.findUnique({
            where: { id: pallet.workOrderId },
            include: {
                quote: {
                    include: {
                        project: true,
                        client: true,
                        items: true, // Need items for dimensions/weight
                        material: true
                    }
                }
            }
        });

        if (!wo) return res.status(404).json({ error: 'Work Order not found' });

        // Generate XML
        const xmlContent = await xmlService.generatePalletLabelXml({
            pallet,
            wo,
            printerName,
            user: user || { firstName: 'System', lastName: 'Admin' } // Fallback
        });

        // Save File
        // Save File
        // Filename Format: ClientName-BT-PalletNumber-Date (YYYY-MM-DD)
        const safe = (s: string) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_').toUpperCase();

        const clientName = safe(wo.quote.client?.name || 'CLIENT');
        const btRef = safe(wo.reference || 'WO');
        const palletNum = pallet.number;
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const filename = `${clientName}-${btRef}-${palletNum}-${dateStr}.rak`;

        // Strategy: Force Agent Pickup (Tunnel Mode)
        // We MUST write to 'pending_xml' so the Agent detects, processes, and UPLOADS the result back.
        // Direct write to 'echange' bypasses the Agent's return tracking.

        const pendingDir = path.join(process.cwd(), 'pending_xml');
        if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });

        // Final Path
        const finalPath = path.join(pendingDir, filename);

        // Remove Exchange direct write logic
        /* 
        const exchangeDir = '/Volumes/demo/echange';
        if (fs.existsSync(exchangeDir)) ...
        */

        console.log(`[PrintLabel] Queuing for Agent in: ${finalPath}`);
        fs.writeFileSync(finalPath, xmlContent);

        res.json({ message: 'Label sent to printer', path: finalPath, filename, clientName });

    } catch (error: any) {
        console.error('Error printing label:', error);
        res.status(500).json({ error: 'Failed to print label', details: error.message });
    }
};

// 12. Check Label Status (Poll for Return XML)
export const checkLabelStatus = async (req: Request, res: Response) => {
    try {
        const { filename } = req.query;
        if (!filename) return res.status(400).json({ error: 'Filename required' });

        // User Flow: Frontend knows 'CLIENT-BT-PAL.rak'.
        // Agent Process: 
        // 1. Sees RAK.
        // 2. Triggers Automate -> Automate creates Excel at F:\FP\CLIENT...
        // 3. Agent detects return XML using RAK name.
        // 4. Agent finds Excel at F:\FP\CLIENT... (using 'cible' path from RAK).
        // 5. Agent UPLOADS Excel to Backend 'processAgentBundle'.
        // 6. Backend saves Excel to 'uploads/CLIENT-BT-PAL.xlsx'.

        // So we check if 'CLIENT-BT-PAL.xlsx' exists in 'uploads'.
        const excelName = (filename as string).replace(/\.rak$/i, '.xlsx');
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const candidatePath = path.join(uploadsDir, excelName);

        if (fs.existsSync(candidatePath)) {
            // Also check if size is > 0 (upload complete)
            const stats = fs.statSync(candidatePath);
            if (stats.size > 0) return res.json({ ready: true });
        }

        res.json({ ready: false });

    } catch (error) {
        console.error('Error checking label status:', error);
        res.json({ ready: false });
    }
};

// 13. Download Label Excel (Serve from Local Uploads)
export const downloadLabelExcel = async (req: Request, res: Response) => {
    try {
        const { filename } = req.query;
        // filename here usually comes from frontend as the RAK filename? or constructed?
        // Let's handle both .rak and .xlsx inputs just in case.

        if (!filename) return res.status(400).json({ error: 'Missing params' });

        let excelName = (filename as string);
        if (excelName.toLowerCase().endsWith('.rak')) {
            excelName = excelName.replace(/\.rak$/i, '.xlsx');
        }

        const uploadsDir = path.join(process.cwd(), 'uploads');
        const filePath = path.join(uploadsDir, excelName);

        if (!fs.existsSync(filePath)) {
            console.error(`Excel file not found at: ${filePath}`);
            return res.status(404).json({ error: 'Fichier Excel introuvable (Attente de l\'Agent...)' });
        }

        res.download(filePath);

    } catch (error) {
        console.error('Error downloading label Excel:', error);
        res.status(500).json({ error: 'Download failed' });
    }
};
