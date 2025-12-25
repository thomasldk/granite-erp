import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get Ready Pallets
export const getReadyPallets = async (req: Request, res: Response) => {
    try {
        const pallets = await prisma.pallet.findMany({
            where: {
                status: 'Validé', // Matched DB value
            },
            include: {
                workOrder: {
                    include: {
                        quote: {
                            include: {
                                client: true,
                                project: true
                            }
                        }
                    }
                },
                items: {
                    include: {
                        quoteItem: true
                    }
                }
            }
        });

        // Group by Client -> Project if needed by Frontend, or just return flat list
        // Returning flat list for flexibility
        res.json(pallets);
    } catch (error) {
        console.error("Error fetching ready pallets:", error);
        res.status(500).json({ error: "Failed to fetch status" });
    }
};

// Create Delivery Note
export const createDeliveryNote = async (req: Request, res: Response) => {
    try {
        const { clientId, date, carrier, address, palletIds } = req.body;

        if (!clientId || !palletIds || palletIds.length === 0) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Generate Reference (BL-YY-XXXX)
        const year = new Date().getFullYear().toString().slice(-2);
        const count = await prisma.deliveryNote.count();
        const reference = `BL${year}-${(count + 1).toString().padStart(4, '0')}`;

        // Calculate Total Weight
        // We need to fetch pallets to sum weights
        const pallets = await prisma.pallet.findMany({
            where: { id: { in: palletIds } },
            include: { items: { include: { quoteItem: true } } }
        });

        let totalWeight = 0;
        pallets.forEach(p => {
            p.items.forEach(pi => {
                totalWeight += (pi.quoteItem.totalWeight || 0); // Logic might need adjustment if quantity is partial
            });
        });

        // Transaction: Create Note, Create Items, Update Pallets
        const result = await prisma.$transaction(async (tx) => {
            // Create Note
            const note = await tx.deliveryNote.create({
                data: {
                    reference,
                    clientId,
                    date: new Date(date),
                    carrier,
                    deliveryAddress: address,
                    status: 'Shipped', // Assuming immediate shipment for now
                    totalWeight
                }
            });

            // Create Items & Update Pallets
            for (const palletId of palletIds) {
                await tx.deliveryNoteItem.create({
                    data: {
                        deliveryNoteId: note.id,
                        palletId
                    }
                });

                await tx.pallet.update({
                    where: { id: palletId },
                    data: { status: 'Shipped' }
                });
            }

            return note;
        });

        res.json(result);

    } catch (error) {
        console.error("Error creating delivery note:", error);
        res.status(500).json({ error: "Failed to create delivery note" });
    }
};

// Get Delivery Notes List
export const getDeliveryNotes = async (req: Request, res: Response) => {
    try {
        const notes = await prisma.deliveryNote.findMany({
            include: {
                client: true,
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch delivery notes" });
    }
};

// Get Delivery Note Detail
export const getDeliveryNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: {
                client: true,
                items: {
                    include: {
                        pallet: {
                            include: {
                                workOrder: { include: { quote: { include: { project: true } } } },
                                items: { include: { quoteItem: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!note) return res.status(404).json({ error: "Note not found" });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch note" });
    }
};
