/**
 * Granite ERP - PC Sync Agent
 * 
 * Instructions:
 * 1. Install Node.js on your Windows PC.
 * 2. Create a folder (e.g., C:\GraniteAgent).
 * 3. Save this file as 'agent.js' in that folder.
 * 4. Run: npm install axios form-data
 * 5. Run: node agent.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
const BACKEND_URL = 'https://yellow-plums-sing.loca.lt/api/sync'; // Public Tunnel
const EXCHANGE_FOLDER = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange';

// Create Axios Instance with Header to bypass LocalTunnel warning
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.headers.common['User-Agent'] = 'GraniteAgent/1.0';
// ---------------------

const POLL_INTERVAL_MS = 3000;

console.log("--- Granite ERP Agent Started ---");
console.log(`Backend: ${BACKEND_URL}`);
console.log(`Exchange Folder: ${EXCHANGE_FOLDER}`);

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

        // --- NEW: REIMPORT LOGIC ---
        if (job.type === 'REIMPORT' && job.excelUrl && job.targetPath) {
            console.log(`   -> Job Type: REIMPORT`);
            console.log(`   -> Target Excel Path: ${job.targetPath}`);
            console.log(`   -> Downloading Source Excel...`);

            try {
                // Ensure directory exists for the target Excel
                const excelDir = path.dirname(job.targetPath);
                if (!fs.existsSync(excelDir)) {
                    fs.mkdirSync(excelDir, { recursive: true });
                }

                // Download the file
                // We use responseType: 'stream' to pipe to file
                const writer = fs.createWriteStream(job.targetPath);
                const excelRes = await axios({
                    // FIX: BACKEND_URL is .../api/sync. We need base host ...:5005. 
                    // job.excelUrl is /api/quotes/...
                    // So we strip '/api/sync' from backend url.
                    url: `${BACKEND_URL.replace('/api/sync', '')}${job.excelUrl}`,
                    method: 'GET',
                    responseType: 'stream'
                });

                console.log(`   -> Download Status: ${excelRes.status}`);
                console.log(`   -> Content-Type: ${excelRes.headers['content-type']}`);
                console.log(`   -> Content-Length: ${excelRes.headers['content-length']}`);

                if (excelRes.status !== 200) {
                    console.error("   -> ERROR: Download failed with status", excelRes.status);
                    writer.destroy(); // Close stream
                    fs.unlinkSync(job.targetPath); // Delete partial file
                    return;
                }

                // Pipe to file
                excelRes.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', (err) => {
                        console.error("   -> Stream Error:", err);
                        writer.destroy();
                        fs.unlinkSync(job.targetPath);
                        reject(err);
                    });
                });

                console.log(`   -> Excel saved successfully to: ${job.targetPath}`);

            } catch (dlErr) {
                console.error(`   -> FAILED to download/save Excel:`, dlErr.message);
                // Should we abort? Yes, automation won't work without file.
                // Todo: Send Error back to server?
                return;
            }
        }
        // ---------------------------

        // 2. Write XML to Exchange Folder (Extension .rak or .xml depending on job)
        // job.targetFilename provided by backend (e.g. .rak)
        const rakFilename = job.targetFilename || `${job.reference}.rak`;
        const rakPath = path.join(EXCHANGE_FOLDER, rakFilename);

        try {
            fs.writeFileSync(rakPath, job.xmlContent);
            console.log(`   -> Wrote trigger file (${rakFilename}) to: ${rakPath}`);
        } catch (filesysError) {
            console.error(`   -> ERROR writing trigger file. Check permissions or folder path: ${rakPath}`);
            return;
        }

        // 3. Watch for Result
        console.log("   -> Waiting for Excel processing...");

        // Fix: Automation mirrors the input filename. If we sent "LongName.rak", we expect "LongName.xml".
        let returnFilename = `${job.reference}.xml`;
        if (job.targetFilename) {
            returnFilename = job.targetFilename.replace(/\.rak$/i, '.xml');
        }
        const returnPath = path.join(EXCHANGE_FOLDER, returnFilename);

        const resultXml = await waitForFile(returnPath, 180000); // Wait up to 180s (3m)

        if (resultXml) {
            console.log(`   -> Found Return File: ${returnFilename}`);

            // 4. Parse XML locally to check for Excel path FIRST (LEGACY Check, might not be needed for Reuse but safe to keep)
            let excelPath = null;
            try {
                const xmlString = resultXml.toString('utf8');
                // console.log("   -> [DEBUG] XML Head:", xmlString.substring(0, 150));

                const cibleMatch = xmlString.match(/cible=["']([^"']+)["']/);
                if (cibleMatch && cibleMatch[1]) {
                    excelPath = cibleMatch[1];
                    // console.log(`   -> Found Excel Path in XML: ${excelPath}`);
                }

                // If path found, wait for it to appear
                if (excelPath) {
                    // For REIMPORT, we already put it there, so it exists. 
                    // But maybe Automation modified it? 
                    // We should upload it back if the Mac wants the Result Excel?
                    // Currently Mac Logic:
                    // - Creation: Wants Result Excel.
                    // - Reimport: Wants Result data (XML). Does it want the Excel back?
                    // Usually yes, to have the "calculated" version if Automation changed cells.
                    // Let's assume YES, we upload it back.

                    const excelFileContent = await waitForFile(excelPath, 15000); // Wait up to 15s for Excel

                    if (excelFileContent) {
                        console.log(`   -> Uploading Result Excel File...`);
                        const formExcel = new FormData();
                        formExcel.append('file', excelFileContent, path.basename(excelPath));
                        await axios.post(`${BACKEND_URL}/excel/${job.id}`, formExcel, { headers: formExcel.getHeaders() });
                        console.log("   -> [SUCCESS] Excel File Uploaded to Mac.");
                    } else {
                        console.warn(`   -> Excel file not found on disk at: ${excelPath} (Check path access or regex)`);
                    }
                }
            } catch (ex) {
                console.error("   -> Error preparing/sending Excel:", ex.message);
            }

            // 5. Send Result (XML) back to Backend (Status Update triggers here)
            // We do this LAST so the status changes to 'Calculated' only when everything is ready.
            const form = new FormData();
            form.append('file', resultXml, returnFilename);

            await axios.post(`${BACKEND_URL}/result/${job.id}`, form, {
                headers: form.getHeaders()
            });
            console.log("   -> Sync Complete. Status Updated.");

            // 6. CLEANUP: Delete the XML file to prevent stale data on next run
            try {
                if (fs.existsSync(returnPath)) {
                    fs.unlinkSync(returnPath);
                    console.log(`   -> [CLEANUP] Deleted Result XML: ${returnFilename}`);
                }
            } catch (cleanupErr) {
                console.error(`   -> [CLEANUP WARNING] Failed to delete ${returnFilename}:`, cleanupErr.message);
            }

            console.log("   -> Job Cycle Complete.");

        } else {
            console.warn("   -> [TIMEOUT] Excel did not respond in time (60s).");
        }

    } catch (err) {
        if (err.response && err.response.status !== 500) {
            console.error("Poll Error:", err.message);
        } else {
            // connection error silent (to avoid spamming log)
            // console.error("Poll Connection Error. Retrying...");
        }
    }
}

async function waitForFile(filePath, timeoutMs) {
    const start = Date.now();
    let lastSize = -1;
    let stableCount = 0;

    while (Date.now() - start < timeoutMs) {
        if (fs.existsSync(filePath)) {
            try {
                const stats = fs.statSync(filePath);
                if (stats.size > 0) {
                    if (stats.size === lastSize) {
                        stableCount++;
                    } else {
                        stableCount = 0;
                        lastSize = stats.size;
                    }

                    // If size hasn't changed for 3 checks (approx 1.5s), assume it's done
                    if (stableCount >= 2) {
                        // console.log(`[DEBUG] File stable at ${stats.size} bytes.`);
                        // Give it one final small delay
                        await new Promise(r => setTimeout(r, 500));
                        return fs.readFileSync(filePath);
                    }
                }
            } catch (e) {
                // Ignore stat errors (locking)
            }
        }
        await new Promise(r => setTimeout(r, 800)); // Check every 800ms
    }
    return null;
}

// Start Loop
setInterval(poll, POLL_INTERVAL_MS);
