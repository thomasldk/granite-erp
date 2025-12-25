import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPallets() {
    try {
        const pallets = await prisma.pallet.findMany({
            select: { id: true, number: true, status: true, workOrder: { select: { reference: true } } }
        });
        console.log("Existing Pallets:");
        console.table(pallets);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPallets();
