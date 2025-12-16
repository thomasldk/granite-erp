
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔹 Adding missing Incoterms...');

    // FOB
    const existingFOB = await prisma.incoterm.findFirst({ where: { name: 'FOB' } });
    if (!existingFOB) {
        await prisma.incoterm.create({
            data: {
                name: 'FOB',
                xmlCode: 'FOB',
                requiresText: false
            }
        });
        console.log('✅ FOB added.');
    } else {
        console.log('ℹ️ FOB already exists.');
    }

    // Saisie manuelle
    const existingManual = await prisma.incoterm.findFirst({ where: { name: 'Saisie manuelle' } });
    if (!existingManual) {
        await prisma.incoterm.create({
            data: {
                name: 'Saisie manuelle',
                xmlCode: 'MANUAL',
                requiresText: true
            }
        });
        console.log('✅ Saisie manuelle added.');
    } else {
        console.log('ℹ️ Saisie manuelle already exists.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
