
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetStatus() {
    try {
        const lastQuote = await prisma.quote.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (lastQuote) {
            console.log(`Last Quote: ${lastQuote.reference}, Status: [${lastQuote.syncStatus}]`);
            if (lastQuote.syncStatus === 'AGENT_PICKED' || lastQuote.syncStatus === 'Calculated (Agent)') {
                console.log('Resetting to PENDING_AGENT...');
                await prisma.quote.update({
                    where: { id: lastQuote.id },
                    data: { syncStatus: 'PENDING_AGENT' }
                });
                console.log('✅ Status Reset.');
            } else {
                console.log('Status does not need reset (e.g. already PENDING or ERROR).');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetStatus();
