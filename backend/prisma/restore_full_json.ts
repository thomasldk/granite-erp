
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const backupPath = path.join(__dirname, '../restore_target.json');
    if (!fs.existsSync(backupPath)) {
        console.error("❌ Backup file not found:", backupPath);
        process.exit(1);
    }

    const content = fs.readFileSync(backupPath, 'utf8');
    const backup = JSON.parse(content);
    const data = backup.data;

    console.log('📦 Starting Full Restoration...');

    // 0. CLEANUP (Reverse Order)
    console.log('🧹 Cleaning up existing data...');
    await prisma.quoteItem.deleteMany({});
    await prisma.quote.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.material.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.thirdParty.deleteMany({});
    await prisma.productionSite.deleteMany({});
    await prisma.projectLocation.deleteMany({});
    await prisma.representative.deleteMany({});
    await prisma.currency.deleteMany({});
    await prisma.language.deleteMany({});
    await prisma.paymentTerm.deleteMany({});
    await prisma.contactType.deleteMany({});
    await prisma.incoterm.deleteMany({}); // Added cleanup
    console.log('✨ Cleaned.');


    // Helper to dateify
    const dateify = (obj: any) => {
        if (!obj) return obj;
        const newObj = { ...obj };
        ['createdAt', 'updatedAt', 'dateIssued', 'validUntil'].forEach(key => {
            if (newObj[key] && typeof newObj[key] === 'string') {
                newObj[key] = new Date(newObj[key]);
            }
        });
        return newObj;
    };

    // 0b. Restore Synthesized Incoterms (Missing in backup keys but referenced)
    console.log('🔹 Restoring Incoterms (Synthesized)...');
    const incotermMap = new Map();
    // Scan ThirdParties
    (data.thirdParties || []).forEach((tp: any) => {
        if (tp.incotermId && tp.incoterm) {
            incotermMap.set(tp.incotermId, tp.incoterm);
        }
    });
    // Scan Quotes (just in case)
    (data.quotes || []).forEach((q: any) => {
        if (q.incotermId && q.incoterm) {
            incotermMap.set(q.incotermId, q.incoterm);
        }
    });

    for (const [id, name] of incotermMap) {
        await prisma.incoterm.upsert({
            where: { id },
            update: { name, xmlCode: name },
            create: { id, name, xmlCode: name }
        });
    }

    // 1. Independent Tables
    console.log('🔹 Restoring ContactTypes...');
    for (const item of (data.contactTypes || [])) {
        await prisma.contactType.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring PaymentTerms...');
    for (const item of (data.paymentTerms || [])) {
        await prisma.paymentTerm.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring Languages...');
    for (const item of (data.languages || [])) {
        await prisma.language.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring Currencies...');
    for (const item of (data.currencies || [])) {
        await prisma.currency.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring Representatives...');
    for (const item of (data.representatives || [])) {
        await prisma.representative.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring ProjectLocations...');
    for (const item of (data.projectLocations || [])) {
        await prisma.projectLocation.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    console.log('🔹 Restoring ProductionSites...');
    for (const item of (data.productionSites || [])) {
        await prisma.productionSite.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    // 2. ThirdParties
    console.log('🔹 Restoring ThirdParties (Clients/Suppliers)...');
    for (const item of (data.thirdParties || [])) {
        // Handle nested manually or let Prisma do it if ID matches?
        // Better to strip nested relations for the main upsert and handle them separately
        // OR construct the nested create carefully.
        // The backup has nested contacts/addresses arrays.

        const { contacts, addresses, ...mainData } = item;

        await prisma.thirdParty.upsert({
            where: { id: item.id },
            update: dateify(mainData),
            create: dateify(mainData)
        });

        // Restore Addresses
        if (addresses && addresses.length > 0) {
            for (const addr of addresses) {
                await prisma.address.upsert({
                    where: { id: addr.id },
                    update: dateify({ ...addr, thirdPartyId: item.id }),
                    create: dateify({ ...addr, thirdPartyId: item.id })
                });
            }
        }

        // Restore Contacts
        if (contacts && contacts.length > 0) {
            for (const c of contacts) {
                await prisma.contact.upsert({
                    where: { id: c.id },
                    update: dateify({ ...c, thirdPartyId: item.id }),
                    create: dateify({ ...c, thirdPartyId: item.id })
                });
            }
        }
    }

    // 3. Materials (depend on Suppliers)
    console.log('🔹 Restoring Materials...');
    for (const item of (data.materials || [])) {
        await prisma.material.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    // 4. Projects (depend on ThirdParty, Location)
    console.log('🔹 Restoring Projects...');
    for (const item of (data.projects || [])) {
        await prisma.project.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    // 5. Quotes (depend on Project, ThirdParty, Contact, Material)
    console.log('🔹 Restoring Quotes...');
    for (const item of (data.quotes || [])) {
        await prisma.quote.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    // 6. QuoteItems
    console.log('🔹 Restoring QuoteItems...');
    for (const item of (data.quoteItems || [])) {
        await prisma.quoteItem.upsert({
            where: { id: item.id },
            update: dateify(item),
            create: dateify(item)
        });
    }

    // 7. Settings
    console.log('🔹 Restoring Settings...');
    for (const item of (data.settings || [])) {
        // Setting table usually key-value or single row? Check schema if needed.
        // Assuming key based ID or similar.
        if (item.id) {
            await prisma.setting.upsert({
                where: { id: item.id },
                update: dateify(item),
                create: dateify(item)
            });
        }
    }

    console.log('✅ Full Restoration Complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
