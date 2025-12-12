/**
 * Granite ERP - PC Sync Agent
 * 
 * Instructions:
 * 1. Install Node.js on your Windows PC.
 * 2. Create a folder (e.g., C:\GraniteAgent).
 * 3. Save this file as 'agent.js' in that folder.
 * 4. Run: npm install axios form-data fs
 * 5. Run: node agent.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
// IMPORTANT: Replace with your Mac's Local IP (e.g., http://192.168.x.x:5001) or Railway URL
const BACKEND_URL = 'http://192.168.3.147:5005/api/sync';
// DOSSIER D'ECHANGE SUR LE PC (Chemin Lotus Domino)
const EXCHANGE_FOLDER = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange';
// ---------------------

const POLL_INTERVAL_MS = 3000;

console.log("--- Granite ERP Agent Started ---");
console.log(`Backend: ${BACKEND_URL}`);
console.log(`Exchange: ${EXCHANGE_FOLDER}`);

async function poll() {
    try {
        // 1. Ask for work
        const res = await axios.get(`${BACKEND_URL}/pending`);

        if (res.status === 204) {
            // No work
            return;
        }

        const job = res.data;
        console.log(`[JOB] Received Quote: ${job.reference} (${job.id})`);

        // 2. Write XML to Exchange Folder (Extension .rak)
        const rakFilename = `${job.reference}.rak`;
        const rakPath = path.join(EXCHANGE_FOLDER, rakFilename);

        fs.writeFileSync(rakPath, job.xmlContent);
        console.log(`   -> Wrote .rak file to: ${rakPath}`);

        // 3. Watch for Result
        // Logic based on user: automation deletes .rak when done.
        // We also expect a RETURN file (XML) with the calculated data.
        // Legacy system used 'que-{uuid}.xml' or similar matching reference.

        console.log("   -> Waiting for Excel processing...");
        // 3. Watch for Result
        console.log("   -> Waiting for Excel processing...");

        // Expected return file: 'que-{Reference}.xml' 
        // Or if the reference inside the file matches? 
        // Based on legacy code: "que-" + filename.
        // If we send "DRC25-0001.rak", we expect "que-DRC25-0001.xml".
        const returnFilename = `${job.reference}.xml`;
        const returnPath = path.join(EXCHANGE_FOLDER, returnFilename);

        const resultXml = await waitForFile(returnPath, 60000); // Wait up to 60s

        if (resultXml) {
            console.log(`   -> Found Return File: ${returnFilename}`);

            // 4. Send Result (XML) back to Backend
            const form = new FormData();
            form.append('file', resultXml, returnFilename);

            await axios.post(`${BACKEND_URL}/result/${job.id}`, form, {
                headers: form.getHeaders()
            });
            console.log("   -> Sync Complete. Status Updated.");

            // Optional: Delete the return file after success? 
            // Or let the system clean it? User said "il efface le .xml". 
            // Wait, user said "il efface le .rak". Does he efface le .xml return?
            // "au bout de 1 mn il efface le .xml considérant que tu l'as lu"
            // So we just read it quickly.

            // --- B. Send Excel File ---
            try {
                const xmlString = resultXml.toString('utf8');
                console.log("   -> [DEBUG] XML Head:", xmlString.substring(0, 150)); // See what we read

                // Regex: cible="PATH" (Handle potential encoding issues or quote variations)
                const cibleMatch = xmlString.match(/cible=["']([^"']+)["']/);

                let excelPath = null;
                if (cibleMatch && cibleMatch[1]) {
                    excelPath = cibleMatch[1];
                    console.log(`   -> Found Excel Path in XML: ${excelPath}`);
                }

                // If path found, wait for it to appear
                if (excelPath) {
                    const excelFileContent = await waitForFile(excelPath, 15000); // Wait up to 15s for Excel

                    if (excelFileContent) {
                        console.log(`   -> Uploading Excel File...`);
                        const formExcel = new FormData();
                        formExcel.append('file', excelFileContent, path.basename(excelPath));
                        await axios.post(`${BACKEND_URL}/excel/${job.id}`, formExcel, { headers: formExcel.getHeaders() });
                        console.log("   -> [SUCCESS] Excel File Uploaded to Mac.");
                    } else {
                        console.warn(`   -> Excel file not found on disk at: ${excelPath} (Check path access or regex)`);
                    }
                } else {
                    console.warn(`   -> No Excel path found in XML "cible" attribute.`);
                }
            } catch (ex) {
                console.error("   -> Error sending Excel:", ex.message);
            }

            console.log("   -> Sync Complete.");

        } else {
            console.warn("   -> [TIMEOUT] Excel did not respond in time.");
        }

    } catch (err) {
        if (err.response && err.response.status !== 500) {
            console.error("Poll Error:", err.message);
        } else {
            // connection error silent
        }
    }
}

async function waitForFile(filePath, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (fs.existsSync(filePath)) {
            // Give it a small delay to ensure write finish
            await new Promise(r => setTimeout(r, 500));
            return fs.readFileSync(filePath);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return null;
}

// Start Loop
setInterval(poll, POLL_INTERVAL_MS);
