
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for 'Construction Exemplaire'...");
    const clients = await prisma.thirdParty.findMany({
        where: {
            name: {
                contains: 'Construction Exemplaire'
            }
        },
        include: {
            contacts: true,
            addresses: true,
            paymentTerm: true
        }
    });

    console.log(`Found ${clients.length} clients.`);
    clients.forEach(c => {
        console.log("------------------------------------------------");
        console.log(`ID: ${c.id}`);
        console.log(`Name: ${c.name}`);
        console.log(`Language: ${c.language}`);
        console.log(`UnitSystem: ${c.unitSystem}`);
        console.log(`Contacts: ${c.contacts.length}`);
        console.log(`Addresses: ${c.addresses.length}`);
        console.log(`PaymentTerm: ${c.paymentTerm?.code} - ${c.paymentTerm?.label_fr}`);
        console.log(JSON.stringify(c, null, 2));
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
