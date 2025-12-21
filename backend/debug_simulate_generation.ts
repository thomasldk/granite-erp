
import { PrismaClient } from '@prisma/client';
import { XmlService } from './src/services/xmlService';

const prisma = new PrismaClient();
const xmlService = new XmlService();

async function debugGeneration() {
    try {
        console.log("🔍 Finding latest quote...");
        const quote = await prisma.quote.findFirst({
            orderBy: { updatedAt: 'desc' },
            include: {
                items: true,
                project: true,
                material: true,
                contact: true,
                paymentTerm: true,
                representative: true,
                client: {
                    include: {
                        addresses: true,
                        contacts: true,
                        paymentTerm: true
                    }
                },
                incotermRef: true
            }
        });

        if (!quote) {
            console.error("❌ No quote found in DB.");
            return;
        }

        console.log(`✅ Found Quote: ${quote.reference} (ID: ${quote.id})`);
        console.log(`   Client: ${quote.client?.name}`);
        console.log(`   Material: ${quote.material?.name}`);
        console.log(`   Project: ${quote.project?.name}`);

        console.log("🚀 Attempting to generate XML...");

        // Mock Rep if missing
        const rep = quote.representative || { firstName: 'Admin', lastName: 'System', phone: '555-5555' };

        const xml = await xmlService.generateQuoteXml(quote, rep);

        console.log("✅ XML Generation SUCCESS!");
        console.log("--- XML PREVIEW (First 200 chars) ---");
        console.log(xml.substring(0, 200));
        console.log("-------------------------------------");

    } catch (error: any) {
        console.error("❌ GENERATION FAILED:");
        console.error(error);
        if (error.stack) console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

debugGeneration();
