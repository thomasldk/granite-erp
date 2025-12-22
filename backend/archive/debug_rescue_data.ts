
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking DB Connection...");
        console.log("URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");

        const materials = await prisma.material.count();
        const quotes = await prisma.quote.count();
        const clients = await prisma.thirdParty.count();

        console.log("Materials:", materials);
        console.log("Quotes:", quotes);
        console.log("Clients:", clients);

        if (materials === 0 && quotes === 0) {
            console.log("⚠️ DB SEEMS EMPTY!");
        } else {
            console.log("✅ Data exists.");
        }

    } catch (e) {
        console.error("Connection Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
