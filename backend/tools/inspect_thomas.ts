
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
    const thomas = await prisma.user.findFirst({
        where: {
            OR: [
                { firstName: { contains: 'Thomas', mode: 'insensitive' } },
                { lastName: { contains: 'Leguen', mode: 'insensitive' } },
                { email: { contains: 'thomas', mode: 'insensitive' } }
            ]
        },
        include: {
            employeeProfile: true
        }
    });

    console.log('--- FOUND USER ---');
    console.dir(thomas, { depth: null });

    const roles = await prisma.role.findMany();
    console.log('--- ROLES ---');
    console.log(roles);
}

inspect()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
