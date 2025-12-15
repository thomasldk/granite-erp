import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.project.findUnique({ where: { reference: 'P25-0001' } });
  console.log(`Project Name: "${p?.name}"`);
}
main().catch(console.error).finally(()=>prisma.$disconnect());
