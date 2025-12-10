
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function check() {
    // 1. Find the quote
    // Assuming partial match or valid reference
    const quote = await prisma.quote.findFirst({
        where: { reference: { contains: 'DRC25-0001-C1R0' } },
        include: { project: true, material: true, client: true }
    });

    if (!quote) {
        console.log("Quote not found in DB");
        return;
    }

    console.log("Quote found:", quote.reference);
    console.log("Quote ID:", quote.id);

    // 2. logic from controller
    const sharePath = '/Volumes/travail';
    const projectDir = quote.project.name;

    const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
    const clientName = safeName(quote.client?.name);
    const materialName = safeName(quote.material?.name);
    const projectName = safeName(quote.project?.name);

    const parts = [
        quote.reference,
        clientName,
        projectName,
        materialName
    ].filter(p => p && p.trim() !== '');

    const filename = `${parts.join('_')}.xlsx`;
    const filePath = path.join(sharePath, projectDir, filename);

    console.log("Expected Path:", filePath);
    console.log("Exists?", fs.existsSync(filePath));

    // 3. List dir contents
    const dirPath = path.join(sharePath, projectDir);
    if (fs.existsSync(dirPath)) {
        console.log(`\nContents of ${dirPath}:`);
        const files = fs.readdirSync(dirPath);
        files.forEach(f => console.log(` - ${f}`));
    } else {
        console.log(`Directory ${dirPath} does not exist.`);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
