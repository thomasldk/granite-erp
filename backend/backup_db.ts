
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Starting Database Backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const data = {
        projects: await prisma.project.findMany(),
        quotes: await prisma.quote.findMany({ include: { items: true } }),
        clients: await prisma.thirdParty.findMany({ include: { contacts: true, addresses: true } }),
        materials: await prisma.material.findMany(),
        representatives: await prisma.representative.findMany(),
        paymentTerms: await prisma.paymentTerm.findMany(),
    };

    const filepath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    console.log(`✅ Backup saved to: ${filepath}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
