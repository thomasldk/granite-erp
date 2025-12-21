"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// System Settings
router.get('/system', settingsController_1.getSystemSettings);
router.put('/system', settingsController_1.updateSystemSettings);
// Languages
router.get('/languages', settingsController_1.getLanguages);
router.post('/languages', settingsController_1.createLanguage);
router.delete('/languages/:id', settingsController_1.deleteLanguage);
// Currencies
router.get('/currencies', settingsController_1.getCurrencies);
router.post('/currencies', settingsController_1.createCurrency);
router.delete('/currencies/:id', settingsController_1.deleteCurrency);
// Backup
router.get('/backup', settingsController_1.downloadBackup);
router.post('/backup/trigger', settingsController_1.triggerManualBackup);
exports.default = router;
