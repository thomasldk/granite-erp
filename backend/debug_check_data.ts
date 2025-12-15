import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking database content...');

    // Check Materials
    const materials = await prisma.material.findMany();
    console.log(`Materials count: ${materials.length}`);
    if (materials.length > 0) {
        console.log('Sample Material:', materials[0].name);
    }

    // Check Clients
    const clients = await prisma.thirdParty.findMany({ where: { type: 'Client' } });
    console.log(`Clients count: ${clients.length}`);
    if (clients.length > 0) {
        console.log('Sample Client:', clients[0].name);
    }

    // Check Currencies
    const currencies = await prisma.currency.findMany();
    console.log(`Currencies count: ${currencies.length}`);

    // Check Equipments
    const equipments = await prisma.equipment.findMany();
    console.log(`Equipments count: ${equipments.length}`);
    if (equipments.length > 0) console.log('Sample Equipment:', equipments[0].name);

    // Check Production Sites
    const sites = await prisma.productionSite.findMany();
    console.log(`Production Sites count: ${sites.length}`);
    if (sites.length > 0) console.log('Sample Site:', sites[0].name);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
