
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Comprehensive Search for "P25-002" or similar...');

    // 1. Projects
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { reference: { contains: 'P25' } },
                { reference: { contains: '002' } },
                { name: { contains: 'Maison' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(`\n🏗️ Projects (Top 10 matches):`);
    projects.forEach(p => console.log(`   - [${p.reference}] ${p.name} (ID: ${p.id})`));

    // 2. Quotes
    const quotes = await prisma.quote.findMany({
        where: {
            OR: [
                { reference: { contains: 'P25' } },
                { reference: { contains: '002' } },
                { project: { name: { contains: 'Maison' } } }
            ]
        },
        include: { project: true },
        orderBy: { createdAt: 'desc' },
        take: 10
    });
    console.log(`\n📄 Quotes (Top 10 matches):`);
    quotes.forEach(q => console.log(`   - [${q.reference}] (Project: ${q.project.name}) (ID: ${q.id})`));

    // 3. WorkOrders
    try {
        const workOrders = await prisma.workOrder.findMany({
            where: {
                reference: { contains: '002' }
            },
            take: 10
        });
        console.log(`\n🔨 WorkOrders (Top 10 containing '002'):`);
        workOrders.forEach(w => console.log(`   - [${w.reference}] (ID: ${w.id})`));
    } catch (e) {
        console.log('\n⚠️ Could not query WorkOrder directly (check schema).');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
