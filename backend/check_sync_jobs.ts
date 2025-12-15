import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkJobs() {
    try {
        console.log('--- Recent Sync Jobs ---');
        const jobs = await prisma.syncJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log(JSON.stringify(jobs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkJobs();
