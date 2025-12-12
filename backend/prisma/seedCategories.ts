import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    "Automobile",
    "Barrière de sécurité",
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
    console.log('Start seeding categories...');
    for (const name of categories) {
        const cat = await prisma.equipmentCategory.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`Synced: ${cat.name}`);
    }
    console.log('Seeding finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
