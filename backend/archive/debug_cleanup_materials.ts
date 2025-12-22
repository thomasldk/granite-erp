
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupMaterials() {
    try {
        console.log("🧹 Cleaning up unwanted materials...");

        // 1. Delete robot marker
        const robot = await prisma.material.deleteMany({
            where: {
                name: {
                    startsWith: 'ROBOT_VERIFICATION_CHECK'
                }
            }
        });
        console.log(`✅ Deleted ${robot.count} 'ROBOT...' records.`);

        // 2. Delete Quartz Blanc Pur
        const quartz = await prisma.material.deleteMany({
            where: {
                name: 'Quartz Blanc Pur'
            }
        });
        console.log(`✅ Deleted ${quartz.count} 'Quartz Blanc Pur' records.`);

        // 3. Delete Marbre Carrara (often seeded too)
        const marble = await prisma.material.deleteMany({
            where: {
                name: 'Marbre Carrara'
            }
        });
        console.log(`✅ Deleted ${marble.count} 'Marbre Carrara' records.`);

    } catch (e) {
        console.error("Error during cleanup:", e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupMaterials();
