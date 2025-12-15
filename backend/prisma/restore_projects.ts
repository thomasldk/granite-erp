
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const projectsToRestore = [
    { id: '61966b0a-6f49-489b-abce-8d834658d99d', name: 'essai7', reference: 'P25-0013', status: 'Prospect', estimatedWeeks: 3, measureSystem: 'Imperial', numberOfLines: 8, createdAt: new Date('2025-12-11 12:19:54.996'), updatedAt: new Date('2025-12-11 13:35:15.321') },
    { id: '16cab405-6e38-49d6-8797-37d92e21cb45', name: 'V25-001', reference: 'P25-0001', status: 'Prospect', estimatedWeeks: 6, measureSystem: 'Imperial', numberOfLines: 9, createdAt: new Date('2025-12-08 12:55:24.674'), updatedAt: new Date('2025-12-08 12:55:24.674') },
    { id: 'a3a1212f-c77a-4c0a-abc4-c6962b9fbc55', name: 'V25-001', reference: 'P25-0002', status: 'Prospect', estimatedWeeks: 6, measureSystem: 'Imperial', numberOfLines: 9, createdAt: new Date('2025-12-08 12:57:57.58'), updatedAt: new Date('2025-12-08 12:57:57.58') },
    { id: 'e46fb096-13fc-4b70-bf45-e49b0b8da8c9', name: 'V25-001', reference: 'P25-0003', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 9, createdAt: new Date('2025-12-08 13:01:34.217'), updatedAt: new Date('2025-12-08 13:01:34.217') },
    { id: '4e975811-967e-47b3-a565-4a4043a3fe8c', name: 'youpi', reference: 'P25-0010', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 7, createdAt: new Date('2025-12-08 22:12:54.009'), updatedAt: new Date('2025-12-09 14:10:41.005') },
    { id: '59d5871b-ac34-483a-a7ee-2849651d76d6', name: 'V25-0001', reference: 'P25-0004', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 4, createdAt: new Date('2025-12-08 13:29:03.933'), updatedAt: new Date('2025-12-08 13:33:27.305') },
    { id: 'e89707d0-19dc-42b5-bf4d-fcef71dadc92', name: 'V25-233', reference: 'P25-0005', status: 'Prospect', estimatedWeeks: 5, measureSystem: 'Imperial', numberOfLines: 7, createdAt: new Date('2025-12-08 13:45:44.429'), updatedAt: new Date('2025-12-08 13:45:44.429') },
    { id: '29a31e87-5bc3-4eba-966c-320d63892ff8', name: 'V25-032', reference: 'P25-0006', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 1, createdAt: new Date('2025-12-08 13:47:53.529'), updatedAt: new Date('2025-12-08 14:07:15.118') },
    { id: 'f4045f0f-8dbc-4994-b526-f254401fd5c1', name: 'V25-999', reference: 'P25-0007', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 1, createdAt: new Date('2025-12-08 14:08:27.477'), updatedAt: new Date('2025-12-08 14:08:37.849') },
    { id: '890b52d4-ff37-42f7-8381-55cb20d21673', name: 'V25-998', reference: 'P25-0008', status: 'Prospect', estimatedWeeks: 7, measureSystem: 'Imperial', numberOfLines: 3, createdAt: new Date('2025-12-08 15:03:35.487'), updatedAt: new Date('2025-12-08 17:02:16.644') },
    { id: '45386586-839c-40af-9a8a-9b701dc4e0f1', name: 'essai 2', reference: 'P25-0011', status: 'Prospect', estimatedWeeks: 6, measureSystem: 'Imperial', numberOfLines: 2, createdAt: new Date('2025-12-09 15:31:09.694'), updatedAt: new Date('2025-12-10 01:37:13.145') },
    { id: 'f3cbcc55-6917-4382-8673-c613fd02d262', name: 'Vessai-01', reference: 'P25-0009', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 1, createdAt: new Date('2025-12-08 17:03:42.35'), updatedAt: new Date('2025-12-08 19:24:10.696') },
    { id: '831654d6-3fc0-4f84-a031-a1b2d940b613', name: 'essai5', reference: 'P25-0012', status: 'Prospect', estimatedWeeks: 4, measureSystem: 'Imperial', numberOfLines: 2, createdAt: new Date('2025-12-10 20:13:32.697'), updatedAt: new Date('2025-12-10 22:54:36.92') }
];

async function restore() {
    console.log('📦 Restoring Projects from Backup...');

    for (const p of projectsToRestore) {
        // Upsert to avoid duplicates if re-run
        await prisma.project.upsert({
            where: { reference: p.reference },
            update: {
                ...p
            },
            create: {
                ...p
            }
        });
        console.log(`✅ Restored: ${p.reference} - ${p.name}`);
    }
    console.log('🏁 Restoration Complete');
}

restore()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
