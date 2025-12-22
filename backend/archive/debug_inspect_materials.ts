
import prisma from './src/prisma';

async function inspectMaterials() {
    const materials = await prisma.material.findMany();
    console.log(JSON.stringify(materials, null, 2));
    await prisma.$disconnect();
}

inspectMaterials();
