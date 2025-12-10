import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📦 Exportation des données locales en cours...');

    const data = {
        settings: await prisma.setting.findMany(),
        currencies: await prisma.currency.findMany(),
        languages: await prisma.language.findMany(),
        paymentTerms: await prisma.paymentTerm.findMany(),
        contactTypes: await prisma.contactType.findMany(),
        representatives: await prisma.representative.findMany(),
        materials: await prisma.material.findMany(),
        projectLocations: await prisma.projectLocation.findMany(),

        // On récupère les Tiers avec leurs adresses et contacts
        thirdParties: await prisma.thirdParty.findMany({
            include: { addresses: true, contacts: true }
        }),

        projects: await prisma.project.findMany(),
    };

    const outputPath = path.join(__dirname, 'data_dump.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Données exportées avec succès dans : ${outputPath}`);
    console.log(`Nombre de clients exportés : ${data.thirdParties.length}`);
    console.log(`Nombre de projets exportés : ${data.projects.length}`);
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors de l'exportation :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
