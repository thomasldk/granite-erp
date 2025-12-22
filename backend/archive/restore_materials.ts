
import fs from 'fs';
import path from 'path';
import prisma from './src/prisma';

async function restoreMaterials() {
    const backupFile = path.join(__dirname, 'backups', 'backup_2025-12-20T16-02-55-103Z.json');
    console.log(`📂 Reading backup: ${backupFile}`);

    try {
        const raw = fs.readFileSync(backupFile, 'utf8');
        const data = JSON.parse(raw);
        const materials = data.materials || [];

        console.log(`Found ${materials.length} materials in backup.`);

        for (const m of materials) {
            console.log(`Processing: ${m.name}`);
            // Check if exists
            const existing = await prisma.material.findUnique({ where: { id: m.id } });
            if (!existing) {
                // Must handle foreign key 'supplierId' potentially missing
                // We'll optionally connect or strip it
                const dataToInsert = { ...m };
                delete dataToInsert.supplier; // remove invalid relation object if present

                // Try to find supplier
                if (m.supplierId) {
                    const supplier = await prisma.thirdParty.findUnique({ where: { id: m.supplierId } });
                    if (!supplier) {
                        console.warn(`  ⚠️ Supplier ${m.supplierId} not found for material ${m.name}. Stripping FK.`);
                        dataToInsert.supplierId = null;
                    }
                }

                await prisma.material.create({ data: dataToInsert });
                console.log(`  ✅ Restored.`);
            } else {
                console.log(`  Skipping (already exists).`);
            }
        }
        console.log("🏁 Material restoration complete.");

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreMaterials();
