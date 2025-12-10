
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reset() {
    console.log("Deleting all Quotes...");
    await prisma.quoteItem.deleteMany({});
    await prisma.quote.deleteMany({});

    console.log("Deleting all Projects...");
    await prisma.project.deleteMany({});

    console.log("Database cleared. Next project should be P25-0001.");
}

reset().catch(console.error).finally(() => prisma.$disconnect());
