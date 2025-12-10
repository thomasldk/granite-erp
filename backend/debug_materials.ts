
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.material.count();
        console.log(`Total Materials: ${count}`);

        const materials = await prisma.material.findMany({
            take: 5
        });
        console.log('First 5 materials:', JSON.stringify(materials, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
