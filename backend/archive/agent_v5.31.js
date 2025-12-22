/* AGENT V5.31 - TUNNEL MODE (CLOUDFLARE) */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
// --- CONFIGURATION ---
const AGENT_VERSION = "V5.31 - TUNNEL MODE (CLOUDFLARE)";
// const API_BASE = 'http://192.168.68.54:5006/api'; // LOCAL IP (FAILED)
const API_BASE = 'https://threshold-believes-reasonably-spelling.trycloudflare.com/api'; // ✅ TUNNEL URL (BYPASS FIREWALL)
const API_KEY = 'GRANITE_AGENT_KEY_V527_SECURE'; // Added for Auth
axios.defaults.headers.common['x-api-key'] = API_KEY; // Apply to all requests

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
    // FIX: Strip extension regarding fallback
    let quoteId = quoteIdMatch ? quoteIdMatch[1] : filename.replace(/\.(rak|xml)$/i, '').split('_')[0];
    // Added dirpdf extraction
    const dirPdfMatch = rakContent.match(/dirpdf\s*=\s*['"](.*?)['"]/i);
    let dirPdf = dirPdfMatch ? dirPdfMatch[1] : 'F:\\nxerppdf';
    console.log(`🧐 ACTION: ${action} | Target: ${targetPath}`);
    // --- LOGIC PER ACTION ---
    // ACTION: DEVISPDF
    if (action === 'devispdf' && sourcePath) {
        console.log(`📄 PDF GENERATION DETECTED`);
        console.log(`   Source Excel (Modele): ${sourcePath}`);
        console.log(`   PDF Folder: ${dirPdf}`);
        // SAFEGUARD: We do NOT rely on Agent copying the Excel. Automate handles it.
        // And crucially, we do NOT trigger the generic "Download from Mac" block below.
        try {
            // Clean up old PDF if exists?
            // Actually Automate overwrites.
            console.log(`   ℹ️ Ready for Automate.`);
        } catch (err) {
            console.error(`   ❌ PDF Prep Failed: ${err.message}`);
        }
    }
    // FIX FOR REVISION
    if (action === 'reviser') {
        const ancienNomMatch = rakContent.match(/ancienNom\s*=\s*['"](.*?)['"]/i);
        const ancienRef = ancienNomMatch ? ancienNomMatch[1] : null;
        if (targetPath && ancienRef) {
            const dir = path.dirname(targetPath);
            if (fs.existsSync(dir)) {
                try {
                    const files = fs.readdirSync(dir);
                    const foundSource = files.find(f => f.startsWith(ancienRef) && f.toLowerCase().endsWith('.xlsx'));
                    if (foundSource) {
                        sourcePath = path.join(dir, foundSource);
                        console.log(`🔄 REVISION FIX: Found source file by ref '${ancienRef}': ${sourcePath}`);
                    } else {
                        console.warn(`⚠️ REVISION WARNING: Could not find any .xlsx file starting with '${ancienRef}' in ${dir}`);
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
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
                if (fs.existsSync(sourcePath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    console.log(`✅ Local Copy Success!`);
                } else {
                    console.error(`❌ Source file missing on PC: ${sourcePath}`);
                }
            } catch (err) {
                console.error(`❌ Local Copy Failed: ${err.message}`);
            }
        }
    } else if (targetPath && quoteId && action !== 'devispdf') {
        // --- GENERATE / REINTEGRATE (Download from Mac) ---
        // CRITICAL FIX: EXCLUDE 'devispdf' TO PREVENT OVERWRITE/DELETION
        console.log(`📥 Downloading Excel Source from Server... URL=${API_BASE}/quotes/${quoteId}/download-source-excel`);
        const sourceUrl = `${API_BASE}/quotes/${quoteId}/download-source-excel`;
        try {
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            await downloadFile(sourceUrl, targetPath);
            console.log(`✅ Excel saved to: ${targetPath}`);
        } catch (err) {
            console.error(`❌ Failed to download Excel: ${err.message}`);
            // CRITICAL: THIS WAS DELETING THE FILE IF DOWNLOAD FLAGGED ERROR
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
    await waitForReturn(filename, targetPath, jobStartTime, action, dirPdf);
}
async function waitForReturn(originalRakName, excelPath, jobStartTime, action = '', dirPdf = '') {
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
        console.log(`⏳ Waiting 2s for file system sync...`);
        await new Promise(r => setTimeout(r, 2000));
        const returnPath = path.join(LOTUS_ECHANGE_DIR, foundFile);
        const form = new FormData();
        form.append('xml', fs.createReadStream(returnPath));
        // HANDLE PDF UPLOAD
        if (action === 'devispdf') {
            // PROBLEM: Automate generates PDF with SAME NAME as Excel.
            // But RAK name is often short (Ref.rak).
            // So foundFile is Ref.xml.
            // If we replace .xml -> .pdf, we look for Ref.pdf.
            // BUT REAL FILE is Ref_Long_Name.pdf.
            let pdfFilename = foundFile.replace(/\.xml$/i, '.pdf'); // Fallback default
            // INTELLIGENT FIX: PEEK AT EXCEL NAME
            // excelPath is the 'cible' (Target) from the RAK, which is the Full Excel Path.
            // Automate always names PDF = Excel Name.
            if (excelPath) {
                const excelName = path.basename(excelPath);
                pdfFilename = excelName.replace(/\.xlsx$/i, '.pdf');
                console.log(`🎯 Target PDF Name derived from Excel: ${pdfFilename}`);
            }
            // LOGIC: PDF is in the same folder as the Project Excel (F:\nxerp\Project\...)
            // We use path.dirname(excelPath) which is the Project Folder
            let pdfPath = '';
            if (excelPath) {
                const projectDir = path.dirname(excelPath);
                pdfPath = path.join(projectDir, pdfFilename);
                console.log(`🔎 Looking for PDF in Project Dir: ${pdfPath}`);
            }
            // Fallback: Check dirPdf
            if (!fs.existsSync(pdfPath)) {
                const cleanDirPdf = dirPdf ? dirPdf.replace(/\\$/, '') : 'F:\\nxerppdf';
                const fallbackPath = path.join(cleanDirPdf, pdfFilename); // Short name
                if (fs.existsSync(fallbackPath)) {
                    pdfPath = fallbackPath;
                    console.log(`🔎 Found PDF in Fallback Dir: ${pdfPath}`);
                }
            }

            // SMART WAIT: Poll for PDF (Max 15s)
            // Automate might write XML first, then PDF takes a few seconds.
            let pdfFound = false;
            if (pdfPath && path.extname(pdfPath).toLowerCase() === '.pdf') {
                console.log(`⏳ Waiting for PDF to appear at: ${pdfPath}`);
                for (let i = 0; i < 15; i++) {
                    if (fs.existsSync(pdfPath)) {
                        pdfFound = true;
                        // Wait 1s extra to ensure write complete
                        await new Promise(r => setTimeout(r, 1000));
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (pdfFound) {
                console.log(`📎 Attaching Generated PDF: ${pdfPath}`);
                form.append('pdf', fs.createReadStream(pdfPath));
            } else {
                console.error(`❌ PDF NOT FOUND (after 15s wait) at ${pdfPath}`);
            }
        } else {
            // STANDARD EXCEL UPLOAD
            const normalizedExcelPath = excelPath ? path.resolve(excelPath) : null;
            if (normalizedExcelPath && fs.existsSync(normalizedExcelPath)) {
                console.log(`📎 Attaching Edited Excel: ${normalizedExcelPath}`);
                form.append('excel', fs.createReadStream(normalizedExcelPath));
            } else {
                console.warn(`⚠️ WARNING: Excel file not attached! Path=${normalizedExcelPath}`);
            }
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
