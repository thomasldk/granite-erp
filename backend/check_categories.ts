import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.equipmentCategory.findMany();
    console.log(`Found ${categories.length} categories.`);
    console.log(categories.slice(0, 5)); // Show first 5
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
