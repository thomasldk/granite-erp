/* AGENT V33 - TUNNEL MODE (MAC LOCAL) - LOCAL_TUNNEL_URL */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// --- CONFIGURATION ---
const AGENT_VERSION = "V33 - MAC TUNNEL & DELIVERY NOTE PDF FIX";
const API_BASE = 'https://erp.granitedrc.info/api'; // ✅ CLOUDFLARE TUNNEL (Stable)
const API_KEY = 'GRANITE_AGENT_KEY_V527_SECURE';

axios.defaults.headers.common['x-api-key'] = API_KEY;
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true'; // For Loca.lt

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
console.log(`🔗 CIBLES: ${API_BASE}`);
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

    // Download RAK
    await downloadFile(rakUrl, rakPath);
    const rakContent = fs.readFileSync(rakPath, 'utf-8');

    // DEBUG RAK
    console.log(`🔍 DEBUG RAK CONTENT:\n${rakContent.substring(0, 300)}\n-------------------`);

    // PARSE ATTRIBUTES
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
    }

    // FIX FOR REVISION (Find source if not explicit)
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
    }
    else if (targetPath && quoteId && action !== 'devispdf' && action !== 'générationbl' && action !== 'generationbl') {
        // --- GENERATE / REINTEGRATE (Download from Mac) ---
        // CRITICAL FIX: EXCLUDE 'devispdf' AND 'BL' TO PREVENT OVERWRITE/DELETION
        // BL Logic: Agent does not need to download Excel source from Mac, Automate creates it from RAK.

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


        // HANDLE PDF UPLOAD (Legacy + BL)
        // Includes: devispdf, générationbl, generationbl
        if (action === 'devispdf' || action === 'générationbl' || action === 'generationbl') {

            // PATH NORMALIZATION FOR EXCEL (Fix "INC." vs "INC")
            if (excelPath && !fs.existsSync(excelPath)) {
                const projectDir = path.dirname(excelPath);
                const excelName = path.basename(excelPath);
                const checkParent = path.dirname(projectDir);
                const checkFolder = path.basename(projectDir);

                if (checkFolder.endsWith('.')) {
                    const cleanFolder = checkFolder.slice(0, -1);
                    const newPath = path.join(checkParent, cleanFolder, excelName);
                    if (fs.existsSync(newPath)) {
                        console.log(`✅ Normalized Excel Path: ${newPath}`);
                        excelPath = newPath;
                    }
                }
            }

            // PROBLEM: Automate generates PDF with SAME NAME as Excel.
            // But RAK name is often short (Ref.rak).
            // So foundFile is Ref.xml.

            let pdfFilename = foundFile.replace(/\.xml$/i, '.pdf'); // Fallback default

            // INTELLIGENT FIX: PEEK AT EXCEL NAME
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

                // PATH NORMALIZATION FIX (Handle "INC." vs "INC")
                if (!fs.existsSync(projectDir)) {
                    // Try removing trailing dot from folder name
                    const parentDir = path.dirname(projectDir);
                    const folderName = path.basename(projectDir);
                    if (folderName.endsWith('.')) {
                        const cleanFolderName = folderName.slice(0, -1); // Remove dot
                        const newProjectDir = path.join(parentDir, cleanFolderName);
                        console.log(`⚠️ Folder not found. Trying normalized path: ${newProjectDir}`);
                        if (fs.existsSync(newProjectDir)) {
                            pdfPath = path.join(newProjectDir, pdfFilename);
                            console.log(`✅ Found normalized dir! New PDF Path: ${pdfPath}`);
                        }
                    }
                }
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
            let pdfFound = false;
            // Only try if we have a path
            if (pdfPath) {
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

            // CRITICAL FIX: ALWAYS ATTACH THE EXCEL FILE TOO!
            if (excelPath && fs.existsSync(excelPath)) {
                console.log(`📎 Attaching Excel Source: ${excelPath}`);
                form.append('excel', fs.createReadStream(excelPath));
            } else {
                console.warn(`⚠️ Excel file not found for upload: ${excelPath}`);
            }


        } else {
            // STANDARD EXCEL UPLOAD (Not BL/PDF)
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
