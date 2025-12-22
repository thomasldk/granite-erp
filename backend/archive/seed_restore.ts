import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Comprehensive Seed...');

    // 1. Basic Settings
    const contactTypes = ['Architecte', 'Designer', 'Chargé de projet', 'Comptabilité', 'Gérant de chantier'];
    for (const type of contactTypes) {
        await prisma.contactType.upsert({
            where: { name: type },
            update: {},
            create: { name: type }
        });
    }

    await prisma.language.upsert({ where: { code: 'fr' }, update: {}, create: { code: 'fr', name: 'Français' } });
    await prisma.language.upsert({ where: { code: 'en' }, update: {}, create: { code: 'en', name: 'English' } });

    await prisma.currency.upsert({ where: { code: 'CAD' }, update: {}, create: { code: 'CAD', name: 'Cad', symbol: '$' } });
    await prisma.currency.upsert({ where: { code: 'USD' }, update: {}, create: { code: 'USD', name: 'Usd', symbol: 'US$' } });

    // 2. Production Sites
    const rap = await prisma.productionSite.upsert({ where: { name: 'Production RAP' }, update: {}, create: { name: 'Production RAP' } });
    await prisma.productionSite.upsert({ where: { name: 'Production STD' }, update: {}, create: { name: 'Production STD' } });

    // 3. Payment Terms
    const terms = [
        { code: 1, label_fr: "Paiement à la commande", label_en: "Payment upon order", days: 0, deposit: 100 },
        { code: 2, label_fr: "30% à la commande, solde avant expédition", label_en: "30% deposit, balance before shipping", days: 0, deposit: 30 },
        { code: 3, label_fr: "Net 30 jours", label_en: "Net 30 days", days: 30, deposit: 0 },
        { code: 4, label_fr: "2% 10 jours, Net 30", label_en: "2% 10 days, Net 30", days: 30, deposit: 0 },
        { code: 6, label_fr: "A déterminer", label_en: "To be determined", days: 0, deposit: 0 }
    ];

    for (const term of terms) {
        await prisma.paymentTerm.upsert({
            where: { code: term.code },
            update: {},
            create: { code: term.code, label_fr: term.label_fr, label_en: term.label_en, days: term.days, depositPercentage: term.deposit }
        });
    }

    // 4. Representatives
    const reps = ['Steve Pouliot', 'Thomas Leguen', 'Jean Dupont'];
    for (const repName of reps) {
        const [first, ...last] = repName.split(' ');
        await prisma.representative.create({
            data: { firstName: first, lastName: last.join(' '), email: `${first.toLowerCase()}@granitedrc.com`, active: true }
        });
    }

    // 5. Specific Client: AAPQ-CSLA
    const client = await prisma.thirdParty.upsert({
        where: { code: 'C-AAPQ' },
        update: {},
        create: {
            name: 'AAPQ-CSLA',
            code: 'C-AAPQ',
            type: 'Client',
            language: 'fr',
            defaultCurrency: 'CAD',
            paymentTerms: '30% à la commande, solde avant expédition', // Legacy string
            paymentTerm: { connect: { code: 2 } }, // Connect relation for Index 2
            repName: 'Steve Pouliot',
            addresses: {
                create: {
                    type: 'Billing',
                    line1: '420 Rue McGill',
                    city: 'Montréal',
                    state: 'QC',
                    country: 'CA',
                    zipCode: 'H2Y 2G1'
                }
            },
            contacts: {
                create: {
                    firstName: 'Jean-François',
                    lastName: 'Rolland',
                    email: 'jf.rolland@hotmail.com',
                    phone: '+1_(514)_526-6385'
                }
            }
        }
    });

    // 5b. Suppliers
    const suppliers = [
        { name: 'Polycor', code: 'S-POLY', currency: 'CAD' },
        { name: 'Cosentino', code: 'S-COSE', currency: 'USD' },
        { name: 'Granite Mountain', code: 'S-GRMT', currency: 'USD' }
    ];

    const supplierMap = new Map();
    for (const s of suppliers) {
        const supp = await prisma.thirdParty.upsert({
            where: { code: s.code },
            update: {},
            create: {
                name: s.name,
                type: 'Supplier',
                code: s.code,
                supplierType: 'Stone', // From schema
                defaultCurrency: s.currency,
                paymentTerms: 'Net 30'
            }
        });
        supplierMap.set(s.name, supp.id);
    }

    // 6. Materials
    const materials = [
        { name: 'Granite Noir St-Henry', category: 'Stone', type: 'Granite', price: 15, density: 170, supplier: 'Polycor' },
        { name: 'Quartz Blanc Pur', category: 'Stone', type: 'Quartz', price: 25, density: 150, supplier: 'Cosentino' },
        { name: 'Marbre Calacatta', category: 'Stone', type: 'Marbre', price: 45, density: 165, supplier: 'Granite Mountain' },
        { name: 'Ardoise Noire', category: 'Stone', type: 'Ardoise', price: 10, density: 160, supplier: 'Polycor' },
        // Salt And Pepper handled below
    ];

    for (const m of materials) {
        const existing = await prisma.material.findFirst({ where: { name: m.name } });
        if (!existing) {
            await prisma.material.create({
                data: {
                    name: m.name,
                    category: m.category,
                    type: m.type,
                    purchasePrice: m.price,
                    density: m.density,
                    densityUnit: 'lb/ft3',
                    supplier: { connect: { id: supplierMap.get(m.supplier) } }
                }
            });
        }
    }

    // 6b. Material: Salt And Pepper (Specific)
    let saltPepper = await prisma.material.findFirst({ where: { name: 'Salt And Pepper' } });
    if (!saltPepper) {
        saltPepper = await prisma.material.create({
            data: {
                name: 'Salt And Pepper',
                category: 'Stone',
                type: 'Granite',
                purchasePrice: 900,
                density: 175,
                densityUnit: 'lb/ft3',
                supplier: { connect: { id: supplierMap.get('Polycor') } } // Assume Polycor for demo
            }
        });
    } else {
        // Update to link supplier if missing
        saltPepper = await prisma.material.update({
            where: { id: saltPepper.id },
            data: { supplierId: supplierMap.get('Polycor') }
        });
    }

    // Clear conflicting projects/quotes
    try {
        await prisma.quoteItem.deleteMany({ where: { quote: { reference: 'DRC25-1262-C2R0' } } });
        await prisma.quote.deleteMany({ where: { reference: 'DRC25-1262-C2R0' } });
        await prisma.project.deleteMany({ where: { reference: 'P25-1262' } });
    } catch (e) { }

    // 7. Project P25-1262
    const project = await prisma.project.create({
        data: {
            name: 'P25-1262', // XML nom='P25-1262'
            reference: 'P25-1262',
            status: 'Active',
            client: { connect: { id: client.id } },
            measureSystem: 'Imperial'
        }
    });

    // 8. Quote DRC25-1262-C2R0
    const quote = await prisma.quote.create({
        data: {
            reference: 'DRC25-1262-C2R0',
            version: 2,
            status: 'Accepted',
            project: { connect: { id: project.id } },
            client: { connect: { id: client.id } },
            material: { connect: { id: saltPepper.id } },
            currency: 'CAD',
            exchangeRate: 1.0
        }
    });

    // 9. Items (Mocking based on "Salt And Pepper" usually needing items)
    // Creating some realistic items for testing the dashboard
    await prisma.quoteItem.create({
        data: {
            quoteId: quote.id,
            tag: 'Pierre',
            description: 'Bloc de Granite Salt And Pepper',
            material: 'Salt And Pepper',
            quantity: 5, // XML quantite='5'
            unit: 'm3',  // XML unite='m3'

            // Mock Net Dimensions (5 cubic meters is huge, let's just put values)
            netVolume: 5.0,
            totalWeight: 5.0 * 175, // Simplified calc

            unitPriceCad: 900.00,
            totalPriceCad: 4500.00,

            productionSiteId: rap.id,
            productionStatus: 'Pending'
        }
    });

    console.log('✅ Restoration Complete: Project P25-1262 created.');

    // Clear existing demo
    await prisma.quoteItem.deleteMany({ where: { quote: { reference: 'DRC25-0001-C0R0' } } });
    await prisma.quote.deleteMany({ where: { reference: 'DRC25-0001-C0R0' } });
    // Also clear old demo if it exists
    await prisma.quoteItem.deleteMany({ where: { quote: { reference: 'DRC25-DEMO-Q1' } } });
    await prisma.quote.deleteMany({ where: { reference: 'DRC25-DEMO-Q1' } });
    await prisma.project.deleteMany({ where: { reference: 'P25-DEMO-01' } });

    console.log('✅ Comprehensive Seed Complete. You have Data!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
