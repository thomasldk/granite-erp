
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
    const data: any = {};
    const models = [
        'User', 'ThirdParty', 'Contact', 'Address', 'Project',
        'Quote', 'QuoteItem', 'Material', 'Incoterm', 'PaymentTerm',
        'Representative', 'ProjectLocation', 'ProductionSite', 'MaintenanceSite',
        'WorkOrder', 'WorkOrderAdditionalContact', 'Pallet', 'PalletItem', 'Setting', 'Language', 'Currency',
        'EquipmentCategory', 'Equipment', 'PartCategory', 'Part', 'RepairRequest', 'RepairPart',
        'SystemConfig', 'ExchangeRateHistory', 'ContactType',
        'EmployeeProfile', 'Department', 'JobTitle', 'Role', 'HRSite', 'Printer',
        'DeliveryNote', 'DeliveryNoteItem'
    ];

    for (const model of models) {
        try {
            // @ts-ignore
            data[model] = await prisma[model.charAt(0).toLowerCase() + model.slice(1)].findMany();
            console.log(`Backed up ${model}: ${data[model].length} records`);
        } catch (e) {
            console.error(`Error backing up ${model}:`, e);
        }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_db_${timestamp}.json`;
    const backupPath = path.join(__dirname, '../../sauvegardes', filename);

    // Ensure directory exists
    if (!fs.existsSync(path.dirname(backupPath))) {
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    }

    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`Backup saved to: ${backupPath}`);
}

backup()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
