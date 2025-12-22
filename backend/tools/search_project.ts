
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for projects/quotes containing "P25" or "002"...');

    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { reference: { contains: 'P25' } },
                { reference: { contains: '002' } },
                { name: { contains: 'Maison' } } // User mentioned "Maison"
            ]
        }
    });

    console.log(`\n📋 Found ${projects.length} Projects:`);
    projects.forEach(p => console.log(`   - [${p.reference}] ${p.name} (ID: ${p.id})`));

    const quotes = await prisma.quote.findMany({
        where: {
            OR: [
                { reference: { contains: 'P25' } },
                { reference: { contains: '002' } }
            ]
        }
    });

    console.log(`\n📄 Found ${quotes.length} Quotes:`);
    quotes.forEach(q => console.log(`   - [${q.reference}] (Project ID: ${q.projectId})`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
