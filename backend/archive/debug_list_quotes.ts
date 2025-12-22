
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listQuotes() {
    try {
        console.log('--- QUOTE LIST ---');
        const quotes = await prisma.quote.findMany({
            select: {
                id: true,
                reference: true,
                status: true,
                syncStatus: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        if (quotes.length === 0) {
            console.log("No quotes found.");
        }

        quotes.forEach(q => {
            console.log(`[${q.reference}] Status: ${q.status} | Sync: ${q.syncStatus} | ID: ${q.id}`);
        });
        console.log('------------------');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listQuotes();
