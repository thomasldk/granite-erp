import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.equipmentCategory.count();
    const parts = await prisma.part.count();
    const equipments = await prisma.equipment.count();

    console.log(`Equipment Categories: ${categories}`);
    console.log(`Parts: ${parts}`);
    console.log(`Equipments: ${equipments}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
