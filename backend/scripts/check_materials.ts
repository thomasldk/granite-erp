import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Vérification des Matériaux...');

    // Check connection URL to know where we are looking (Local or Remote)
    // We can hint this by printing the host (masked)
    const url = process.env.DATABASE_URL || '';
    console.log(`URL de la base: ${url.includes('railway') ? 'RAILWAY (Distance)' : 'LOCALE (Mac)'}`);

    const materials = await prisma.material.findMany();
    console.log(`Nombre de matériaux trouvés: ${materials.length}`);

    const stones = materials.filter(m => m.category === 'Stone');
    console.log(`Dont catégorie 'Stone' (Achat Pierre): ${stones.length}`);

    if (stones.length > 0) {
        console.log('Exemples de pierres:');
        stones.slice(0, 3).forEach(m => console.log(` - ${m.name} (${m.type})`));
    } else {
        console.log('⚠️ Aucune pierre trouvée !');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
