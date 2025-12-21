/* AGENT V5.19 - MODULAR & STABLE */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
const AGENT_VERSION = "V5.19 - MODULAR";
const API_BASE = 'http://192.168.3.68:5006/api';
const PENDING_DIR = 'C:\\GraniteAgent\\pending';
const LOTUS_ECHANGE_DIR = 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange';

// --- INITIALIZATION ---
if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });
if (!fs.existsSync(LOTUS_ECHANGE_DIR)) {
    try { fs.mkdirSync(LOTUS_ECHANGE_DIR, { recursive: true }); }
    catch (e) { console.error(`❌ Init Error: ${e.message}`); }
}
console.log(`🚀 AGENT ${AGENT_VERSION} STARTING...`);
console.log(`📂 EXCHANGE DIR: ${LOTUS_ECHANGE_DIR}`);

// --- MAIN LOOP ---
async function main() {
    while (true) {
        try { await checkPendingJobs(); }
        catch (error) { console.error("❌ Main Loop Error:", error.message); }
        await new Promise(r => setTimeout(r, 5000));
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
        if (error.code !== 'ECONNREFUSED') console.error(`⚠️ Check Error: ${error.message}`);
    }
}

// --- JOB PROCESSOR ---
async function processJob(filename) {
    if (typeof filename !== 'string') return;
    console.log(`\n📦 Processing Job: ${filename}`);

    const rakPath = path.join(PENDING_DIR, filename);
    await downloadFile(`${API_BASE}/quotes/agent/pending-xml/${filename}`, rakPath);

    const rakContent = fs.readFileSync(rakPath, 'utf-8');
    const jobStartTime = Date.now();

    // PARSE XML
    const parse = (key) => {
        const m = rakContent.match(new RegExp(`${key}\\s*=\\s*['"](.*?)['"]`, 'i'));
        return m ? m[1] : null;
    };

    const action = (parse('action') || '').toLowerCase();
    const targetPath = parse('cible'); // Usually the file Automate will process
    const sourcePath = parse('modele'); // Usually the source/template
    const quoteId = parse('quoteId') || filename.split('_')[0];
    const dirPdf = parse('dirpdf') || 'F:\\pdf\\';

    console.log(`🧐 ACTION: ${action} | Cible: ${targetPath} | Modele: ${sourcePath}`);

    // DISPATCHER
    try {
        switch (action) {
            case 'devispdf':
                await handleDevisPdf(filename, rakContent, sourcePath, dirPdf, jobStartTime);
                break;
            case 'reviser':
                await handleRevision(filename, rakContent, targetPath, jobStartTime);
                break;
            case 'recopier':
                await handleRecopie(filename, rakContent, sourcePath, targetPath, jobStartTime);
                break;
            default:
                // Fallback for 'emcot' / Generation (Download from Mac)
                if (targetPath && quoteId) {
                    await handleGeneration(filename, rakContent, targetPath, quoteId, jobStartTime);
                } else {
                    console.warn(`⚠️ Unknown Action: ${action}`);
                }
                break;
        }
    } catch (err) {
        console.error(`❌ Job Failed: ${err.message}`);
    }
}

// --- HANDLERS ---

/**
 * PDF GENERATION HANDLER
 * Protects logic: Copies Source (Modele) -> PDF Dir. 
 * Automate consumes the copy (Cible).
 */
async function handleDevisPdf(filename, rakContent, sourcePath, dirPdf, jobStartTime) {
    console.log(`📄 HANDLER: PDF GENERATION`);

    // 1. PERFORM COPY (Safety)
    if (sourcePath) {
        const excelFilename = path.basename(sourcePath);
        const cleanDirPdf = dirPdf.replace(/\\$/, '');
        const destExcelPath = path.join(cleanDirPdf, excelFilename);

        console.log(`   📥 Copying Source to PDF Dir...`);
        console.log(`   FROM: ${sourcePath}`);
        console.log(`   TO:   ${destExcelPath}`);

        if (fs.existsSync(sourcePath)) {
            if (!fs.existsSync(cleanDirPdf)) fs.mkdirSync(cleanDirPdf, { recursive: true });
            fs.copyFileSync(sourcePath, destExcelPath);
            console.log(`   ✅ Copy Success!`);
        } else {
            console.error(`   ❌ Source Excel Not Found: ${sourcePath}`);
            // We continue, letting Automate potentially fail or use existing
        }
    }

    // 2. TRIGGER AUTOMATE
    await triggerAutomate(filename, rakContent, jobStartTime, null); // No Excel return needed for PDF usually
}

/**
 * REVISION HANDLER
 * Handles 'reviser' logic: Find previous file by ref, copy to new, trigger.
 */
async function handleRevision(filename, rakContent, targetPath, jobStartTime) {
    console.log(`🔄 HANDLER: REVISION`);

    // 1. FIND SOURCE (Previous Revision)
    let determinedSourcePath = null;
    const ancienRef = rakContent.match(/ancienNom\s*=\s*['"](.*?)['"]/i)?.[1];

    if (targetPath && ancienRef) {
        const dir = path.dirname(targetPath);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            const found = files.find(f => f.startsWith(ancienRef) && f.toLowerCase().endsWith('.xlsx'));
            if (found) determinedSourcePath = path.join(dir, found);
            else determinedSourcePath = path.join(dir, ancienRef); // Fallback
            console.log(`   🔍 Found Source: ${determinedSourcePath}`);
        }
    }

    // 2. COPY OLD -> NEW
    if (determinedSourcePath && targetPath) {
        if (fs.existsSync(determinedSourcePath)) {
            const destDir = path.dirname(targetPath);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(determinedSourcePath, targetPath);
            console.log(`   ✅ Revision Copy Success!`);
        } else {
            console.error(`   ❌ Previous Revision Not Found: ${determinedSourcePath}`);
        }
    }

    // 3. TRIGGER AUTOMATE
    await triggerAutomate(filename, rakContent, jobStartTime, targetPath);
}

/**
 * RECOPIE HANDLER
 */
async function handleRecopie(filename, rakContent, sourcePath, targetPath, jobStartTime) {
    console.log(`🐑 HANDLER: RECOPIE`);

    if (sourcePath && targetPath) {
        if (fs.existsSync(sourcePath)) {
            const destDir = path.dirname(targetPath);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`   ✅ Local Copy Success!`);
        } else {
            console.error(`   ❌ Source Not Found: ${sourcePath}`);
        }
    }

    await triggerAutomate(filename, rakContent, jobStartTime, targetPath);
}

/**
 * GENERATION HANDLER (Standard)
 * Download from Mac -> Trigger
 */
async function handleGeneration(filename, rakContent, targetPath, quoteId, jobStartTime) {
    console.log(`📥 HANDLER: GENERATION (Download)`);

    const sourceUrl = `${API_BASE}/quotes/${quoteId}/download-source-excel`;
    console.log(`   Downloading from: ${sourceUrl}`);

    try {
        const destDir = path.dirname(targetPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        await downloadFile(sourceUrl, targetPath);
        console.log(`   ✅ Download Success!`);
    } catch (err) {
        console.error(`   ❌ Download Failed: ${err.message}`);
    }

    await triggerAutomate(filename, rakContent, jobStartTime, targetPath);
}


// --- SHARED HELPERS ---

async function triggerAutomate(filename, content, jobStartTime, excelPathForUpload) {
    const exchangePath = path.join(LOTUS_ECHANGE_DIR, filename);
    fs.writeFileSync(exchangePath, content);
    console.log(`📨 Trigger Sent to Automate: ${exchangePath}`);

    // Ack
    await axios.post(`${API_BASE}/quotes/agent/ack-xml`, { filename }).catch(e => { });

    // Wait Return
    await waitForReturn(filename, excelPathForUpload, jobStartTime);
}

async function waitForReturn(originalRakName, excelPath, jobStartTime) {
    console.log(`⏳ Waiting for return...`);
    const startTime = jobStartTime || (Date.now() - 10000);
    const TIMEOUT = 600000; // 10 min
    let foundFile = null;

    while (Date.now() - startTime < TIMEOUT) {
        const files = fs.readdirSync(LOTUS_ECHANGE_DIR);
        const returnFile = files.find(f =>
            (f.toLowerCase().endsWith('.xml') || f.toLowerCase().endsWith('.rac'))
            && f.toLowerCase() !== originalRakName.toLowerCase()
            && fs.statSync(path.join(LOTUS_ECHANGE_DIR, f)).mtimeMs > startTime
        );

        if (returnFile) { foundFile = returnFile; break; }
        await new Promise(r => setTimeout(r, 2000));
    }

    if (foundFile) {
        console.log(`🏁 Found Return: ${foundFile}`);
        await new Promise(r => setTimeout(r, 2000)); // Pause

        const returnPath = path.join(LOTUS_ECHANGE_DIR, foundFile);
        const form = new FormData();
        form.append('xml', fs.createReadStream(returnPath));

        if (excelPath && fs.existsSync(excelPath)) {
            console.log(`📎 Attaching Excel: ${excelPath}`);
            form.append('excel', fs.createReadStream(excelPath));
        }

        try {
            console.log(`🚀 Uploading...`);
            await axios.post(`${API_BASE}/quotes/agent/upload-bundle`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity, maxBodyLength: Infinity
            });
            console.log(`✅ Upload Success!`);
            try { fs.unlinkSync(returnPath); } catch (e) { }
        } catch (err) {
            console.error(`❌ Upload Failed: ${err.message}`);
        }
    } else {
        console.error("❌ Timeout.");
    }
}

async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({ url, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

main();
