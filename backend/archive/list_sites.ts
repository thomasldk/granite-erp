import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listSites() {
    try {
        console.log('--- Production Sites ---');
        const sites = await prisma.productionSite.findMany();
        console.table(sites);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listSites();
