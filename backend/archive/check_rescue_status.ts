
import prisma from './src/prisma';

async function checkCounts() {
    try {
        const mat = await prisma.material.count();
        const cli = await prisma.thirdParty.count();
        const pro = await prisma.project.count();
        const quo = await prisma.quote.count();
        const itm = await prisma.quoteItem.count();

        console.log(`--- DB STATUS ---`);
        console.log(`Materials: ${mat}`);
        console.log(`Clients:   ${cli}`);
        console.log(`Projects:  ${pro}`);
        console.log(`Quotes:    ${quo}`);
        console.log(`Items:     ${itm}`);
    } catch (e) {
        console.log("DB Connection Error");
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
