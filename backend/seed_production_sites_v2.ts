
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sites = ["Production RAP", "Production STD"]; // Updated to STD

    for (const name of sites) {
        const exists = await prisma.productionSite.findUnique({
            where: { name }
        });

        if (!exists) {
            await prisma.productionSite.create({
                data: { name }
            });
            console.log(`Created Production Site: ${name}`);
        } else {
            console.log(`Production Site already exists: ${name}`);
        }
    }

    // Optional: Delete "Production Stanstead" if it was a mistake? 
    // Or keep it. User might have meant rename. 
    // I will leave it for now to avoid data loss if used, but user said "create... RAP and STD".
    // I'll check if Stanstead exists and maybe rename it to STD if strictly required, 
    // but just creating STD ensures it's available.
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
