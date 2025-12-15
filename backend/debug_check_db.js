const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking DB...');
    try {
        const eqs = await prisma.equipment.count();
        console.log('Equipments Count:', eqs);

        const sites = await prisma.productionSite.count();
        console.log('ProductionSites Count:', sites);

        if (eqs === 0) console.log('WARNING: No equipments found.');
        if (sites === 0) console.log('WARNING: No production sites found.');

        if (eqs > 0) {
            const sampleEq = await prisma.equipment.findFirst();
            console.log('Sample Equipment:', sampleEq);
        }
        if (sites > 0) {
            const sampleSite = await prisma.productionSite.findFirst();
            console.log('Sample Site:', sampleSite);
        }

    } catch (e) {
        console.error(e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
