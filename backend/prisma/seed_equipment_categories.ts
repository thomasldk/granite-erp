import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
    console.log('🌱 Seeding Equipment Categories...');

    for (const category of categories) {
        await prisma.equipmentCategory.upsert({
            where: { name: category },
            update: {},
            create: { name: category },
        });
    }

    console.log('✅ Equipment Categories seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
