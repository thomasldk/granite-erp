
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
    if (process.env.FORCE_RESET !== 'true') {
        console.error('❌ SAFETY CHECK FAILED: This script deletes all data.');
        console.error('To run this script, you must set the environment variable FORCE_RESET=true');
        console.error('Example: FORCE_RESET=true npx ts-node debug_reset_db.ts');
        process.exit(1);
    }
    console.log("Deleting all Quotes...");
    await prisma.quoteItem.deleteMany({});
    await prisma.quote.deleteMany({});

    console.log("Deleting all Projects...");
    await prisma.project.deleteMany({});

    console.log("Database cleared. Next project should be P25-0001.");
}

reset().catch(console.error).finally(() => prisma.$disconnect());
