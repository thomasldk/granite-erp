import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPaymentTerms() {
    try {
        console.log('Connecting to DB...');
        const count = await prisma.paymentTerm.count();
        console.log(`Total PaymentTerms: ${count}`);

        const terms = await prisma.paymentTerm.findMany();
        console.table(terms);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkPaymentTerms();
