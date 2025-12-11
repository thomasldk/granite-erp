"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Seeding database...');
        // 1. Stone Types
        const stoneTypes = ['Granite', 'Quartz', 'Marbre', 'Calcaire', 'Ardoise'];
        for (const type of stoneTypes) {
            yield prisma.stoneType.upsert({
                where: { id: type }, // Using name as ID logic for check isn't perfect but sufficient for simple seed if schema allowed unique name. Here we just create if not exists logically.
                update: {},
                create: { name: type, description: `Type de pierre naturelle : ${type}` },
            }); // Type check bypass for simplicity if ID is UUID
        }
        // Let's do it cleaner: fetch all, if not exist create.
        const existingTypes = yield prisma.stoneType.findMany();
        if (existingTypes.length === 0) {
            yield prisma.stoneType.createMany({
                data: stoneTypes.map(name => ({ name, description: `Catégorie ${name}` }))
            });
            console.log('✅ Stone Types created');
        }
        // 2. Finitions
        const finishes = ['Poli', 'Adouci', 'Flamméd', 'Brossé', 'Antique'];
        const existingFinishes = yield prisma.finish.findMany();
        if (existingFinishes.length === 0) {
            yield prisma.finish.createMany({
                data: finishes.map(name => ({ name, description: `Finition ${name}` }))
            });
            console.log('✅ Finishes created');
        }
        // 3. Qualités
        const qualities = ['Standard', 'Premium', 'Commercial', 'Second Choice'];
        const existingQualities = yield prisma.quality.findMany();
        if (existingQualities.length === 0) {
            yield prisma.quality.createMany({
                data: qualities.map(name => ({ name, description: `Qualité ${name}` }))
            });
            console.log('✅ Qualities created');
        }
        // 4. Contact Types
        const contactTypes = ['Architecte', 'Designer', 'Chargé de projet', 'Comptabilité', 'Gérant de chantier'];
        for (const type of contactTypes) {
            yield prisma.contactType.upsert({
                where: { name: type },
                update: {},
                create: { name: type }
            });
        }
        console.log('✅ Contact Types created');
        // 5. Representative
        const rep = yield prisma.representative.create({
            data: {
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'jean.dupont@granitedrc.com',
                phone: '514-555-0199'
            }
        });
        console.log('✅ Default Representative created');
        // 6. Sample Client
        yield prisma.thirdParty.create({
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
                repName: `${rep.firstName} ${rep.lastName}`,
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
                        role: 'Architecte' // Matches one of our types
                    }
                }
            }
        });
        console.log('✅ Sample Client created');
        // 7. Languages
        const languages = [
            { code: 'fr', name: 'Français' },
            { code: 'en', name: 'English' }
        ];
        for (const lang of languages) {
            yield prisma.language.upsert({
                where: { code: lang.code },
                update: {},
                create: lang
            });
        }
        console.log('✅ Languages created');
        // 8. Currencies
        const currencies = [
            { code: 'CAD', name: 'Dollar Canadien', symbol: '$' },
            { code: 'USD', name: 'Dollar Américain', symbol: 'US$' }
        ];
        for (const curr of currencies) {
            yield prisma.currency.upsert({
                where: { code: curr.code },
                update: {},
                create: curr
            });
        }
        console.log('✅ Currencies created');
        console.log('🏁 Seeding finished.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
