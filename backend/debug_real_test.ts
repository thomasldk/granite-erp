
import fs from 'fs';
import path from 'path';
import * as xmlService from './src/services/xmlService';

const sharePath = '/Volumes/demo/echange';

async function test() {
    console.log("--- DEBUG START ---");

    if (!fs.existsSync(sharePath)) {
        console.error("Share path not found:", sharePath);
        return;
    }

    const files = fs.readdirSync(sharePath);
    const xmlFiles = files.filter(f => f.endsWith('.xml'));

    if (xmlFiles.length === 0) {
        console.error("No XML files found.");
        return;
    }

    // Sort by time
    xmlFiles.sort((a, b) => {
        const statA = fs.statSync(path.join(sharePath, a));
        const statB = fs.statSync(path.join(sharePath, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
    });

    const latestFile = xmlFiles[0];
    const fullPath = path.join(sharePath, latestFile);
    console.log("Testing with latest file:", latestFile);

    const content = fs.readFileSync(fullPath, 'utf-8');
    console.log("File content length:", content.length);

    try {
        console.log("Attempting to parse...");
        const service = new xmlService.XmlService();
        const items = service.parseExcelReturnXml(content);
        console.log("SUCCESS: Parsed items count:", items.length);
        if (items.length > 0) {
            console.log("All parsed items:");
            items.forEach((item, idx) => console.log(`Item ${idx + 1}:`, item));
        } else {
            console.log("WARNING: Parsed 0 items.");
        }
    } catch (e: any) {
        console.error("CRITICAL PARSING ERROR:", e.message);
        console.error(e.stack);
    }

    console.log("--- DEBUG END ---");
}

test();
