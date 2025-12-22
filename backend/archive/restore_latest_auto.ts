
import fs from 'fs';
import path from 'path';
import prisma from './src/prisma';

async function restoreLatest() {
    // 1. Target the specific backup file requested by user
    const backupPath = '/Users/thomasleguendekergolan/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes/backup-auto-2025-12-22T08-52-56-301Z.json';

    if (!fs.existsSync(backupPath)) {
        console.error(`❌ Backup file not found: ${backupPath}`);
        return;
    }

    console.log(`📂 Reading backup: ${backupPath}`);
    const raw = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(raw);
    const backupData = data.data || data; // Handle if wrapped in 'data' prop

    try {
        // --- 1. Materials ---
        const materials = backupData.materials || [];
        console.log(`\n🧱 Restoring ${materials.length} Materials...`);
        for (const m of materials) {
            const { quotes, supplier, ...clean } = m;
            try {
                await prisma.material.upsert({ where: { id: m.id }, update: {}, create: clean });
            } catch (e: any) {
                if (e.code === 'P2003') { // FK Supplier
                    const { supplierId, ...fallback } = clean;
                    await prisma.material.upsert({ where: { id: m.id }, update: {}, create: fallback });
                }
            }
        }

        // --- 2. Clients / ThirdParties ---
        const thirdParties = backupData.thirdParties || backupData.clients || [];
        console.log(`\n👥 Restoring ${thirdParties.length} Clients/Suppliers...`);
        for (const item of thirdParties) {
            const { contacts, addresses, projects, quotes, materials, incotermId, paymentTermId, ...clean } = item;
            try {
                await prisma.thirdParty.upsert({ where: { id: item.id }, update: {}, create: clean });

                // Nested Contacts
                if (contacts) {
                    for (const c of contacts) {
                        const { quotes, managedProjects, accountingWorkOrders, ...cleanC } = c;
                        await prisma.contact.upsert({ where: { id: c.id }, update: {}, create: { ...cleanC, thirdPartyId: item.id } }).catch(() => { });
                    }
                }
                // Nested Addresses
                if (addresses) {
                    for (const a of addresses) {
                        await prisma.address.upsert({ where: { id: a.id }, update: {}, create: { ...a, thirdPartyId: item.id } }).catch(() => { });
                    }
                }
            } catch (e: any) {
                if (e.code === 'P2003') {
                    await prisma.thirdParty.upsert({ where: { id: item.id }, update: {}, create: clean }); // Retry raw
                }
            }
        }

        // --- 3. Projects ---
        const projects = backupData.projects || [];
        console.log(`\n🏗️ Restoring ${projects.length} Projects...`);
        for (const p of projects) {
            const { quotes, client, location, ...clean } = p;
            try {
                await prisma.project.upsert({ where: { id: p.id }, update: {}, create: clean });
            } catch (e: any) {
                if (e.code === 'P2003') {
                    const { locationId, thirdPartyId, ...fallback } = clean;
                    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: fallback });
                }
            }
        }

        // --- 4. Quotes ---
        const quotes = backupData.quotes || [];
        console.log(`\n📜 Restoring ${quotes.length} Quotes...`);
        for (const q of quotes) {
            const { items, workOrder, client, project, ...clean } = q;
            try {
                await prisma.quote.upsert({ where: { id: q.id }, update: {}, create: clean });
            } catch (e: any) {
                if (e.code === 'P2003') {
                    const { contactId, representativeId, incotermId, paymentTermId, ...fallback } = clean;
                    await prisma.quote.upsert({ where: { id: q.id }, update: {}, create: fallback });
                }
            }
        }

        // --- 5. QuoteItems ---
        const quoteItems = backupData.quoteItems || [];
        console.log(`\n📦 Restoring ${quoteItems.length} QuoteItems...`);
        for (const qi of quoteItems) {
            const { palletItems, quote, ...clean } = qi;
            try {
                await prisma.quoteItem.upsert({ where: { id: qi.id }, update: {}, create: clean });
            } catch (e: any) {
                if (e.code === 'P2003') {
                    const { productionSiteId, ...fallback } = clean;
                    await prisma.quoteItem.upsert({ where: { id: qi.id }, update: {}, create: fallback });
                }
            }
        }

        console.log("\n✅ FINAL RESTORATION COMPLETE.");

    } catch (e) {
        console.error("❌ ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreLatest();
