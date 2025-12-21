"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSystemSettings = exports.getSystemSettings = exports.triggerManualBackup = exports.downloadBackup = exports.deleteCurrency = exports.createCurrency = exports.getCurrencies = exports.deleteLanguage = exports.createLanguage = exports.getLanguages = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Languages
const getLanguages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const languages = yield prisma.language.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(languages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch languages' });
    }
});
exports.getLanguages = getLanguages;
const createLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, name } = req.body;
        const language = yield prisma.language.create({
            data: { code, name }
        });
        res.status(201).json(language);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create language' });
    }
});
exports.createLanguage = createLanguage;
const deleteLanguage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.language.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete language' });
    }
});
exports.deleteLanguage = deleteLanguage;
// Currencies
const getCurrencies = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currencies = yield prisma.currency.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(currencies);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch currencies' });
    }
});
exports.getCurrencies = getCurrencies;
const createCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, name, symbol } = req.body;
        const currency = yield prisma.currency.create({
            data: { code, name, symbol }
        });
        res.status(201).json(currency);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create currency' });
    }
});
exports.createCurrency = createCurrency;
const BackupService_1 = require("../services/BackupService");
const backupService = new BackupService_1.BackupService();
const deleteCurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.currency.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete currency' });
    }
});
exports.deleteCurrency = deleteCurrency;
// Backup
const downloadBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const backupData = yield backupService.generateBackupJson();
        const jsonContent = JSON.stringify(backupData, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `granite_erp_backup_${timestamp}.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(jsonContent);
    }
    catch (error) {
        console.error("Backup Error:", error);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});
exports.downloadBackup = downloadBackup;
const triggerManualBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filepath = yield backupService.performBackupToDisk();
        res.json({ success: true, filepath });
    }
    catch (error) {
        console.error("Manual Backup Error:", error);
        res.status(500).json({ error: 'Failed to perform manual backup' });
    }
});
exports.triggerManualBackup = triggerManualBackup;
// System Settings (Generic Key-Value)
const getSystemSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = yield prisma.setting.findMany();
        // Convert array to object { key: value }
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});
exports.getSystemSettings = getSystemSettings;
const updateSystemSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const settings = req.body; // Expect { key: value, key2: value2 }
        const promises = Object.entries(settings).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });
        yield Promise.all(promises);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});
exports.updateSystemSettings = updateSystemSettings;
