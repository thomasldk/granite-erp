
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('--- DEBUG REVISION LOGIC ---');
console.log(`OS: ${process.platform}`);
console.log(`User Info: ${JSON.stringify(os.userInfo())}`);

// 1. Check Mount Points
const checkPaths = [
    '/Volumes',
    '/Volumes/nxerp',
    '/Volumes/Data',
    '/Volumes/Public',
    'F:\\nxerp' // Just in case weird environment
];

console.log('\n--- CHECKING PATHS ---');
checkPaths.forEach(p => {
    try {
        if (fs.existsSync(p)) {
            console.log(`[OK] Exists: ${p}`);
            if (fs.lstatSync(p).isDirectory()) {
                const files = fs.readdirSync(p);
                console.log(`    Contents (${files.length}): ${files.slice(0, 5).join(', ')}...`);
            }
        } else {
            console.log(`[FAIL] Not Found: ${p}`);
        }
    } catch (e: any) {
        console.log(`[ERROR] Checking ${p}: ${e.message}`);
    }
});

// 2. Test Renaming Logic
console.log('\n--- TESTING RENAMING LOGIC ---');
const oldRef = "DRC25-0001-C0R0";
const refRegex = /C(\d+)R(\d+)/;
const match = oldRef.match(refRegex);

if (match) {
    const cVal = match[1];
    const rVal = parseInt(match[2], 10);
    const newR = rVal + 1;
    const newRef = oldRef.replace(`C${cVal}R${rVal}`, `C${cVal}R${newR}`);
    console.log(`Input:  ${oldRef}`);
    console.log(`Output: ${newRef}`);

    if (newRef === "DRC25-0001-C0R1") {
        console.log("[SUCCESS] Logic matches requirement.");
    } else {
        console.log("[FAIL] Logic mismatch.");
    }
} else {
    console.log(`[FAIL] No match for Regex ${refRegex} on ${oldRef}`);
}
