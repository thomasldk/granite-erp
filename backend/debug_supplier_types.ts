
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- Checking Supplier Types ---");
        // We suspect supplier types are just strings stored in 'supplierType' column, 
        // or maybe distinct ThirdParty records. 
        // Let's check distinct values of supplierType in ThirdParty
        const types = await prisma.thirdParty.groupBy({
            by: ['supplierType'],
            _count: { supplierType: true }
        });
        console.table(types);

        // Also check ContactTypes just in case
        const contactTypes = await prisma.contactType.findMany();
        console.log("\n--- Contact Types ---");
        console.table(contactTypes);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
