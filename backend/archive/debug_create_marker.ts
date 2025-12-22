
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMarker() {
    try {
        console.log("📍 Creating Verification Marker...");

        await prisma.material.create({
            data: {
                name: "ROBOT_VERIFICATION_CHECK_" + new Date().toISOString(),
                category: "Debug",
                type: "Granite",
                purchasePrice: 9999
            }
        });

        console.log("✅ Marker Created in database connected to:");
        console.log(process.env.DATABASE_URL?.split('@')[1]); // Show host only

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

createMarker();
