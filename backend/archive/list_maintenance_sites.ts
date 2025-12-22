import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listMaintenanceSites() {
    try {
        console.log('--- Maintenance Sites ---');
        const sites = await prisma.maintenanceSite.findMany();
        console.table(sites);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listMaintenanceSites();
