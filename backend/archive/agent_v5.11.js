const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
const AGENT_VERSION = "V5.11 - DOWNLOAD SOURCE FIX";
const API_BASE = 'http://192.168.3.68:5006/api';
const TEST_AUTO_REPLY = true;

// PATHS
const PENDING_DIR = 'C:\\GraniteAgent\\pending';
const LOTUS_ECHANGE_DIR = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange';
const F_DRIVE_ROOT = 'F:\\nxerp';

// 1. Ensure Local Agent Directories
if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });

// 2. CHECK & CREATE LOTUS DIR
if (!fs.existsSync(LOTUS_ECHANGE_DIR)) {
    try {
        fs.mkdirSync(LOTUS_ECHANGE_DIR, { recursive: true });
        console.log(`✅ Dossier Echange créé: ${LOTUS_ECHANGE_DIR}`);
    } catch (e) {
        console.error(`❌ Erreur création dossier: ${e.message}`);
    }
}

console.log(`🚀 AGENT ${AGENT_VERSION} DÉMARRÉ !`);
console.log(`📂 ECHANGE : ${LOTUS_ECHANGE_DIR}`);

// --- MAIN LOOP ---
async function main() {
    while (true) {
        try {
            await checkPendingJobs();
        } catch (error) {
            console.error("❌ Error in main loop:", error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function checkPendingJobs() {
    try {
        const res = await axios.get(`${API_BASE}/quotes/agent/pending-xml`);
        const files = res.data;

        if (files && files.length > 0) {
            console.log(`⚡ Found ${files.length} pending jobs.`);
            for (const item of files) {
                const filename = typeof item === 'string' ? item : item.filename;
                if (filename) await processJob(filename);
            }
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') process.stdout.write('.');
        else console.error(`⚠️ Check Error: ${error.message}`);
    }
}

async function processJob(filename) {
    if (typeof filename !== 'string') return;
    console.log(`\n📦 Processing Job: ${filename}`);

    const rakUrl = `${API_BASE}/quotes/agent/pending-xml/${filename}`;
    const rakPath = path.join(PENDING_DIR, filename);
    await downloadFile(rakUrl, rakPath);

    const rakContent = fs.readFileSync(rakPath, 'utf-8');

    // DEBUG RAK
    console.log(`🔍 DEBUG RAK CONTENT:\n${rakContent.substring(0, 300)}\n-------------------`);

    const isReintegration = /action\s*=\s*['"]reintegrer['"]/i.test(rakContent);
    const targetPathMatch = rakContent.match(/cible\s*=\s*['"](.*?)['"]/i);
    const targetPath = targetPathMatch ? targetPathMatch[1] : null;

    // FIX V5.10: Extract ID from content NOT filename
    const quoteIdMatch = rakContent.match(/quoteId\s*=\s*['"](.*?)['"]/i);

    let quoteId = quoteIdMatch ? quoteIdMatch[1] : null;
    if (!quoteId) {
        // Fallback: Try to use filename prefix, hoping it's an ID.
        quoteId = filename.split('_')[0];
        console.warn(`⚠️ No quoteId in RAK. Tried extraction from filename: ${quoteId}`);
    } else {
        console.log(`✅ Found Quote ID in RAK: ${quoteId}`);
    }

    console.log(`🧐 DEBUG PARSING: IsReint=${isReintegration}, Target=${targetPath}, ID=${quoteId}`);

    // UNIVERSAL DOWNLOAD
    if (targetPath && quoteId) {
        console.log(`🔄 ACTION DETECTED (Generate/Reint) -> Target: ${targetPath}`);

        // FIX V5.11: Use correct endpoint 'download-source-excel' which doesn't block PENDING status
        const sourceUrl = `${API_BASE}/quotes/${quoteId}/download-source-excel`;

        console.log(`📥 Downloading Excel Source... URL=${sourceUrl}`);
        try {
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            await downloadFile(sourceUrl, targetPath); // Ensure await works
            // Check size?
            const stats = fs.statSync(targetPath);
            if (stats.size < 100) {
                console.warn(`⚠️ WARNING: Downloaded Excel seems too small (${stats.size} bytes). Check connectivity.`);
            } else {
                console.log(`✅ Excel saved to: ${targetPath} (${stats.size} bytes)`);
            }
        } catch (err) {
            console.error(`❌ Failed to download Excel: ${err.message}`);
            // CLEANUP: If download failed, delete the 0KB file so Automate/Excel doesn't choke on it.
            if (fs.existsSync(targetPath)) {
                try { fs.unlinkSync(targetPath); console.log("🧹 Cleaned up 0KB file."); } catch (e) { }
            }

            if (err.response && err.response.status === 404) {
                console.error(`🔍 404 Reason: Server didn't find the source excel for ID ${quoteId}. Check backend uploads.`);
            }
        }
    }

    const jobStartTime = Date.now();
    const exchangePath = path.join(LOTUS_ECHANGE_DIR, filename);
    fs.writeFileSync(exchangePath, rakContent);
    console.log(`📨 Trigger Sent to Automate: ${exchangePath}`);

    // --- AUTO-REPLY SIMULATION ---
    if (TEST_AUTO_REPLY) {
        console.log("🤖 [TEST MODE] Simulating Automate response in 3s...");
        await new Promise(r => setTimeout(r, 3000));

        const returnFilename = filename.replace(/\.rak$/i, '.xml');
        const returnPath = path.join(LOTUS_ECHANGE_DIR, returnFilename);

        const dummyXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<generation><devis><externe>
<ligne No="1" Ref="Simulated V5.11" Description="Success Download Fix" QTY="1" Prix="100.00" Total="100.00" />
</externe></devis></generation>`;

        fs.writeFileSync(returnPath, dummyXml);
        console.log(`🤖 [TEST MODE] Created Fake Return: ${returnFilename}`);
    }
    // -----------------------------

    await axios.post(`${API_BASE}/quotes/agent/ack-xml`, { filename });
    await waitForReturn(filename, targetPath, jobStartTime);
}

async function waitForReturn(originalRakName, excelPath, jobStartTime) {
    console.log(`⏳ Waiting for return XML for ${originalRakName}...`);
    const startTime = jobStartTime || (Date.now() - 10000);
    const TIMEOUT = 300000;
    let foundFile = null;

    while (Date.now() - startTime < TIMEOUT) {
        const files = fs.readdirSync(LOTUS_ECHANGE_DIR);
        const returnFile = files.find(f =>
            (f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.rac') || f.toLowerCase().endsWith('.rak'))
            && f !== originalRakName
            && fs.statSync(path.join(LOTUS_ECHANGE_DIR, f)).mtimeMs > startTime
        );

        if (returnFile) {
            foundFile = returnFile;
            break;
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (foundFile) {
        console.log(`🏁 Found Return File: ${foundFile}`);

        // PAUSE 2s
        console.log(`⏳ Waiting 2s for file system sync...`);
        await new Promise(r => setTimeout(r, 2000));

        const returnPath = path.join(LOTUS_ECHANGE_DIR, foundFile);

        const form = new FormData();
        form.append('xml', fs.createReadStream(returnPath));

        // NORMALISATION
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
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                writer.close();
                reject(err);
            });
        });
    } catch (err) {
        // If Axios fails (404, etc), we never created the file stream, so no 0KB file!
        /* 
           However, if we used createWriteStream BEFORE axios awaiting (as before), 
           it created the file. Now we are safe.
        */
        throw err;
    }
}

main();
