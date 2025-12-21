
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const code3 = await prisma.incoterm.findFirst({
        where: { xmlCode: '3' }
    });

    if (code3) {
        console.log(`Found Code 3: ${code3.name}`);
        await prisma.incoterm.update({
            where: { id: code3.id },
            data: { name: 'Saisi' }
        });
        console.log('Updated to "Saisi"');
    } else {
        console.log('Code 3 not found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
