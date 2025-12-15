import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuoteStatus() {
    try {
        console.log('--- Quote Status Check ---');
        const quote = await prisma.quote.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { project: true }
        });
        if (quote) {
            console.log(`Reference: ${quote.reference}`);
            console.log(`Status: ${quote.status}`);
            console.log(`SyncStatus: ${quote.syncStatus}`);
            console.log(`ID: ${quote.id}`);
        } else {
            console.log('No quotes found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuoteStatus();
