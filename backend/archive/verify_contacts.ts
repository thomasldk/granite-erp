
import prisma from './src/prisma';

async function checkContacts() {
    try {
        const contactCount = await prisma.contact.count();
        console.log(`Total Contacts: ${contactCount}`);

        const contacts = await prisma.contact.findMany({
            take: 5,
            include: { thirdParty: true }
        });

        console.log("Sample Contacts:");
        contacts.forEach(c => {
            console.log(`- ${c.firstName} ${c.lastName} (Client: ${c.thirdParty?.name || 'MISSING LINK'})`);
        });

        const clientCount = await prisma.thirdParty.count({ where: { type: 'Client' } });
        console.log(`Total Clients: ${clientCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkContacts();
