import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSuppliers() {
    try {
        console.log('--- Suppliers ---');
        const suppliers = await prisma.thirdParty.findMany({
            where: { type: 'Supplier' },
            select: { id: true, name: true, supplierType: true }
        });
        console.table(suppliers);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuppliers();
