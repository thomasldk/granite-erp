const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { exec } = require('child_process');

// --- CONFIGURATION ---
const AGENT_VERSION = "V5.4 - AUTO-REPLY MODE";
// Automatically detect if we are on the Mac (dev) or PC (prod) to adjust base URL
// But user rule says explicit IP.
const API_BASE = 'http://192.168.3.68:5006/api'; // IP VPN MAC
const TEST_AUTO_REPLY = true; // ⬅️ METTRE SUR FALSE EN PROD

// PATHS
const PENDING_DIR = 'C:\\GraniteAgent\\pending';
const LOTUS_ECHANGE_DIR = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange'; // ✅ CORRECT PATH
const F_DRIVE_ROOT = 'F:\\nxerp';

// Ensure local directories exist
if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });

// Check LOTUS directory
if (!fs.existsSync(LOTUS_ECHANGE_DIR)) {
    console.warn(`⚠️ ATTENTION: Le dossier ${LOTUS_ECHANGE_DIR} n'existe pas !`);
    console.warn(`   ➜ Je le crée pour éviter le crash, mais vérifiez que l'Automate regarde bien ici.`);
    try {
        fs.mkdirSync(LOTUS_ECHANGE_DIR, { recursive: true });
    } catch (e) {
        console.error(`❌ Impossible de créer le dossier Echange: ${e.message}`);
    }
}

console.log(`🚀 AGENT ${AGENT_VERSION} DÉMARRÉ !`);
console.log(`👀 CIBLE : ${API_BASE}`);
console.log(`📂 ECHANGE : ${LOTUS_ECHANGE_DIR}`);
console.log(`💾 STOCKAGE : ${F_DRIVE_ROOT}`);

// --- MAIN LOOP ---
async function main() {
    while (true) {
        try {
            await checkPendingJobs();
        } catch (error) {
            console.error("❌ Error in main loop:", error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    }
}

async function checkPendingJobs() {
    // 1. Get Pending XMLs from API
    try {
        const res = await axios.get(`${API_BASE}/quotes/agent/pending-xml`);
        const files = res.data;

        if (files && files.length > 0) {
            console.log(`⚡ Found ${files.length} pending jobs.`);
            for (const item of files) {
                // Fix: API returns { filename: "..." } but logic assumed string
                const filename = typeof item === 'string' ? item : item.filename;
                if (filename) await processJob(filename);
            }
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            process.stdout.write('.'); // Heartbeat
        } else {
            console.error(`⚠️ Check Error: ${error.message}`);
        }
    }
}

async function processJob(filename) {
    console.log(`\n📦 Processing Job: ${filename}`);

    // A. Download RAK content
    const rakUrl = `${API_BASE}/quotes/agent/pending-xml/${filename}`;
    const rakPath = path.join(PENDING_DIR, filename);
    await downloadFile(rakUrl, rakPath);

    // B. Read RAK to understand action
    const rakContent = fs.readFileSync(rakPath, 'utf-8');

    // DEBUG: Show first 300 chars to check format
    console.log(`🔍 DEBUG RAK CONTENT:\n${rakContent.substring(0, 300)}\n-------------------`);

    // Robust Regex (Allow spaces)
    const isReintegration = /action\s*=\s*['"]reintegrer['"]/i.test(rakContent);
    const targetPathMatch = rakContent.match(/cible\s*=\s*['"](.*?)['"]/i);
    const targetPath = targetPathMatch ? targetPathMatch[1] : null;

    console.log(`🧐 DEBUG PARSING: IsReint=${isReintegration}, Target=${targetPath}`);

    if (isReintegration && targetPath) {
        console.log(`🔄 REINTEGRATION DETECTED -> Target: ${targetPath}`);

        // 1. Download Source Excel from Mac
        // We assume the filename contains the ID or the API can resolve it.
        // Actually, for Reintegration, backend saved the RAK as `{id}_REINT.rak`.
        const quoteId = filename.split('_')[0];
        console.log(`🆔 Quote ID: ${quoteId}`);

        const sourceUrl = `${API_BASE}/quotes/${quoteId}/download-result`;
        console.log(`📥 Downloading Excel Source from: ${sourceUrl}`);

        try {
            // Ensure target directory exists on F:
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            await downloadFile(sourceUrl, targetPath);
            console.log(`✅ Excel saved to: ${targetPath}`);

        } catch (err) {
            console.error(`❌ Failed to download source Excel: ${err.message}`);
            return; // Abort
        }
    }

    // C. Write RAK to Exchange (Universal Trigger)
    // This triggers the Automate
    // Capture start time BEFORE creating files to avoid race condition in detection
    const jobStartTime = Date.now();

    const exchangePath = path.join(LOTUS_ECHANGE_DIR, filename);
    fs.writeFileSync(exchangePath, rakContent);
    console.log(`📨 Trigger Sent to Automate: ${exchangePath}`);

    // --- AUTO-REPLY SIMULATION (DEV MODE) ---
    if (TEST_AUTO_REPLY) {
        console.log("🤖 [TEST MODE] Simulating Automate response in 3s...");
        await new Promise(r => setTimeout(r, 3000));

        // Fix: Automate returns SAME name but .xml extension
        const returnFilename = filename.replace(/\.rak$/i, '.xml');
        const returnPath = path.join(LOTUS_ECHANGE_DIR, returnFilename);

        // Basic Dummy XML
        const dummyXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<generation><devis><externe>
<ligne No="1" Ref="Simulated Item" Description="Generated by Agent V5.4" QTY="1" Prix="100.00" Total="100.00" />
</externe></devis></generation>`;

        fs.writeFileSync(returnPath, dummyXml);
        console.log(`🤖 [TEST MODE] Created Fake Return: ${returnFilename}`);
    }
    // ----------------------------------------

    // D. Ack to API (remove from pending queue)
    await axios.post(`${API_BASE}/quotes/agent/ack-xml`, { filename });

    // E. Wait for Return (The Loop)
    // Fix: We must pass the time BEFORE we created the trigger/fake return
    await waitForReturn(filename, targetPath, jobStartTime);
}

async function waitForReturn(originalRakName, excelPath, jobStartTime) {
    console.log(`⏳ Waiting for return XML for ${originalRakName}...`);

    // We guess the return name. 
    // Usually Automate returns default names or based on date.
    // BUT User strategy: "Watch for ANY Xml ending in .rac or .xml" in exchange dir that is NEW?
    // User strategy refined: "Agent awaits only the return XML."

    // We look for a file that matches the pattern or just ANY new XML?
    // Let's look for *rac.xml or *rak.xml corresponding to our job.
    // NOTE: Automate often renames output.

    // SAFE STRATEGY: Look for ANY .xml or .rac file created AFTER now in echange dir?
    // Or specific name if known.
    // Given previous interactions, Automate produces a result file.

    // Use passed time or default to 10s ago (safe buffer)
    const startTime = jobStartTime || (Date.now() - 10000);
    const TIMEOUT = 300000; // 5 min
    let foundFile = null;

    while (Date.now() - startTime < TIMEOUT) { // 5 min timeout
        const files = fs.readdirSync(LOTUS_ECHANGE_DIR);
        // Filter for XML/RAC
        const returnFile = files.find(f =>
            (f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.rac') || f.toLowerCase().endsWith('.rak'))
            && f !== originalRakName // Don't pick up the trigger
            && fs.statSync(path.join(LOTUS_ECHANGE_DIR, f)).mtimeMs > startTime // Modified after trigger
        );

        if (returnFile) {
            foundFile = returnFile;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (foundFile) {
        console.log(`🏁 Found Return File: ${foundFile}`);

        // USER REQUEST: Wait 2s to ensure Excel close/unlock/sync
        console.log(`⏳ Waiting 2s for file system sync...`);
        await new Promise(r => setTimeout(r, 2000));

        const returnPath = path.join(LOTUS_ECHANGE_DIR, foundFile);

        // F. Bundle and Send Back
        const form = new FormData();
        form.append('xml', fs.createReadStream(returnPath));

        // Normalize path (handle f: vs F:)
        const normalizedExcelPath = excelPath ? path.resolve(excelPath) : null;

        if (normalizedExcelPath && fs.existsSync(normalizedExcelPath)) {
            console.log(`📎 Attaching Edited Excel: ${normalizedExcelPath}`);
            form.append('excel', fs.createReadStream(normalizedExcelPath));
        } else {
            console.warn(`⚠️ WARNING: Excel file not attached! Path=${normalizedExcelPath}, Exists=${fs.existsSync(normalizedExcelPath || '')}`);
        }

        try {
            console.log(`🚀 Uploading Bundle to Mac...`);
            const upRes = await axios.post(`${API_BASE}/quotes/agent/upload-bundle`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (upRes.status === 200) {
                console.log(`✅ Upload Success!`);
                try {
                    fs.unlinkSync(returnPath);
                    console.log(`🗑️ Deleted Return XML: ${returnPath}`);
                } catch (e) {
                    console.error(`⚠️ Failed to delete XML: ${e.message}`);
                }
            }
        } catch (err) {
            console.error(`❌ Upload Failed: ${err.message}`);
        }
    } else {
        console.error("❌ Timeout waiting for Automate return.");
    }
}

async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

main();
