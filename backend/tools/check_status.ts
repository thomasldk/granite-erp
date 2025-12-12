
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStatus() {
    try {
        const latestQuote = await prisma.quote.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: { project: true }
        });

        if (latestQuote) {
            console.log(`Latest Quote: ${latestQuote.reference}`);
            console.log(`Status: ${latestQuote.status}`);
            console.log(`SyncStatus: ${latestQuote.syncStatus}`);
            console.log(`Items: ${await prisma.quoteItem.count({ where: { quoteId: latestQuote.id } })}`);
        } else {
            console.log("No quotes found.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStatus();
