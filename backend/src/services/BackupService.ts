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

    async restoreBackup(jsonData: any): Promise<void> {
        const data = jsonData.data;
        if (!data) {
            throw new Error("Invalid backup format: 'data' property missing.");
        }

        console.log('📦 Starting Restore process from JSON...');

        // Helper to convert date strings back to Date objects
        const dateify = (obj: any) => {
            if (!obj) return obj;
            const newObj = { ...obj };
            // Common date fields in our schema
            ['createdAt', 'updatedAt', 'dateIssued', 'validUntil', 'date', 'startDate', 'endDate'].forEach(key => {
                if (newObj[key] && typeof newObj[key] === 'string') {
                    newObj[key] = new Date(newObj[key]);
                }
            });
            return newObj;
        };

        // 1. CLEANUP (Delete in reverse dependency order)
        // We use deleteMany({}) to truncate tables.
        // NOTE: In production with Foreign Keys, order matters crucially.
        console.log('🧹 Cleaning up existing data...');
        const deleteOperations = [
            prisma.repairPart.deleteMany({}),
            prisma.repairRequest.deleteMany({}),
            prisma.workOrder.deleteMany({}),
            prisma.palletItem.deleteMany({}),
            prisma.pallet.deleteMany({}),
            prisma.quoteItem.deleteMany({}),
            prisma.quote.deleteMany({}),
            prisma.project.deleteMany({}),
            prisma.material.deleteMany({}),
            prisma.contact.deleteMany({}),
            prisma.address.deleteMany({}),
            prisma.thirdParty.deleteMany({}),
            prisma.productionSite.deleteMany({}),
            prisma.projectLocation.deleteMany({}),
            prisma.representative.deleteMany({}),
            prisma.currency.deleteMany({}),
            prisma.language.deleteMany({}),
            prisma.paymentTerm.deleteMany({}),
            prisma.contactType.deleteMany({}),
            prisma.incoterm.deleteMany({}),
            prisma.equipment.deleteMany({}),
            prisma.equipmentCategory.deleteMany({}),
            prisma.part.deleteMany({}),
            prisma.partCategory.deleteMany({}),
            prisma.hRSite.deleteMany({}),
            prisma.role.deleteMany({}),
            prisma.jobTitle.deleteMany({}),
            prisma.department.deleteMany({}),
            prisma.employeeProfile.deleteMany({}),
            prisma.user.deleteMany({}),
            prisma.setting.deleteMany({}),
            prisma.systemConfig.deleteMany({}),
            prisma.exchangeRateHistory.deleteMany({})
        ];

        // Execute deletes sequentially
        for (const op of deleteOperations) {
            await op;
        }
        console.log('✨ Database cleaned.');

        // 2. RESTORE (Insert in dependency order)

        console.log('🔹 Restoring Level 0 ( Independent Tables )...');
        // Users
        if (data.users?.length) await prisma.user.createMany({ data: data.users.map(dateify) });
        // Settings / SystemConfig
        if (data.settings?.length) await prisma.setting.createMany({ data: data.settings.map(dateify) });
        if (data.systemConfigs?.length) await prisma.systemConfig.createMany({ data: data.systemConfigs.map(dateify) });
        // Parameters
        if (data.incoterms?.length) await prisma.incoterm.createMany({ data: data.incoterms.map(dateify) });
        if (data.contactTypes?.length) await prisma.contactType.createMany({ data: data.contactTypes.map(dateify) });
        if (data.paymentTerms?.length) await prisma.paymentTerm.createMany({ data: data.paymentTerms.map(dateify) });
        if (data.languages?.length) await prisma.language.createMany({ data: data.languages.map(dateify) });
        if (data.currencies?.length) await prisma.currency.createMany({ data: data.currencies.map(dateify) });
        if (data.representatives?.length) await prisma.representative.createMany({ data: data.representatives.map(dateify) });
        if (data.projectLocations?.length) await prisma.projectLocation.createMany({ data: data.projectLocations.map(dateify) });
        if (data.productionSites?.length) await prisma.productionSite.createMany({ data: data.productionSites.map(dateify) });
        if (data.hrSites?.length) await prisma.hRSite.createMany({ data: data.hrSites.map(dateify) });
        // Equipment/Parts Categories
        if (data.equipmentCategories?.length) await prisma.equipmentCategory.createMany({ data: data.equipmentCategories.map(dateify) });
        if (data.partCategories?.length) await prisma.partCategory.createMany({ data: data.partCategories.map(dateify) });

        console.log('🔹 Restoring Level 1 ( HR, Parts, Equipments )...');
        if (data.departments?.length) await prisma.department.createMany({ data: data.departments.map(dateify) });
        if (data.jobTitles?.length) await prisma.jobTitle.createMany({ data: data.jobTitles.map(dateify) });
        if (data.roles?.length) await prisma.role.createMany({ data: data.roles.map(dateify) });

        if (data.employeeProfiles?.length) await prisma.employeeProfile.createMany({ data: data.employeeProfiles.map(dateify) });

        if (data.parts?.length) await prisma.part.createMany({ data: data.parts.map(dateify) });
        if (data.equipments?.length) await prisma.equipment.createMany({ data: data.equipments.map(dateify) });


        console.log('🔹 Restoring Level 2 ( ThirdParties, Materials )...');

        if (data.thirdParties?.length) {
            const cleanTPs = data.thirdParties.map((tp: any) => {
                const { contacts, addresses, ...rest } = tp;
                return dateify(rest);
            });
            await prisma.thirdParty.createMany({ data: cleanTPs });
        }

        if (data.addresses?.length) await prisma.address.createMany({ data: data.addresses.map(dateify) });
        if (data.contacts?.length) await prisma.contact.createMany({ data: data.contacts.map(dateify) });

        if (data.materials?.length) await prisma.material.createMany({ data: data.materials.map(dateify) });

        console.log('🔹 Restoring Level 3 ( Projects )...');
        if (data.projects?.length) await prisma.project.createMany({ data: data.projects.map(dateify) });

        console.log('🔹 Restoring Level 4 ( Quotes )...');
        if (data.quotes?.length) await prisma.quote.createMany({ data: data.quotes.map(dateify) });

        console.log('🔹 Restoring Level 5 ( QuoteItems, WorkOrders )...');
        if (data.quoteItems?.length) await prisma.quoteItem.createMany({ data: data.quoteItems.map(dateify) });
        if (data.workOrders?.length) await prisma.workOrder.createMany({ data: data.workOrders.map(dateify) });
        if (data.repairRequests?.length) await prisma.repairRequest.createMany({
            data: data.repairRequests.map((r: any) => {
                const { parts, ...rest } = r;
                return dateify(rest);
            })
        });

        console.log('🔹 Restoring Level 6 ( Pallets, RepairParts )...');
        if (data.pallets?.length) await prisma.pallet.createMany({ data: data.pallets.map(dateify) });
        if (data.repairParts?.length) await prisma.repairPart.createMany({ data: data.repairParts.map(dateify) });

        console.log('🔹 Restoring Level 7 ( PalletItems )...');
        if (data.palletItems?.length) await prisma.palletItem.createMany({ data: data.palletItems.map(dateify) });

        console.log('✅ Restoration Complete.');
    }
}
