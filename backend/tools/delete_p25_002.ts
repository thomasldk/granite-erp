
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for P25-002...');

    // Check Project
    const project = await prisma.project.findUnique({
        where: { reference: 'P25-002' },
        include: { quotes: true }
    });

    if (project) {
        console.log(`✅ Found Project: ${project.name} (ID: ${project.id})`);
        console.log(`   Location ID: ${project.locationId}`);
        console.log(`   Quotes linked: ${project.quotes.length}`);

        // Delete dependencies if necessary (Cascade is usually on, but let's be safe)
        // Check quotes
        for (const quote of project.quotes) {
            console.log(`   - Deleting Quote: ${quote.reference} (ID: ${quote.id})`);
            await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
            await prisma.quote.delete({ where: { id: quote.id } });
        }

        console.log(`🗑️ Deleting Project P25-002...`);
        await prisma.project.delete({
            where: { id: project.id }
        });
        console.log('🎉 Project P25-002 successfully deleted.');
        return;
    }

    // Check Quote (just in case)
    const quote = await prisma.quote.findUnique({
        where: { reference: 'P25-002' }
    });

    if (quote) {
        console.log(`✅ Found Quote with this reference: ${quote.reference}`);
        console.log(`🗑️ Deleting Quote P25-002...`);
        await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });
        await prisma.quote.delete({ where: { id: quote.id } });
        console.log('🎉 Quote P25-002 successfully deleted.');
        return;
    }

    console.log('❌ No Project or Quote found with reference P25-002.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
