
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- REPRESENTATIVES ---');
    const reps = await prisma.representative.findMany();
    console.log(reps);

    console.log('\n--- CLIENTS (ThirdParty) ---');
    const clients = await prisma.thirdParty.findMany({
        where: { type: 'Client' },
        take: 5
    });
    console.log(clients.map(c => ({ name: c.name, repName: c.repName })));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
