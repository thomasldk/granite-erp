/* AGENT V20 - DEBUG CLEANUP */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
const AGENT_VERSION = "V20 - DEBUG CLEANUP";
const API_BASE = 'http://192.168.3.68:5006/api';
const TEST_AUTO_REPLY = false;

// PATHS
const PENDING_DIR = 'C:\\GraniteAgent\\pending';
const LOTUS_ECHANGE_DIR = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange';

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

    const actionMatch = rakContent.match(/action\s*=\s*['"](.*?)['"]/i);
    const action = actionMatch ? actionMatch[1].toLowerCase() : '';

    const targetPathMatch = rakContent.match(/cible\s*=\s*['"](.*?)['"]/i);
    let targetPath = targetPathMatch ? targetPathMatch[1] : null;

    const sourcePathMatch = rakContent.match(/modele\s*=\s*['"](.*?)['"]/i);
    let sourcePath = sourcePathMatch ? sourcePathMatch[1] : null;

    const quoteIdMatch = rakContent.match(/quoteId\s*=\s*['"](.*?)['"]/i);
    let quoteId = quoteIdMatch ? quoteIdMatch[1] : filename.split('_')[0];

    // Added dirpdf extraction
    const dirPdfMatch = rakContent.match(/dirpdf\s*=\s*['"](.*?)['"]/i);
    let dirPdf = dirPdfMatch ? dirPdfMatch[1] : 'F:\\nxerp\\pdf';

    console.log(`🧐 ACTION: ${action} | Target: ${targetPath}`);

    // --- LOGIC PER ACTION ---

    // ACTION: DEVISPDF
    // REVERTED LOGIC (Protection Mode):
    // cible = DEST FILE (F:\pdf\File.xlsx) -> targetPath
    // modele = SOURCE FILE (F:\nxerp\Project\File.xlsx) -> sourcePath

    if (action === 'devispdf' && sourcePath) {
        console.log(`📄 PDF GENERATION DETECTED`);
        console.log(`   Source Excel (Modele): ${sourcePath}`);
        console.log(`   PDF Folder: ${dirPdf}`);

        try {
            // Construct Destination Path
            // We copy FROM sourcePath TO dirPdf
            const excelFilename = path.basename(sourcePath);
            const cleanDirPdf = dirPdf.replace(/\\$/, '');
            const destExcelPath = path.join(cleanDirPdf, excelFilename);

            console.log(`   📥 Destination Path: ${destExcelPath}`);

            // Ensure source exists
            if (fs.existsSync(sourcePath)) {
                // Ensure dest dir exists
                if (!fs.existsSync(cleanDirPdf)) {
                    try { fs.mkdirSync(cleanDirPdf, { recursive: true }); } catch (e) { console.error("Could not create PDF dir", e.message) }
                }

                // --- STEP 1: JUST COPY (Overwrite if exists) ---

                // --- STEP 2: COPY SOURCE -> TARGET (FRESH COPY) ---
                fs.copyFileSync(sourcePath, destExcelPath);
                console.log(`   ✅ Pre-Copy Success: File copied to ${destExcelPath}`);

                console.log(`   ⛔ DEBUG MODE: STOPPING AFTER COPY. AUTOMATE NOT TRIGGERED.`);
                return; // <--- STOP HERE FOR VALIDATION

            } else {
                console.error(`   ❌ Source Excel NOT FOUND: ${sourcePath}`);
            }

        } catch (err) {
            console.error(`   ❌ Pre-Copy Failed: ${err.message}`);
        }
    }


    // FIX FOR REVISION: The XML 'modele' points to the NEW file (Target). 
    // We must construct the SOURCE path for the copy using 'ancienNom' (which is now just the REFERENCE).
    if (action === 'reviser') {
        const ancienNomMatch = rakContent.match(/ancienNom\s*=\s*['"](.*?)['"]/i);
        const ancienRef = ancienNomMatch ? ancienNomMatch[1] : null;

        if (targetPath && ancienRef) {
            const dir = path.dirname(targetPath);
            // Search for file starting with ancienRef in the directory
            if (fs.existsSync(dir)) {
                try {
                    const files = fs.readdirSync(dir);
                    const foundSource = files.find(f => f.startsWith(ancienRef) && f.toLowerCase().endsWith('.xlsx'));

                    if (foundSource) {
                        sourcePath = path.join(dir, foundSource);
                        console.log(`🔄 REVISION FIX: Found source file by ref '${ancienRef}': ${sourcePath}`);
                    } else {
                        console.warn(`⚠️ REVISION WARNING: Could not find any .xlsx file starting with '${ancienRef}' in ${dir}`);
                        // Fallback: try blindly assuming it's a filename just in case
                        sourcePath = path.join(dir, ancienRef);
                    }
                } catch (e) {
                    console.error(`❌ REVISION ERROR: Failed to list dir ${dir}: ${e.message}`);
                }
            } else {
                console.warn(`⚠️ REVISION WARNING: Directory ${dir} does not exist.`);
            }
        }
    }

    if (action === 'recopier' || action === 'reviser') {
        // --- DUPLICATION / REVISION (Local Copy on F:) ---
        console.log(`🐑 RECOPIE/REVISION DETECTED`);
        if (sourcePath && targetPath) {
            console.log(`📂 Copying Local File:`);
            console.log(`   Src: ${sourcePath}`);
            console.log(`   Dst: ${targetPath}`);

            try {
                // Ensure Dst Directory exists
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`✅ Local Copy Success!`);
                } else {
                    console.error(`❌ Source file missing on PC: ${sourcePath}`);
                    // Continue anyway, maybe Automate can handle it? Or failed.
                }
            } catch (err) {
                console.error(`❌ Local Copy Failed: ${err.message}`);
            }
        }

    } else if (targetPath && quoteId) {
        // --- GENERATE / REINTEGRATE (Download from Mac) ---
        console.log(`📥 Downloading Excel Source from Mac... URL=${API_BASE}/quotes/${quoteId}/download-source-excel`);
        const sourceUrl = `${API_BASE}/quotes/${quoteId}/download-source-excel`;

        try {
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            // Safe Download (V5.12 Logic)
            await downloadFile(sourceUrl, targetPath);
            console.log(`✅ Excel saved to: ${targetPath}`);
        } catch (err) {
            console.error(`❌ Failed to download Excel: ${err.message}`);
            if (fs.existsSync(targetPath)) try { fs.unlinkSync(targetPath); } catch (e) { }
        }
    }

    // --- TRIGGER AUTOMATE ---
    const jobStartTime = Date.now();
    const exchangePath = path.join(LOTUS_ECHANGE_DIR, filename);
    fs.writeFileSync(exchangePath, rakContent);
    console.log(`📨 Trigger Sent to Automate: ${exchangePath}`);

    // --- CLEANUP AGENT QUEUE ---
    await axios.post(`${API_BASE}/quotes/agent/ack-xml`, { filename });

    // --- WAIT FOR RETURN ---
    await waitForReturn(filename, targetPath, jobStartTime);
}

async function waitForReturn(originalRakName, excelPath, jobStartTime) {
    console.log(`⏳ Waiting for return XML for ${originalRakName}...`);
    const startTime = jobStartTime || (Date.now() - 10000);
    const TIMEOUT = 600000; // 10 min
    let foundFile = null;

    while (Date.now() - startTime < TIMEOUT) {
        const files = fs.readdirSync(LOTUS_ECHANGE_DIR);

        // STRICT XML ONLY (Ignore .rak)
        const returnFile = files.find(f =>
            (f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.rac'))
            && f.toLowerCase() !== originalRakName.toLowerCase()
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

        // PAUSE 2s for filesystem stability
        console.log(`⏳ Waiting 2s for file system sync...`);
        await new Promise(r => setTimeout(r, 2000));

        const returnPath = path.join(LOTUS_ECHANGE_DIR, foundFile);

        const form = new FormData();
        form.append('xml', fs.createReadStream(returnPath));

        // Atache Excel
        const normalizedExcelPath = excelPath ? path.resolve(excelPath) : null;

        if (normalizedExcelPath && fs.existsSync(normalizedExcelPath)) {
            console.log(`📎 Attaching Edited Excel: ${normalizedExcelPath}`);
            form.append('excel', fs.createReadStream(normalizedExcelPath));
        } else {
            console.warn(`⚠️ WARNING: Excel file not attached! Path=${normalizedExcelPath}`);
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
        throw err;
    }
}

main();
