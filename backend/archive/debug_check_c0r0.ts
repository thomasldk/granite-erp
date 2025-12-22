
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificQuote() {
    try {
        const ref = 'DRC25-0001-C0R0'; // The one claimed as Source
        const quote = await prisma.quote.findUnique({
            where: { reference: ref }
        });

        if (quote) {
            console.log('--- SOURCE QUOTE STATUS ---');
            console.log(`ID: ${quote.id}`);
            console.log(`Ref: ${quote.reference}`);
            console.log(`SyncStatus: ${quote.syncStatus}`);
            console.log(`Status: ${quote.status}`);
            console.log(`ExcelPath: ${quote.excelFilePath}`);
        } else {
            console.log(`Quote ${ref} not found.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificQuote();
