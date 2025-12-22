
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const quotes = await prisma.quote.findMany({
        where: { reference: { startsWith: 'DRC25' } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { items: true, project: true }
    });

    console.log("Recent Quotes:");
    quotes.forEach(q => {
        console.log(`- Ref: ${q.reference}, ID: ${q.id}, Project Items: ${q.items.length}, Project Config Lines: ${q.project?.numberOfLines}`);
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
