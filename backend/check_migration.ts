
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const clients = await prisma.thirdParty.count({ where: { type: 'Client' } });
        const suppliers = await prisma.thirdParty.count({ where: { type: 'Supplier' } });
        const projects = await prisma.project.count();
        const locations = await prisma.projectLocation.count();
        const quotes = await prisma.quote.count();
        const items = await prisma.quoteItem.count();
        const settings = await prisma.systemConfig.count();
        const incoterms = await prisma.incoterm.count();
        const paymentTerms = await prisma.paymentTerm.count();
        const prodSites = await prisma.productionSite.count();
        const maintSites = await prisma.maintenanceSite.count();
        const reps = await prisma.representative.count();

        console.log('--- Migration Verification ---');
        console.log(`Clients: ${clients}`);
        console.log(`Suppliers: ${suppliers}`);
        console.log(`Projects: ${projects}`);
        console.log(`Project Locations: ${locations}`);
        console.log(`Quotes: ${quotes}`);
        console.log(`Quote Items: ${items}`);
        console.log(`System Configs: ${settings}`);
        console.log(`Incoterms: ${incoterms}`);
        console.log(`PaymentTerms: ${paymentTerms}`);
        console.log(`Production Sites: ${prodSites}`);
        console.log(`Maintenance Sites: ${maintSites}`);
        console.log(`Representatives: ${reps}`);


        if (quotes === 0 && items === 0) {
            console.error('WARNING: Zero quotes found. Something went wrong.');
        } else {
            console.log('SUCCESS: Data detected.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
