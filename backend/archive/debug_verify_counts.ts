
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function verifyCounts() {
    try {
        console.log("🔍 Reading Local Backup (Source of Truth)...");
        const backupPath = path.join(__dirname, 'restore_target.json');
        if (!fs.existsSync(backupPath)) {
            console.error("❌ restore_target.json not found!");
            return;
        }
        const content = fs.readFileSync(backupPath, 'utf8');
        const backup = JSON.parse(content);
        const data = backup.data;

        const backupCounts = {
            materials: data.materials?.length || 0,
            clients: data.thirdParties?.length || 0,
            quotes: data.quotes?.length || 0,
            items: data.quoteItems?.length || 0,
            projects: data.projects?.length || 0
        };

        console.log("📄 BACKUP COUNTS (JSON):", backupCounts);

        console.log("☁️  Checking RAILWAY Database (Postgres)...");
        const dbCounts = {
            materials: await prisma.material.count(),
            clients: await prisma.thirdParty.count(),
            quotes: await prisma.quote.count(),
            items: await prisma.quoteItem.count(),
            projects: await prisma.project.count()
        };

        console.log("🗄️  RAILWAY DB COUNTS:", dbCounts);

        const diff = {
            materials: dbCounts.materials - backupCounts.materials,
            clients: dbCounts.clients - backupCounts.clients,
            quotes: dbCounts.quotes - backupCounts.quotes,
            items: dbCounts.items - backupCounts.items,
            projects: dbCounts.projects - backupCounts.projects
        };

        if (Object.values(diff).every(v => v === 0)) {
            console.log("✅ SUCCESS: Database is perfectly synchronized with the local backup.");
        } else {
            console.warn("⚠️ DISCREPANCY DETECTED:", diff);
            console.warn("Positive = DB has more. Negative = DB missing data.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyCounts();
