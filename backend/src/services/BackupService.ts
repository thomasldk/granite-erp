import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BackupService {

    private task: cron.ScheduledTask | null = null;

    constructor() {
        // Ensure initialized
    }

    startAutomatedBackup() {
        // Run immediately on startup
        console.log('🚀 Triggering initial backup on startup...');
        this.performBackupToDisk();

        // Run every hour at minute 0
        this.task = cron.schedule('0 * * * *', async () => {
            console.log('⏰ Starting automated backup...');
            await this.performBackupToDisk();
        });
        console.log('✅ Automated Backup Scheduler Started (Hourly)');
    }

    stop() {
        if (this.task) {
            this.task.stop();
            console.log('🛑 Automated Backup Scheduler Stopped');
        }
    }

    async performBackupToDisk() {
        try {
            const backupData = await this.generateBackupJson();

            // Determine path: ~/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes
            // We use os.homedir() to be safe and cross-platform compatible if username changes
            const backupDir = path.join(os.homedir(), 'Documents', '1Granite DRC', 'nouvelle erp 2025', 'sauvegardes');

            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup-auto-${timestamp}.json`;
            const filePath = path.join(backupDir, filename);

            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
            console.log(`💾 Backup saved to: ${filePath}`);

        } catch (error) {
            console.error('❌ Automated backup failed:', error);
        }
    }

    async generateBackupJson(): Promise<any> {
        // Fetch all data from all models
        // We use Promise.all for parallelism, but be mindful of connection limits if dataset is huge.
        // For this ERP size, it's fine.

        const [
            materials,
            thirdParties,
            paymentTerms,
            contacts,
            addresses,
            projectLocations,
            projects,
            quotes,
            quoteItems,
            settings,
            representatives,
            contactTypes,
            languages,
            productionSites,
            currencies
        ] = await Promise.all([
            prisma.material.findMany(),
            prisma.thirdParty.findMany({ include: { contacts: true, addresses: true } }), // Deep dump for context if needed, but separate tables are safer for pure restore
            prisma.paymentTerm.findMany(),
            prisma.contact.findMany(),
            prisma.address.findMany(),
            prisma.projectLocation.findMany(),
            prisma.project.findMany(),
            prisma.quote.findMany(),
            prisma.quoteItem.findMany(),
            prisma.setting.findMany(),
            prisma.representative.findMany(),
            prisma.contactType.findMany(),
            prisma.language.findMany(),
            prisma.productionSite.findMany(),
            prisma.currency.findMany(),
        ]);

        return {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0',
                appName: 'Granite DRC ERP'
            },
            data: {
                materials,
                thirdParties,
                paymentTerms,
                contacts,
                addresses,
                projectLocations,
                projects,
                quotes,
                quoteItems,
                settings,
                representatives,
                contactTypes,
                languages,
                productionSites,
                currencies
            }
        };
    }
}
