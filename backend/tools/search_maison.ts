
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for "Maison"...');

    // 1. Search Locations
    const locations = await prisma.projectLocation.findMany({
        where: {
            name: { contains: 'Maison', mode: 'insensitive' }
        },
        include: { projects: true }
    });

    console.log(`\n📍 Found ${locations.length} Locations matching "Maison":`);
    locations.forEach(l => {
        console.log(`   - Location: ${l.name}`);
        l.projects.forEach(p => console.log(`       -> Linked Project: [${p.reference}] ${p.name} (ID: ${p.id})`));
    });

    // 2. Search Quotes with Project Name or Reference
    const quotes = await prisma.quote.findMany({
        where: {
            OR: [
                { reference: { contains: 'P25-002' } },
                { reference: { contains: 'P25' } }
            ]
        },
        include: { project: true }
    });
    console.log(`\n📄 Quotes checking for P25-002/P25...`);
    quotes.forEach(q => {
        if (q.reference.includes('002') || q.project.name.toLowerCase().includes('maison')) {
            console.log(`   MATCH: [${q.reference}] Project: ${q.project.name} (ID: ${q.id})`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
