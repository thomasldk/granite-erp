import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class BackupService {
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
