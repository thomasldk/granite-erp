
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const id = '3289b663-9736-42da-957c-49ba632dbe59';
    console.log(`🔍 Inspecting Client ID: ${id}`);

    const client = await prisma.thirdParty.findUnique({
        where: { id },
        include: { addresses: true, contacts: true }
    });

    if (client) {
        console.log(JSON.stringify(client, null, 2));
    } else {
        console.log('❌ Client not found in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
