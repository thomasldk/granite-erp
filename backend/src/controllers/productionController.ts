
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getProductionItems = async (req: Request, res: Response) => {
    try {
        const items = await prisma.quoteItem.findMany({
            where: {
                quote: {
                    status: 'Accepted' // Filter for accepted status
                }
            },
            include: {
                quote: {
                    include: {
                        project: true,
                        client: true,
                    }
                },
                productionSite: true // Include site info
            },
            orderBy: {
                quote: {
                    reference: 'asc'
                }
            }
        });

        const productionItems = items.map(item => {
            // "Calculations" are now just reading stored values
            // Formatting to 2 decimals for display consistency

            return {
                id: item.id,
                quoteRef: item.quote.reference,
                clientName: item.quote.client?.name || 'Unknown',
                site: item.productionSite?.name || 'Unassigned', // Return site name
                tag: item.tag || '',
                granite: item.material,
                qty: item.quantity,
                item: 'Item', // Static or type?
                length: item.length || 0,
                width: item.width || 0,
                thickness: item.thickness || 0,
                description: item.description,
                netLength: item.netLength?.toFixed(2) || '0.00',
                netArea: item.netArea?.toFixed(2) || '0.00',
                netVolume: item.netVolume?.toFixed(2) || '0.00',
                totalWeight: item.totalWeight?.toFixed(2) || '0.00',
                unitPriceCad: item.unitPriceCad?.toFixed(2) || '0.00',
                unitPriceUsd: item.unitPriceUsd?.toFixed(2) || '0.00',
                totalCad: item.totalPriceCad?.toFixed(2) || '0.00',
                totalUsd: item.totalPriceUsd?.toFixed(2) || '0.00',
                unit: item.unit
            };
        });

        res.json(productionItems);
    } catch (error) {
        console.error("Production Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch production items' });
    }
};
