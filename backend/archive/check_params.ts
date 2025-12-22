
import prisma from './src/prisma';

async function checkParams() {
    console.log("ContactTypes:", await prisma.contactType.count());
    console.log("Languages:", await prisma.language.count());
    console.log("Currencies:", await prisma.currency.count());
    console.log("Incoterms:", await prisma.incoterm.count());
    console.log("ProjectLocations:", await prisma.projectLocation.count());
    console.log("ProductionSites:", await prisma.productionSite.count());
    await prisma.$disconnect();
}
checkParams();
