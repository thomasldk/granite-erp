import * as cron from 'node-cron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

export class BackupService {

    private task: cron.ScheduledTask | null = null;

    constructor() {
        // Ensure initialized
    }

    startAutomatedBackup() {
        // Run immediately on startup -> DISABLED to prevent boot crash on Railway
        // console.log('🚀 Triggering initial backup on startup...');
        // this.performBackupToDisk();

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

    async performBackupToDisk(): Promise<string | undefined> {
        try {
            const backupData = await this.generateBackupJson();

            // Determine path: ~/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes
            // We use os.homedir() to be safe and cross-platform compatible if username changes
            const backupDir = path.join(os.homedir(), 'Documents', '1Granite DRC', 'nouvelle erp 2025', 'sauvegardes');

            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const now = new Date();
            const pad = (n: number) => n.toString().padStart(2, '0');
            const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            const formattedTime = `${pad(now.getHours())}-${pad(now.getMinutes())}`;

            const filename = `Granite_ERP_DB_${formattedDate}_${formattedTime}.json`;
            const filePath = path.join(backupDir, filename);

            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
            console.log(`💾 Backup saved to: ${filePath}`);
            return filePath;

        } catch (error) {
            throw error;
        }
    }

    getLatestBackupPath(): string | null {
        try {
            const backupDir = path.join(os.homedir(), 'Documents', '1Granite DRC', 'nouvelle erp 2025', 'sauvegardes');

            if (!fs.existsSync(backupDir)) {
                return null;
            }

            const files = fs.readdirSync(backupDir)
                .filter(file => file.endsWith('.json'))
                .map(file => ({
                    file,
                    mtime: fs.statSync(path.join(backupDir, file)).mtime
                }))
                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

            if (files.length === 0) {
                return null;
            }

            return path.join(backupDir, files[0].file);
        } catch (error) {
            console.error('Error fetching latest backup path:', error);
            return null;
        }
    }

    async generateBackupJson(): Promise<any> {
        // Fetch all data from all models
        // We use Promise.all for parallelism, but be mindful of connection limits if dataset is huge.
        // For this ERP size, it's fine.

        const [
            users,
            employeeProfiles,
            departments,
            jobTitles,
            roles,
            hrSites,
            printers,
            materials,
            thirdParties,
            paymentTerms,
            contacts,
            addresses,
            projectLocations,
            projects,
            quotes,
            quoteItems,
            workOrders,
            pallets,
            palletItems,
            settings,
            representatives,
            contactTypes,
            languages,
            productionSites,
            currencies,
            equipmentCategories,
            equipments,
            partCategories,
            parts,
            repairRequests,
            repairParts,
            incoterms,
            maintenanceSites,
            systemConfigs,
            exchangeRateHistories
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.employeeProfile.findMany(),
            prisma.department.findMany(),
            prisma.jobTitle.findMany(),
            prisma.role.findMany(),
            prisma.hRSite.findMany(),
            prisma.printer.findMany(),
            prisma.material.findMany(),
            prisma.thirdParty.findMany({ include: { contacts: true, addresses: true } }),
            prisma.paymentTerm.findMany(),
            prisma.contact.findMany(),
            prisma.address.findMany(),
            prisma.projectLocation.findMany(),
            prisma.project.findMany(),
            prisma.quote.findMany(),
            prisma.quoteItem.findMany(),
            prisma.workOrder.findMany(),
            prisma.pallet.findMany(),
            prisma.palletItem.findMany(),
            prisma.setting.findMany(),
            prisma.representative.findMany(),
            prisma.contactType.findMany(),
            prisma.language.findMany(),
            prisma.productionSite.findMany(),
            prisma.currency.findMany(),
            prisma.equipmentCategory.findMany(),
            prisma.equipment.findMany(),
            prisma.partCategory.findMany(),
            prisma.part.findMany(),
            prisma.repairRequest.findMany({ include: { parts: true } }),
            prisma.repairPart.findMany(),
            prisma.incoterm.findMany(),
            prisma.maintenanceSite.findMany(),
            prisma.systemConfig.findMany(),
            prisma.exchangeRateHistory.findMany()
        ]);

        return {
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.1',
                appName: 'Granite DRC ERP'
            },
            data: {
                users,
                employeeProfiles,
                departments,
                jobTitles,
                roles,
                hrSites,
                printers,
                materials,
                thirdParties,
                paymentTerms,
                contacts,
                addresses,
                projectLocations,
                projects,
                quotes,
                quoteItems,
                workOrders,
                pallets,
                palletItems,
                settings,
                representatives,
                contactTypes,
                languages,
                productionSites,
                currencies,
                equipmentCategories,
                equipments,
                partCategories,
                parts,
                repairRequests,
                repairParts,
                incoterms,
                maintenanceSites,
                systemConfigs,
                exchangeRateHistories
            }
        };
    }
}
