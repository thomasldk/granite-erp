
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastQuote() {
    try {
        const quotes = await prisma.quote.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { items: true }
        });

        if (quotes.length > 0) {
            quotes.forEach(lastQuote => {
                console.log('--- QUOTE ---');
                console.log(`ID: ${lastQuote.id}`);
                console.log(`Ref: ${lastQuote.reference}`);
                console.log(`Created: ${lastQuote.createdAt}`);
                console.log(`Items: ${lastQuote.items.length}`);
                if (lastQuote.items.length > 0) {
                    console.log(`Sample Mat: ${lastQuote.items[0].material}`);
                }
            });
            return;
        }


    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastQuote();
