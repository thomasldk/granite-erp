import { PrismaClient } from '@prisma/client';
import { XmlService } from './src/services/xmlService';

const prisma = new PrismaClient();
const xmlService = new XmlService();

async function simulate() {
    // 1. Get the most recent quote
    const quote = await prisma.quote.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: {
            items: true,
            project: true,
            material: true,
            contact: true,
            paymentTerm: true,
            representative: true,
            incotermRef: true,
            client: { include: { addresses: true, contacts: true, paymentTerm: true } }
        }
    });

    if (!quote) {
        console.log("No quotes found.");
        return;
    }

    console.log(`Simulating RAK for Quote: ${quote.reference} (Status: ${quote.status})`);

    // 2. Generate XML
    try {
        // Find Rep (logic borrowed from controller/service)
        let rep = quote.representative;
        if (!rep && quote.client?.repName) {
            const allReps = await prisma.representative.findMany();
            rep = allReps.find(r => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === quote.client?.repName?.trim().toLowerCase()) || null;
        }

        // const xml = await xmlService.generateQuoteXml(quote, rep);
        const xml = await xmlService.generatePdfRak(quote);
        console.log("\n--- GENERATED RAK XML (PDF MODE) ---\n");
        console.log(xml);
        console.log("\n-------------------------\n");
    } catch (e) {
        console.error("Error generating XML:", e);
    }
}

simulate()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
