
import fs from 'fs';
import path from 'path';
import prisma from './src/prisma';

async function restoreProjectsAndQuotes() {
    const backupFile = path.join(__dirname, 'backups', 'backup_2025-12-20T16-02-55-103Z.json');
    console.log(`📂 Reading backup: ${backupFile}`);

    try {
        const raw = fs.readFileSync(backupFile, 'utf8');
        const data = JSON.parse(raw);

        // 1. PROJECTS
        const projects = data.projects || [];
        console.log(`\n🏗️ Found ${projects.length} Projects...`);
        for (const item of projects) {
            const { quotes, client, location, ...clean } = item;
            try {
                await prisma.project.upsert({ where: { id: item.id }, update: {}, create: clean });
                process.stdout.write('.');
            } catch (e: any) {
                if (e.code === 'P2003') {
                    // console.warn(`\n  ⚠️ FK violation Project ${item.reference}. Retrying minimal.`);
                    const { locationId, thirdPartyId, ...fallback } = clean;
                    await prisma.project.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    process.stdout.write('!');
                } else {
                    console.error(`\n  ❌ Error Project ${item.reference}:`, e.message);
                }
            }
        }
        console.log("\n✅ Projects Done.");

        // 2. QUOTES
        const quotesData = data.quotes || [];
        console.log(`\n📜 Found ${quotesData.length} Quotes...`);
        for (const item of quotesData) {
            const { items, workOrder, client, project, ...clean } = item;
            try {
                await prisma.quote.upsert({ where: { id: item.id }, update: {}, create: clean });
                process.stdout.write('.');
            } catch (e: any) {
                if (e.code === 'P2003') {
                    const { contactId, representativeId, incotermId, paymentTermId, ...fallback } = clean;
                    await prisma.quote.upsert({ where: { id: item.id }, update: {}, create: fallback });
                    process.stdout.write('!');
                }
            }
        }
        console.log("\n✅ Quotes Header Done.");

        // 3. QUOTE ITEMS
        const quoteItems = data.quoteItems || [];
        console.log(`\n📦 Found ${quoteItems.length} QuoteItems...`);
        for (const item of quoteItems) {
            const { palletItems, quote, ...clean } = item;
            try {
                // Strip productionSiteId if it causes issues (as seen before)
                await prisma.quoteItem.upsert({ where: { id: item.id }, update: {}, create: clean });
            } catch (e: any) {
                if (e.code === 'P2003') {
                    const { productionSiteId, ...fallback } = clean;
                    await prisma.quoteItem.upsert({ where: { id: item.id }, update: {}, create: fallback });
                }
            }
        }
        console.log("\n✅ QuoteItems Done.");

        // 4. WORK ORDERS (If any)
        const workOrders = data.workOrders || [];
        if (workOrders.length > 0) {
            console.log(`\n🏭 Found ${workOrders.length} WorkOrders...`);
            for (const item of workOrders) {
                const { pallets, quote, ...clean } = item;
                await prisma.workOrder.upsert({ where: { id: item.id }, update: {}, create: clean });
            }
            console.log("✅ WorkOrders Done.");
        }

    } catch (e) {
        console.error("❌ Critical Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreProjectsAndQuotes();
