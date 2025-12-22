
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sites = ["Production RAP", "Production Stanstead"];

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
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
