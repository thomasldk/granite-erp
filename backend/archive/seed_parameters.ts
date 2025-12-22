
import prisma from './src/prisma';

async function seedParameters() {
    console.log("🌱 Seeding Missing Parameters...");

    // 1. Languages
    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' }
    ];
    for (const lang of languages) {
        await prisma.language.upsert({
            where: { code: lang.code },
            update: {},
            create: lang
        });
    }
    console.log(`✅ Languages: ${languages.length} ensured.`);

    // 2. Currencies
    const currencies = [
        { code: 'CAD', name: 'Cad', symbol: '$' },
        { code: 'USD', name: 'Usd', symbol: 'US$' },
        { code: 'EUR', name: 'Euro', symbol: '€' }
    ];
    for (const curr of currencies) {
        await prisma.currency.upsert({
            where: { code: curr.code },
            update: {},
            create: curr
        });
    }
    console.log(`✅ Currencies: ${currencies.length} ensured.`);

    // 3. Incoterms
    // User requested removal of CIF and DDP
    await prisma.incoterm.deleteMany({
        where: { name: { in: ['CIF', 'DDP'] } }
    });
    console.log("Deleted unwanted Incoterms (CIF, DDP).");

    const incoterms = [
        { name: 'Ex Works', xmlCode: 'EXW' },
        { name: 'FOB', xmlCode: 'FOB' },
        { name: 'Saisie Libre', xmlCode: 'MANUAL', requiresText: true }
    ];
    for (const term of incoterms) {
        const existing = await prisma.incoterm.findFirst({ where: { name: term.name } });
        if (!existing) {
            await prisma.incoterm.create({ data: term });
        }
    }
    console.log(`✅ Incoterms: ${incoterms.length} ensured.`);

    // 4. Production Sites
    const sites = ['Production RAP', 'Production STD'];
    for (const name of sites) {
        await prisma.productionSite.upsert({
            where: { name },
            update: {},
            create: { name, country: 'Canada', province: 'QC' }
        });
    }
    console.log(`✅ Production Sites: ${sites.length} ensured.`);

    // 5. Project Locations
    const locations = ['Usine', 'Chantier', 'Bureau'];
    for (const name of locations) {
        await prisma.projectLocation.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }
    console.log(`✅ Project Locations: ${locations.length} ensured.`);

    // 6. Contact Types (Client)
    const clientTypes = ['Architecte', 'Designer', 'Chargé de projet', 'Comptabilité', 'Gérant de chantier', 'Vendeur', 'Directeur de vente'];
    for (const t of clientTypes) {
        await prisma.contactType.upsert({
            where: {
                name_category: { name: t, category: 'Client' }
            },
            update: {},
            create: { name: t, category: 'Client' }
        });
    }

    // 7. Supplier Types (Stored as Contact Types with category 'Supplier')
    const supplierTypes = ['Fournisseur de pierre', 'Transport', 'Consommable', 'Services', 'Autre'];
    for (const t of supplierTypes) {
        await prisma.contactType.upsert({
            where: {
                name_category: { name: t, category: 'Supplier' }
            },
            update: {},
            create: { name: t, category: 'Supplier' }
        });
    }

    console.log(`✅ Contact Types (Client & Supplier) ensured.`);
}

seedParameters()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
