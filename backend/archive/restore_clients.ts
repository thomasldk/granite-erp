
import fs from 'fs';
import path from 'path';
import prisma from './src/prisma';

async function restoreClientsAndSuppliers() {
    const backupFile = path.join(__dirname, 'backups', 'backup_2025-12-20T16-02-55-103Z.json');
    console.log(`📂 Reading backup: ${backupFile}`);

    try {
        const raw = fs.readFileSync(backupFile, 'utf8');
        const data = JSON.parse(raw);

        // ThirdParties usually cover both Clients and Suppliers
        const thirdParties = data.thirdParties || data.clients || [];
        console.log(`Found ${thirdParties.length} ThirdParties (Clients/Suppliers)...`);

        for (const item of thirdParties) {
            console.log(`Processing: ${item.name} (${item.type})`);

            // 1. Clean data for insertion
            const {
                contacts,
                addresses,
                projects,
                quotes,
                materials,
                incotermId,
                paymentTermId,
                ...cleanItem
            } = item;

            // 2. Handle Foreign Keys (Incoterms / PaymentTerms)
            // We strip them if they don't exist to allow data entry
            let finalItem = { ...cleanItem };

            // 3. Upsert ThirdParty
            try {
                await prisma.thirdParty.upsert({
                    where: { id: item.id },
                    update: {},
                    create: finalItem
                });
                console.log(`  ✅ Restored Main Entity: ${item.name}`);

                // 4. Restore Nested Contacts
                if (contacts && Array.isArray(contacts)) {
                    console.log(`    -> Restoring ${contacts.length} contacts...`);
                    for (const c of contacts) {
                        const { quotes, managedProjects, accountingWorkOrders, ...cleanContact } = c;
                        await prisma.contact.upsert({
                            where: { id: c.id },
                            update: {},
                            create: { ...cleanContact, thirdPartyId: item.id }
                        }).catch(e => console.error(`    ❌ Contact Error (${c.firstName}):`, e.message));
                    }
                }

                // 5. Restore Nested Addresses
                if (addresses && Array.isArray(addresses)) {
                    console.log(`    -> Restoring ${addresses.length} addresses...`);
                    for (const a of addresses) {
                        await prisma.address.upsert({
                            where: { id: a.id },
                            update: {},
                            create: { ...a, thirdPartyId: item.id }
                        }).catch(e => console.error(`    ❌ Address Error:`, e.message));
                    }
                }

            } catch (e: any) {
                console.error(`  ❌ Failed to restore ${item.name}:`, e.message);
            }
        }
        console.log("🏁 Client/Supplier restoration complete.");

    } catch (e) {
        console.error("❌ Critical Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreClientsAndSuppliers();
