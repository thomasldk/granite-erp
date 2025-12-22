
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLatestQuote() {
    try {
        const quote = await prisma.quote.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { items: true, client: true, project: true }
        });

        if (!quote) {
            console.log("No quotes found.");
            return;
        }

        console.log("--- LATEST QUOTE ---");
        console.log(`ID: ${quote.id}`);
        console.log(`Reference: "${quote.reference}"`); // Added quotes to see spaces
        console.log(`ExcelPath: ${quote.excelFilePath}`);
        console.log(`Status: ${quote.status}`);
        console.log(`SyncStatus: ${quote.syncStatus}`);
        console.log(`Total Amount: ${quote.totalAmount}`);
        console.log(`Items Count: ${quote.items.length}`);

        if (quote.items.length > 0) {
            console.log("--- FIRST ITEM SAMPLE ---");
            console.log(quote.items[0]);
        } else {
            console.log("⚠️ NO ITEMS FOUND (Data Loss Detected)");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLatestQuote();
