
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching Incoterms...');
    const incoterms = await prisma.incoterm.findMany();
    console.log('Current Incoterms:', incoterms);

    // Update Ex-Work -> 1
    const exWork = incoterms.find(i => i.name.toLowerCase().includes('ex-work') || i.name.toLowerCase().includes('ex work'));
    if (exWork) {
        await prisma.incoterm.update({
            where: { id: exWork.id },
            data: { xmlCode: '1' }
        });
        console.log('Updated Ex-Work to 1');
    } else {
        console.log('Ex-Work not found, creating...');
        await prisma.incoterm.create({
            data: { name: 'Ex-Work', xmlCode: '1', requiresText: false }
        });
    }

    // Update FOB -> 2
    const fob = incoterms.find(i => i.name.toLowerCase().includes('fob'));
    if (fob) {
        await prisma.incoterm.update({
            where: { id: fob.id },
            data: { xmlCode: '2' }
        });
        console.log('Updated FOB to 2');
    } else {
        console.log('FOB not found, creating...');
        await prisma.incoterm.create({
            data: { name: 'FOB', xmlCode: '2', requiresText: false }
        });
    }

    // Update Saisie -> 3
    const saisie = incoterms.find(i => i.name.toLowerCase().includes('saisie') || i.name.toLowerCase().includes('manuel'));
    if (saisie) {
        await prisma.incoterm.update({
            where: { id: saisie.id },
            data: { xmlCode: '3', requiresText: true }
        });
        console.log('Updated Saisie to 3');
    } else {
        console.log('Saisie not found, creating...');
        await prisma.incoterm.create({
            data: { name: 'Saisie', xmlCode: '3', requiresText: true }
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
