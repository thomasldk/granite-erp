import { Router } from 'express';
import {
    getLanguages, createLanguage, deleteLanguage,

    getCurrencies, createCurrency, deleteCurrency,
    downloadBackup, triggerManualBackup,
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
router.post('/backup/trigger', triggerManualBackup);

export default router;
