import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findUnique({
    where: { reference: 'P25-0001' },
    include: { quotes: true }
  });
  
  if (project) {
    console.log(`Project: ${project.reference}`);
    project.quotes.forEach(q => {
      console.log(`Quote: ${q.reference}, Path: ${q.excelFilePath}`);
    });
  } else {
    console.log('Project P25-0001 not found');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
