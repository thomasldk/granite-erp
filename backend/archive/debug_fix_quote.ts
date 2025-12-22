
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const QUOTE_ID = '9659d5e3-38a5-4110-bc2d-6c785c65b796';

async function fixQuote() {
    try {
        console.log(`Checking Quote: ${QUOTE_ID}`);
        const quote = await prisma.quote.findUnique({
            where: { id: QUOTE_ID }
        });

        if (!quote) {
            console.error('Quote not found!');
            return;
        }

        console.log('--- CURRENT STATE ---');
        console.log(`Reference: ${quote.reference}`);
        console.log(`Status: ${quote.status}`);
        console.log(`SyncStatus: ${quote.syncStatus}`); // Likely PENDING_AGENT

        // FORCE RESET
        console.log('\n--- RESETTING TO PENDING_REVISION ---');
        const updated = await prisma.quote.update({
            where: { id: QUOTE_ID },
            data: {
                syncStatus: 'PENDING' // R0 is a CREATE, not a REVISION
            }
        });

        console.log(`New SyncStatus: ${updated.syncStatus}`);
        console.log('Quote is now ready for Agent pickup.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

fixQuote();
