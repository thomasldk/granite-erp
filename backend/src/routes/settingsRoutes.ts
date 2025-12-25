import { Router } from 'express';
import {
    getLanguages, createLanguage, deleteLanguage,

    getCurrencies, createCurrency, deleteCurrency,
    downloadBackup, triggerManualBackup, downloadLatestBackup,
    getSystemSettings, updateSystemSettings
} from '../controllers/settingsController';

const router = Router();

// System Settings
router.get('/system', getSystemSettings);
router.put('/system', updateSystemSettings);

// Languages
router.get('/languages', getLanguages);
router.post('/languages', createLanguage);
router.delete('/languages/:id', deleteLanguage);

// Currencies
router.get('/currencies', getCurrencies);
router.post('/currencies', createCurrency);
router.delete('/currencies/:id', deleteCurrency);

// Backup
router.get('/backup', downloadBackup);
router.get('/backup/latest', downloadLatestBackup);
router.post('/backup/trigger', triggerManualBackup);

// Restore Configuration
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { restoreBackup } from '../controllers/settingsController';

const upload = multer({
    dest: path.join(process.cwd(), 'temp_uploads'), // Temp dir
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Ensure temp dir exists
const tempDir = path.join(process.cwd(), 'temp_uploads');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

router.post('/backup/restore', upload.single('backup'), restoreBackup);

export default router;
