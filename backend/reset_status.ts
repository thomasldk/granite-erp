import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetStatus() {
    try {
        console.log('--- Resetting AGENT_PICKED to PENDING_AGENT ---');
        const result = await prisma.quote.updateMany({
            where: { syncStatus: 'AGENT_PICKED' },
            data: { syncStatus: 'PENDING_AGENT' }
        });
        console.log(`Reset ${result.count} quotes.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetStatus();
