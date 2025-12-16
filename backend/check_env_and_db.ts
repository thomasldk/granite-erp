import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNOSTIC START ---');
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

    try {
        console.log('Attempting to count EquipmentCategory...');
        const count = await prisma.equipmentCategory.count();
        console.log(`SUCCESS: Found ${count} categories.`);
    } catch (error: any) {
        console.error('FAILURE: Could not count categories.');
        console.error('Error code:', error.code);
        console.error('Message:', error.message);
    }

    try {
        console.log('Attempting to check QuoteItem columns...');
        const item = await prisma.quoteItem.findFirst();
        if (item) {
            console.log('Found an item:', item);
        } else {
            console.log('No quote items found.');
        }
    } catch (error) {
        console.error('FAILURE: Could not query QuoteItem', error);
    }

    console.log('--- DIAGNOSTIC END ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
