
import fs from 'fs';
import path from 'path';
import prisma from './src/prisma';

async function restore() {
    const backupPath = path.join(__dirname, 'backups', 'backup_2025-12-20T16-02-55-103Z.json'); // Hardcoded for now
    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found!");
        return;
    }

    console.log(`Reading backup from ${backupPath}...`);
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    try {
        console.log("Starting restoration...");

        // 0. CLEAN DATABASE (Reverse Order of Dependencies)
        console.log("🧹 Clearing existing data...");
        // Delete child tables first
        await prisma.palletItem.deleteMany();
        await prisma.pallet.deleteMany();
        await prisma.workOrder.deleteMany();
        await prisma.quoteItem.deleteMany();
        await prisma.quote.deleteMany();
        await prisma.project.deleteMany();
        await prisma.material.deleteMany();
        await prisma.address.deleteMany();
        await prisma.contact.deleteMany();
        await prisma.thirdParty.deleteMany(); // Clients/Suppliers
        await prisma.productionSite.deleteMany();
        await prisma.paymentTerm.deleteMany();
        await prisma.incoterm.deleteMany();
        await prisma.projectLocation.deleteMany();
        await prisma.currency.deleteMany();
        await prisma.language.deleteMany();
        await prisma.setting.deleteMany();
        await prisma.user.deleteMany();
        console.log("🧹 Data cleared.");

        // 1. Dependencies (No relations or simple)
        if (data.users) {
            console.log(`Restoring ${data.users.length} Users...`);
            for (const item of data.users) {
                await prisma.user.upsert({
                    where: { email: item.email },
                    update: {},
                    create: item
                });
            }
        }

        if (data.settings) {
            console.log(`Restoring ${data.settings.length} Settings...`);
            for (const item of data.settings) await prisma.setting.upsert({ where: { key: item.key }, update: {}, create: item });
        }

        if (data.languages) {
            console.log(`Restoring ${data.languages.length} Languages...`);
            for (const item of data.languages) await prisma.language.upsert({ where: { code: item.code }, update: {}, create: item });
        }

        if (data.currencies) {
            console.log(`Restoring ${data.currencies.length} Currencies...`);
            for (const item of data.currencies) await prisma.currency.upsert({ where: { code: item.code }, update: {}, create: item });
        }

        if (data.incoterms) {
            console.log(`Restoring ${data.incoterms.length} Incoterms...`);
            for (const item of data.incoterms) await prisma.incoterm.upsert({ where: { id: item.id }, update: {}, create: item });
        }

        if (data.paymentTerms) {
            console.log(`Restoring ${data.paymentTerms.length} PaymentTerms...`);
            for (const item of data.paymentTerms) await prisma.paymentTerm.upsert({ where: { id: item.id }, update: {}, create: item });
        }

        if (data.representatives) {
            console.log(`Restoring ${data.representatives.length} Representatives...`);
            for (const item of data.representatives) {
                const { quotes, ...clean } = item;
                await prisma.representative.upsert({ where: { id: item.id }, update: {}, create: clean });
            }
        }

        if (data.projectLocations) {
            console.log(`Restoring ${data.projectLocations.length} ProjectLocations...`);
            for (const item of data.projectLocations) await prisma.projectLocation.upsert({ where: { id: item.id }, update: {}, create: item });
        }

        // 2. ThirdParties (Clients/Suppliers)
        const thirdParties = data.thirdParties || data.clients || [];
        if (thirdParties.length > 0) {
            console.log(`Restoring ${thirdParties.length} ThirdParties...`);
            for (const item of thirdParties) {
                const { contacts, addresses, projects, quotes, materials, ...cleanItem } = item;
                try {
                    await prisma.thirdParty.upsert({ where: { id: item.id }, update: {}, create: cleanItem });
                } catch (e: any) {
                    if (e.code === 'P2003') {
                        console.warn(`Warning: FK violation for ThirdParty ${item.name}. Retrying without FKs.`);
                        const { incotermId, paymentTermId, ...fallback } = cleanItem;
                        await prisma.thirdParty.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    } else {
                        console.error(`Error restoring ThirdParty ${item.name}`, e);
                    }
                }

                // Restore Nested Contacts
                if (contacts && Array.isArray(contacts)) {
                    console.log(`-> Restoring ${contacts.length} contacts for ${item.name}...`);
                    for (const c of contacts) {
                        const { quotes, managedProjects, accountingWorkOrders, ...cleanContact } = c;
                        try {
                            await prisma.contact.upsert({ where: { id: c.id }, update: {}, create: cleanContact });
                        } catch (e) { console.error(`Failed nested contact ${c.firstName} ${c.lastName}:`, e); }
                    }
                }

                // Restore Nested Addresses
                if (addresses && Array.isArray(addresses)) {
                    console.log(`-> Restoring ${addresses.length} addresses for ${item.name}...`);
                    for (const a of addresses) {
                        try {
                            await prisma.address.upsert({ where: { id: a.id }, update: {}, create: a });
                        } catch (e) { console.error(`Failed nested address ${a.id}:`, e); }
                    }
                }
            }
        }

        // 4. Materials
        if (data.materials) {
            console.log(`Restoring ${data.materials.length} Materials...`);
            for (const item of data.materials) {
                const { quotes, ...clean } = item;
                // Retry logic for supplier
                try {
                    await prisma.material.upsert({ where: { id: item.id }, update: {}, create: clean });
                } catch (e: any) {
                    if (e.code === 'P2003') {
                        const { supplierId, ...fallback } = clean;
                        await prisma.material.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    }
                }
            }
        }

        // 5. Projects
        if (data.projects) {
            console.log(`Restoring ${data.projects.length} Projects...`);
            for (const item of data.projects) {
                const { quotes, client, location, ...clean } = item;
                try {
                    await prisma.project.upsert({ where: { id: item.id }, update: {}, create: clean });
                } catch (e: any) {
                    if (e.code === 'P2003') {
                        console.warn(`Warning: FK violation for Project ${item.reference}. Retrying without optional FKs (location/client).`);
                        const { locationId, thirdPartyId, ...fallback } = clean;
                        await prisma.project.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    } else {
                        throw e;
                    }
                }
            }
        }

        // 6. Quotes
        if (data.quotes) {
            console.log(`Restoring ${data.quotes.length} Quotes...`);
            for (const item of data.quotes) {
                const { items, workOrder, client, project, ...clean } = item;
                try {
                    await prisma.quote.upsert({ where: { id: item.id }, update: {}, create: clean });
                } catch (e: any) {
                    if (e.code === 'P2003') {
                        console.warn(`Warning: FK violation for Quote ${item.reference}. Retrying without optional FKs.`);
                        const { contactId, representativeId, incotermId, paymentTermId, ...fallback } = clean;
                        await prisma.quote.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    } else {
                        throw e;
                    }
                }
            }
        }

        // 7. QuoteItems
        if (data.quoteItems) {
            console.log(`Restoring ${data.quoteItems.length} QuoteItems...`);
            for (const item of data.quoteItems) {
                const { palletItems, quote, ...clean } = item;
                await prisma.quoteItem.upsert({ where: { id: item.id }, update: {}, create: clean });
            }
        }

        // 8. WorkOrders
        if (data.workOrders) {
            console.log(`Restoring ${data.workOrders.length} WorkOrders...`);
            for (const item of data.workOrders) {
                const { pallets, quote, ...clean } = item;
                await prisma.workOrder.upsert({ where: { id: item.id }, update: {}, create: clean });
            }
        }

        console.log("✅ Restoration Completed Successfully.");

    } catch (e) {
        console.error("Restoration Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
