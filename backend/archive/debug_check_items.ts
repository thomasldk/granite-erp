
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    // Quote ID from previous context
    const id = 'b1426d5c-b776-42fb-85fb-c6e94ff730e1';

    const quote = await prisma.quote.findUnique({
        where: { id },
        include: { items: true }
    });

    if (!quote) {
        console.log("Quote not found!");
        return;
    }

    console.log(`Quote: ${quote.reference}`);
    console.log(`Total Amount: ${quote.totalAmount}`);
    console.log(`Item Count: ${quote.items.length}`);
    quote.items.forEach(i => console.log(` - ${i.description}: ${i.totalPrice}`));
}

check().catch(console.error).finally(() => prisma.$disconnect());
