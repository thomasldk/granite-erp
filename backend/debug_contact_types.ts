import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkContactTypes() {
    try {
        console.log('--- Contact Types ---');
        const types = await prisma.contactType.findMany();
        console.table(types);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkContactTypes();
