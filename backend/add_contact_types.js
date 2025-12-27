
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const newTypes = [
        'Project Manager',
        'Project Coordinator',
        'Directeur Générale',
        'General Manager',
        'Estimator'
    ];

    console.log('Adding missing Contact Types...');

    for (const type of newTypes) {
        await prisma.contactType.upsert({
            where: {
                name_category: {
                    name: type,
                    category: 'Client'
                }
            },
            update: {},
            create: {
                name: type,
                category: 'Client'
            }
        });
        console.log(`+ Added: ${type}`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
