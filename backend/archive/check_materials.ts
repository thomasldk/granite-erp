
import prisma from './src/prisma';

async function checkMaterials() {
    const count = await prisma.material.count();
    console.log(`Materials in DB: ${count}`);
    const samples = await prisma.material.findMany({ take: 3 });
    console.log(samples);
}

checkMaterials()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
