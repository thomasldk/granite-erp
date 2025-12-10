
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function check() {
    // ID for Quote DRC25-0004-C0R0 (from previous logs)
    // Looking at the screenshot, the user might be on a NEWER quote.
    // Screenshot: DRC25-0007-C0R0...
    // Let's find the quote by reference to be sure.

    // User mentioned "DRC25-0001-C1R0" in metadata, but screenshot shows "DRC25-0007".
    // I will search for the latest quote created.

    const quote = await prisma.quote.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { project: true, material: true, client: true }
    });

    if (!quote) {
        console.log("No quote found.");
        return;
    }

    console.log(`Checking Latest Quote: ${quote.reference}`);

    const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
    const clientName = safeName(quote.client?.name);
    const materialName = quote.material ? safeName(quote.material.name) : '';
    const projectName = quote.project ? safeName(quote.project.name) : '';

    const parts = [
        quote.reference,
        clientName,
        projectName,
        materialName
    ].filter(p => p && p.trim() !== '');

    const filename = `${parts.join('_')}.xml`;
    const sharePath = '/Volumes/demo/echange';
    const fullPath = path.join(sharePath, filename);

    console.log("Expected Filename:", filename);
    console.log("Expected Full Path:", fullPath);

    if (fs.existsSync(fullPath)) {
        console.log("SUCCESS: File exists!");
    } else {
        console.log("FAILURE: File NOT found.");

        // List directory to see what IS there
        console.log("\nContents of /Volumes/demo/echange:");
        try {
            const files = fs.readdirSync(sharePath);
            files.forEach(f => console.log(` - ${f}`));
        } catch (e) {
            console.log("Error reading directory:", e);
        }
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
