import { PrismaClient } from '@prisma/client';

// Source (Dev) - Taken from .env
const SOURCE_DB_URL = process.env.DATABASE_URL;

// Target (Prod) - Taken from User Input
// postgresql://postgres:yJcLrzjivAkNWBLpDefYtNBrnvFYTosD@shortline.proxy.rlwy.net:15191/GraniteDRC-Prod
const TARGET_DB_URL = "postgresql://postgres:yJcLrzjivAkNWBLpDefYtNBrnvFYTosD@shortline.proxy.rlwy.net:15191/GraniteDRC-Prod";

const sourcePrisma = new PrismaClient({
    datasources: { db: { url: SOURCE_DB_URL } },
});

const targetPrisma = new PrismaClient({
    datasources: { db: { url: TARGET_DB_URL } },
});

async function migrate() {
    console.log("🚀 Starting Data Migration...");
    console.log(`FROM: Dev (${SOURCE_DB_URL})`);
    console.log(`TO:   Prod (${TARGET_DB_URL})`);

    try {
        // 1. Settings & Reference Data (No Dependencies)
        console.log("Copying Settings...");
        const settings = await sourcePrisma.setting.findMany();
        if (settings.length) await targetPrisma.setting.createMany({ data: settings, skipDuplicates: true });

        console.log("Copying Currencies...");
        const currencies = await sourcePrisma.currency.findMany();
        if (currencies.length) await targetPrisma.currency.createMany({ data: currencies, skipDuplicates: true });

        console.log("Copying Languages...");
        const languages = await sourcePrisma.language.findMany();
        if (languages.length) await targetPrisma.language.createMany({ data: languages, skipDuplicates: true });

        console.log("Copying Incoterms...");
        const incoterms = await sourcePrisma.incoterm.findMany();
        if (incoterms.length) await targetPrisma.incoterm.createMany({ data: incoterms, skipDuplicates: true });

        console.log("Copying PaymentTerms...");
        const paymentTerms = await sourcePrisma.paymentTerm.findMany();
        if (paymentTerms.length) await targetPrisma.paymentTerm.createMany({ data: paymentTerms, skipDuplicates: true });

        console.log("Copying ContactTypes...");
        const contactTypes = await sourcePrisma.contactType.findMany();
        if (contactTypes.length) await targetPrisma.contactType.createMany({ data: contactTypes, skipDuplicates: true });

        console.log("Copying ProductionSites...");
        const productionSites = await sourcePrisma.productionSite.findMany();
        if (productionSites.length) await targetPrisma.productionSite.createMany({ data: productionSites, skipDuplicates: true });

        console.log("Copying ProjectLocations...");
        const projectLocations = await sourcePrisma.projectLocation.findMany();
        if (projectLocations.length) await targetPrisma.projectLocation.createMany({ data: projectLocations, skipDuplicates: true });

        console.log("Copying Representatives...");
        const representatives = await sourcePrisma.representative.findMany();
        if (representatives.length) await targetPrisma.representative.createMany({ data: representatives, skipDuplicates: true });


        // 2. Third Parties & Dependents
        console.log("Copying ThirdParties...");
        const thirdParties = await sourcePrisma.thirdParty.findMany();
        // Batch insert might fail if self-relations exist (e.g. customsBroker). 
        // Ideally we should sort or do 2 passes, but let's try standard createMany first. 
        // Wait, createMany ignores relations.
        if (thirdParties.length) await targetPrisma.thirdParty.createMany({ data: thirdParties, skipDuplicates: true });

        console.log("Copying Addresses...");
        const addresses = await sourcePrisma.address.findMany();
        if (addresses.length) await targetPrisma.address.createMany({ data: addresses, skipDuplicates: true });

        console.log("Copying Contacts...");
        const contacts = await sourcePrisma.contact.findMany();
        if (contacts.length) await targetPrisma.contact.createMany({ data: contacts, skipDuplicates: true });

        // 3. Materials
        console.log("Copying Materials...");
        const materials = await sourcePrisma.material.findMany();
        if (materials.length) await targetPrisma.material.createMany({ data: materials, skipDuplicates: true });

        // 4. Projects
        console.log("Copying Projects...");
        const projects = await sourcePrisma.project.findMany();
        if (projects.length) await targetPrisma.project.createMany({ data: projects, skipDuplicates: true });

        // 5. Quotes
        console.log("Copying Quotes...");
        const quotes = await sourcePrisma.quote.findMany();
        if (quotes.length) await targetPrisma.quote.createMany({ data: quotes, skipDuplicates: true });

        console.log("Copying QuoteItems...");
        const quoteItems = await sourcePrisma.quoteItem.findMany();
        if (quoteItems.length) await targetPrisma.quoteItem.createMany({ data: quoteItems, skipDuplicates: true });

        // 6. Production (WorkOrders, Pallets)
        console.log("Copying WorkOrders...");
        const workOrders = await sourcePrisma.workOrder.findMany();
        if (workOrders.length) await targetPrisma.workOrder.createMany({ data: workOrders, skipDuplicates: true });

        console.log("Copying Pallets...");
        const pallets = await sourcePrisma.pallet.findMany();
        if (pallets.length) await targetPrisma.pallet.createMany({ data: pallets, skipDuplicates: true });

        console.log("Copying PalletItems...");
        const palletItems = await sourcePrisma.palletItem.findMany();
        if (palletItems.length) await targetPrisma.palletItem.createMany({ data: palletItems, skipDuplicates: true });

        // 7. Delivery (New)
        console.log("Copying DeliveryNotes...");
        const notes = await sourcePrisma.deliveryNote.findMany();
        if (notes.length) await targetPrisma.deliveryNote.createMany({ data: notes, skipDuplicates: true });

        console.log("Copying DeliveryNoteItems...");
        const noteItems = await sourcePrisma.deliveryNoteItem.findMany();
        if (noteItems.length) await targetPrisma.deliveryNoteItem.createMany({ data: noteItems, skipDuplicates: true });

        // 8. Maintenance
        console.log("Copying MaintenanceSites...");
        const maintenanceSites = await sourcePrisma.maintenanceSite.findMany();
        if (maintenanceSites.length) await targetPrisma.maintenanceSite.createMany({ data: maintenanceSites, skipDuplicates: true });

        console.log("Copying EquipmentCategories...");
        const eqCats = await sourcePrisma.equipmentCategory.findMany();
        if (eqCats.length) await targetPrisma.equipmentCategory.createMany({ data: eqCats, skipDuplicates: true });

        console.log("Copying Equipments...");
        const equipments = await sourcePrisma.equipment.findMany();
        if (equipments.length) await targetPrisma.equipment.createMany({ data: equipments, skipDuplicates: true });

        console.log("Copying PartCategories...");
        const partCats = await sourcePrisma.partCategory.findMany();
        if (partCats.length) await targetPrisma.partCategory.createMany({ data: partCats, skipDuplicates: true });

        console.log("Copying Parts...");
        const parts = await sourcePrisma.part.findMany();
        if (parts.length) await targetPrisma.part.createMany({ data: parts, skipDuplicates: true });

        console.log("Copying RepairRequests...");
        const repairs = await sourcePrisma.repairRequest.findMany();
        if (repairs.length) await targetPrisma.repairRequest.createMany({ data: repairs, skipDuplicates: true });

        console.log("Copying RepairParts...");
        const repairParts = await sourcePrisma.repairPart.findMany();
        if (repairParts.length) await targetPrisma.repairPart.createMany({ data: repairParts, skipDuplicates: true });

        // 9. Users & HR (CRITICAL FOR LOGIN)
        console.log("Copying Roles...");
        const roles = await sourcePrisma.role.findMany();
        if (roles.length) await targetPrisma.role.createMany({ data: roles, skipDuplicates: true });

        console.log("Copying Departments...");
        const depts = await sourcePrisma.department.findMany();
        if (depts.length) await targetPrisma.department.createMany({ data: depts, skipDuplicates: true });

        console.log("Copying JobTitles...");
        const titles = await sourcePrisma.jobTitle.findMany();
        if (titles.length) await targetPrisma.jobTitle.createMany({ data: titles, skipDuplicates: true });

        console.log("Copying Users...");
        const users = await sourcePrisma.user.findMany();
        if (users.length) await targetPrisma.user.createMany({ data: users, skipDuplicates: true });

        console.log("Copying EmployeeProfiles...");
        const profiles = await sourcePrisma.employeeProfile.findMany();
        if (profiles.length) await targetPrisma.employeeProfile.createMany({ data: profiles, skipDuplicates: true });

        console.log("✅ Migration Complete!");

    } catch (error) {
        console.error("❌ Migration Failed:", error);
    } finally {
        await sourcePrisma.$disconnect();
        await targetPrisma.$disconnect();
    }
}

migrate();
