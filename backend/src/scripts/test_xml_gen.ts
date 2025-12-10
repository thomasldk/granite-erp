import { PrismaClient } from '@prisma/client';
import { XmlService } from '../services/xmlService';

const prisma = new PrismaClient();
const xmlService = new XmlService();

async function test() {
    const quote = await prisma.quote.findFirst({
        include: {
            items: true,
            project: true,
            client: { include: { addresses: true, contacts: true } }
        }
    });

    if (!quote) {
        console.log("No quote found");
        return;
    }

    console.log("Testing XML Gen for Quote:", quote.reference);
    const xml = xmlService.generateQuoteXml(quote);
    console.log(xml);
}

test().catch(console.error).finally(() => prisma.$disconnect());
