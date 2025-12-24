
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
    try {
        const clientCount = await prisma.thirdParty.count();
        const woCount = await prisma.workOrder.count();
        const quoteCount = await prisma.quote.count();
        const projectCount = await prisma.project.count();

        console.log('--- DB COUNTS ---');
        console.log(`Clients: ${clientCount}`);
        console.log(`WorkOrders: ${woCount}`);
        console.log(`Quotes: ${quoteCount}`);
        console.log(`Projects: ${projectCount}`);
    } catch (e) {
        console.error('Error connecting to DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
