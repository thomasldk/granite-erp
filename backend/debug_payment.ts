
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Fetch the most recent quote
    const quote = await prisma.quote.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: {
            client: {
                include: {
                    paymentTerm: true
                }
            }
        }
    });

    if (quote) {
        console.log("Quote Ref:", quote.reference);
        console.log("Client Name:", quote.client.name);
        console.log("Payment Term:", quote.client.paymentTerm);
        console.log("Client Override Days:", quote.client.paymentDays);
        console.log("Client Override Deposit:", quote.client.depositPercentage);

        const pt = quote.client.paymentTerm;
        const codeVal = pt?.code || 6;
        const daysVal = (quote.client.paymentDays && quote.client.paymentDays > 0) ? quote.client.paymentDays : (pt?.days || 0);
        const depositVal = (quote.client.depositPercentage && quote.client.depositPercentage > 0) ? quote.client.depositPercentage : (pt?.depositPercentage || 0);

        console.log("--- Calculated ---");
        console.log("Code:", codeVal);
        console.log("Days:", daysVal);
        console.log("Deposit:", depositVal);
        console.log("Accompte Str:", (depositVal > 0) ? (depositVal / 100).toString().replace('.', ',').replace(/^0,/, ',') : '0');
    } else {
        console.log("No quote found");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
