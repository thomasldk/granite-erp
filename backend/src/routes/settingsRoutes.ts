import { Router } from 'express';
import {
    getLanguages, createLanguage, deleteLanguage,
    getCurrencies, createCurrency, deleteCurrency,
    downloadBackup
} from '../controllers/settingsController';

const router = Router();

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

export default router;
