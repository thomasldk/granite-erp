
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeMaterials() {
    try {
        const materials = await prisma.material.findMany({
            include: {
                _count: {
                    select: { quotes: true }
                }
            }
        });

        console.log("--- MATERIAL ANALYSIS ---");
        console.log(`Total Materials: ${materials.length}`);

        const groups: { [key: string]: any[] } = {};

        materials.forEach(m => {
            if (!groups[m.name]) groups[m.name] = [];
            groups[m.name].push(m);
        });

        Object.keys(groups).forEach(name => {
            const list = groups[name];
            if (list.length > 1) {
                console.log(`\n⚠️  DUPLICATE: "${name}" (${list.length} copies)`);
                list.forEach(m => {
                    console.log(`   - ID: ${m.id} | Price: ${m.purchasePrice} | Used in ${m._count.quotes} quotes`);
                });
            } else {
                console.log(`\n✅ UNIQUE: "${name}"`);
            }
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeMaterials();
