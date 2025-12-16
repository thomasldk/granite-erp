import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkItems() {
    try {
        console.log('--- Checking Last Quote Items ---');
        const quote = await prisma.quote.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });

        if (quote) {
            console.log(`Quote: ${quote.reference}`);
            // console.log(`Total Price: ${quote.totalPrice}`);
            console.log(`Items Found: ${quote.items.length}`);
            if (quote.items.length > 0) {
                console.table(quote.items.map(i => ({
                    tag: i.tag,
                    desc: i.description,
                    qty: i.quantity,
                    price: i.unitPrice,
                    total: i.totalPrice
                })));
            } else {
                console.log('NO ITEMS FOUND. Parsing Likely Failed.');
            }
        } else {
            console.log('No quotes found.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkItems();
