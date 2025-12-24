import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // 1. Soumissions en cours (Active Quotes)
        // We consider 'Draft', 'Sent', 'Open' as active.
        const activeQuotesCount = await prisma.quote.count({
            where: {
                status: {
                    in: ['Draft', 'Sent', 'Open']
                }
            }
        });

        // 2. Clients Actifs
        const activeClientsCount = await prisma.thirdParty.count({
            where: {
                type: 'Client'
            }
        });

        // 3. Commandes à livrer (Open WorkOrders)
        const openWorkOrdersCount = await prisma.workOrder.count({
            where: {
                status: {
                    notIn: ['Completed', 'Cancelled']
                }
            }
        });

        res.json({
            activeQuotes: activeQuotesCount,
            activeClients: activeClientsCount,
            openWorkOrders: openWorkOrdersCount
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
