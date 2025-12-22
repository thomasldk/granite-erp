
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("Checking DB for Projects...");
    const projects = await prisma.project.findMany({
        include: { quotes: true }
    });

    console.log(`Found ${projects.length} projects.`);
    projects.forEach(p => {
        console.log(`- [${p.id}] ${p.name} (Ref: ${p.reference})`);
        p.quotes.forEach(q => console.log(`  > Quote: ${q.reference} (ID: ${q.id})`));
    });
}

check().catch(console.error).finally(() => prisma.$disconnect());
