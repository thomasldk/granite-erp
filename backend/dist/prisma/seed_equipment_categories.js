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
exports.seedEquipmentCategories = seedEquipmentCategories;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const categories = [
    "Automobile",
    "Barrière de sécuritée",
    "Boom Truck",
    "Chargeur",
    "Chauffage",
    "CNC Profileuse",
    "Compresseur",
    "Consommables",
    "Convoyeur",
    "Drilleuse",
    "Génératrice",
    "Grande porte",
    "Guillotineuse",
    "Ligne à air",
    "Ligne à eau",
    "N.D.",
    "Outillage de coupe",
    "Pelle",
    "Polisseur",
    "Pompe à eau",
    "Pont Roulant",
    "Scie à Cable Carrière",
    "Scie à Cable Usine",
    "Scie circulaire",
    "Scie CNC",
    "Soudeuse"
];
function seedEquipmentCategories() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🌱 Seeding Equipment Categories...');
        for (const category of categories) {
            yield prisma.equipmentCategory.upsert({
                where: { name: category },
                update: {},
                create: { name: category },
            });
        }
        console.log('✅ Equipment Categories seeded successfully.');
    });
}
