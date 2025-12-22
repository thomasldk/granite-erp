
import fs from 'fs';
import path from 'path';

const backupPath = path.join(__dirname, 'backups', 'backup_2025-12-20T16-02-55-103Z.json');
const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
console.log("Keys in backup:", Object.keys(data));
