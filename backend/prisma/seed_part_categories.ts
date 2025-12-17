import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    "Assemblage",
    "Autres",
    "Capteur",
    "Consommable",
    "Contacteur",
    "Courroie",
    "Engrenage",
    "Filtre",
    "Joint",
    "Moteur",
    "N.D.",
    "Poulie",
    "Protection",
    "Réducteur",
    "Roue",
    "Roulement"
];

export async function seedPartCategories() {
    console.log('Seeding Part Categories...');
    for (const name of categories) {
        await prisma.partCategory.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('Part Categories seeded successfully.');
}
