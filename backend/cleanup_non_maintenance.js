const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting cleanup of non-maintenance data...');

    // Delete dependent tables first (Child -> Parent)

    try {
        // Quotes & Projects
        await prisma.quoteItem.deleteMany();
        console.log('Deleted QuoteItems');
        await prisma.quote.deleteMany();
        console.log('Deleted Quotes');
        await prisma.project.deleteMany();
        console.log('Deleted Projects');
        await prisma.projectLocation.deleteMany();
        console.log('Deleted ProjectLocations');

        // Materials
        await prisma.material.deleteMany();
        console.log('Deleted Materials');

        // ThirdParties & Contacts
        await prisma.contact.deleteMany();
        console.log('Deleted Contacts');
        await prisma.address.deleteMany();
        console.log('Deleted Addresses');

        await prisma.thirdParty.deleteMany();
        console.log('Deleted ThirdParties');

        // Auxiliaries
        await prisma.representative.deleteMany();
        console.log('Deleted Representatives');
        await prisma.productionSite.deleteMany();
        console.log('Deleted ProductionSites');
        await prisma.incoterm.deleteMany();
        console.log('Deleted Incoterms');
        await prisma.paymentTerm.deleteMany();
        console.log('Deleted PaymentTerms');
        await prisma.contactType.deleteMany();
        console.log('Deleted ContactTypes');

        console.log('✅ Cleanup complete. Only Maintenance data (Equipment, Parts, Repairs) remains.');
    } catch (e) {
        console.error('Error during cleanup:', e);
        throw e;
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
