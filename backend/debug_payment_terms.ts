
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const terms = await prisma.paymentTerm.findMany({
            orderBy: { code: 'asc' }
        });
        console.log("Current Payment Terms:");
        console.table(terms.map(t => ({
            Code: t.code,
            "Label EN": t.label_en,
            "Label FR": t.label_fr,
            Days: t.days,
            "Dep %": t.depositPercentage,
            "Disc %": t.discountPercentage,
            "Disc Days": t.discountDays
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
