import { PrismaClient } from '@prisma/client';
import { seedEquipmentCategories } from './seed_equipment_categories';
import { seedPartCategories } from './seed_part_categories';
import { seedEquipment } from './seed_equipment_data';
import { seedParts } from './seed_parts';

import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Materials
    const materials: any[] = [
        { name: 'Granite Noir St-Henry', category: 'Stone', type: 'Granite', purchasePrice: 25.00, sellingPrice: 45.00, unit: 'sqft', density: 168, wasteFactor: 1.25, densityUnit: 'lb/ft3', quality: 'A' },
        { name: 'Quartz Blanc Pur', category: 'Stone', type: 'Quartz', purchasePrice: 35.00, sellingPrice: 65.00, unit: 'sqft', density: 150, wasteFactor: 1.15, densityUnit: 'lb/ft3', quality: 'A' },
        { name: 'Marbre Carrara', category: 'Stone', type: 'Marble', purchasePrice: 40.00, sellingPrice: 80.00, unit: 'sqft', density: 165, wasteFactor: 1.30, densityUnit: 'lb/ft3', quality: 'S' }
    ];

    for (const mat of materials) {
        const exists = await prisma.material.findFirst({ where: { name: mat.name } });
        if (!exists) {
            await prisma.material.create({
                data: mat
            });
        }
    }
    console.log('✅ Materials created');

    // 2. Contact Types
    const contactTypes = ['Architecte', 'Designer', 'Chargé de projet', 'Comptabilité', 'Gérant de chantier', 'Vendeur', 'Directeur de vente', 'Technicien'];
    for (const type of contactTypes) {
        await prisma.contactType.upsert({
            where: {
                name_category: {
                    name: type,
                    category: 'Client'
                }
            },
            update: {},
            create: {
                name: type,
                category: 'Client'
            }
        });
    }
    console.log('✅ Contact Types created');

    // 3. Representative
    let rep = await prisma.representative.findFirst();
    if (!rep) {
        rep = await prisma.representative.create({
            data: {
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@granitedrc.com',
                phone: '514-555-0199'
            }
        });
        console.log('✅ Default Representative created');
    }

    // 4. Payment Terms
    const paymentTerms = [
        { code: 1, label_fr: "Paiement à la commande", label_en: "Payment upon confirmation of order" },
        { code: 2, label_fr: "50% à la commande, le solde avant expédition", label_en: "50% deposit on confirmation of order, balance before delivery", depositPercentage: 50 },
        { code: 3, label_fr: "30 days net", label_en: "30 days net", days: 30 }
    ];

    for (const term of paymentTerms) {
        await prisma.paymentTerm.upsert({
            where: { code: term.code },
            update: {},
            create: term
        });
    }
    console.log('✅ Payment Terms created');

    // 5. Sample Client
    const existingClient = await prisma.thirdParty.findFirst({ where: { code: 'C-EXEMPLE' } });
    if (!existingClient) {
        await prisma.thirdParty.create({
            data: {
                name: 'Construction Exemplaire Inc.',
                type: 'Client',
                code: 'C-EXEMPLE',
                email: 'info@constructionexemplaire.com',
                phone: '450-555-1234',
                website: 'www.constructionexemplaire.com',
                paymentTerms: 'Net 30',
                taxScheme: 'TPS/TVQ',
                creditLimit: 50000,
                repName: rep ? `${rep.firstName} ${rep.lastName}` : 'System',
                language: 'fr',
                addresses: {
                    create: {
                        type: 'Main',
                        line1: '123 Rue Principale',
                        city: 'Montréal',
                        state: 'QC',
                        zipCode: 'H1A 1A1',
                        country: 'Canada'
                    }
                },
                contacts: {
                    create: {
                        firstName: 'Marie',
                        lastName: 'Curie',
                        email: 'marie@constructionexemplaire.com',
                        phone: '450-555-5678',
                        role: 'Architecte'
                    }
                }
            }
        });
        console.log('✅ Sample Client created');
    }

    // 5b. Sample Supplier
    const existingSupplier = await prisma.thirdParty.findFirst({ where: { code: 'F-STONE' } });
    if (!existingSupplier) {
        await prisma.thirdParty.create({
            data: {
                name: 'Stone Supplier Import',
                type: 'Supplier',
                code: 'F-STONE',
                email: 'orders@stonesupplier.com',
                phone: '888-555-9999',
                supplierType: 'Stone',
                paymentTerms: 'Net 30',
                defaultCurrency: 'USD',
                language: 'en',
                addresses: {
                    create: {
                        type: 'Main',
                        line1: '999 Quarry Road',
                        city: 'Vermont',
                        country: 'USA'
                    }
                }
            }
        });
        console.log('✅ Sample Supplier created');
    }

    // 6. Languages
    const languages = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English' }
    ];
    for (const lang of languages) {
        await prisma.language.upsert({
            where: { code: lang.code },
            update: {},
            create: lang
        });
    }
    console.log('✅ Languages created');

    // 7. Currencies
    const currencies = [
        { code: 'CAD', name: 'Dollar Canadien', symbol: '$' },
        { code: 'USD', name: 'Dollar Américain', symbol: 'US$' }
    ];
    for (const curr of currencies) {
        await prisma.currency.upsert({
            where: { code: curr.code },
            update: {},
            create: curr
        });
    }
    console.log('✅ Currencies created');

    // Restore Equipment and Parts
    console.log('⚙️ Restoring Equipment and Parts...');
    await seedEquipmentCategories();
    await seedPartCategories();
    await seedEquipment();
    await seedParts();
    console.log('⚙️ Equipment and Parts restored.');

    // 8. Admin User
    const adminEmail = 'admin@granitedrc.com';
    const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminExists) {
        const hashedPassword = await bcrypt.hash('granite2025', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'Granite',
                role: 'ADMIN',
                employeeProfile: {
                    create: {
                        site: 'Siège Social',
                        department: 'Direction'
                    }
                }
            }
        });
        console.log('✅ Admin User created');
    }

    console.log('🏁 Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
