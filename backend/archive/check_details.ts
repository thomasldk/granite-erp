
import prisma from './src/prisma';

async function checkDetails() {
    console.log("--- LANGUAGES ---");
    const langs = await prisma.language.findMany();
    console.log(langs);

    console.log("\n--- PROJECT LOCATIONS ---");
    const locs = await prisma.projectLocation.findMany();
    console.log(locs);

    console.log("\n--- PRODUCTION SITES ---");
    const sites = await prisma.productionSite.findMany();
    console.log(sites);

    await prisma.$disconnect();
}

checkDetails();
