import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

// Languages
export const getLanguages = async (req: Request, res: Response) => {
    try {
        const languages = await prisma.language.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(languages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch languages' });
    }
};

export const createLanguage = async (req: Request, res: Response) => {
    try {
        const { code, name } = req.body;
        const language = await prisma.language.create({
            data: { code, name }
        });
        res.status(201).json(language);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create language' });
    }
};

export const deleteLanguage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.language.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete language' });
    }
};

// Currencies
export const getCurrencies = async (req: Request, res: Response) => {
    try {
        const currencies = await prisma.currency.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(currencies);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch currencies' });
    }
};

export const createCurrency = async (req: Request, res: Response) => {
    try {
        const { code, name, symbol } = req.body;
        const currency = await prisma.currency.create({
            data: { code, name, symbol }
        });
        res.status(201).json(currency);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create currency' });
    }
};

import { BackupService } from '../services/BackupService';

const backupService = new BackupService();

export const deleteCurrency = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.currency.delete({
            where: { id }
        });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete currency' });
    }
};

// Backup
export const downloadBackup = async (req: Request, res: Response) => {
    try {
        const backupData = await backupService.generateBackupJson();
        const jsonContent = JSON.stringify(backupData, null, 2);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `granite_erp_backup_${timestamp}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(jsonContent);

    } catch (error) {
        console.error("Backup Error:", error);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
};

export const triggerManualBackup = async (req: Request, res: Response) => {
    try {
        const filepath = await backupService.performBackupToDisk();
        res.json({ success: true, filepath });
    } catch (error) {
        console.error("Manual Backup Error:", error);
        res.status(500).json({ error: 'Failed to perform manual backup' });
    }
};

export const downloadLatestBackup = async (req: Request, res: Response) => {
    try {
        const filepath = backupService.getLatestBackupPath();

        if (!filepath) {
            return res.status(404).json({ error: 'Aucune sauvegarde trouvée.' });
        }

        const stats = require('fs').statSync(filepath);
        // Rename for download: Granite_ERP_DB_yyyy-mm-dd_hh-mm.json
        const mtime = new Date(stats.mtime);

        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDate = `${mtime.getFullYear()}-${pad(mtime.getMonth() + 1)}-${pad(mtime.getDate())}`;
        const formattedTime = `${pad(mtime.getHours())}-${pad(mtime.getMinutes())}`;
        const downloadName = `Granite_ERP_DB_${formattedDate}_${formattedTime}.json`;

        res.download(filepath, downloadName);

    } catch (error) {
        console.error("Download Latest Backup Error:", error);
        res.status(500).json({ error: 'Failed to download latest backup' });
    }
};

// System Settings (Generic Key-Value)
export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = await prisma.setting.findMany();
        // Convert array to object { key: value }
        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSystemSettings = async (req: Request, res: Response) => {
    try {
        const settings = req.body; // Expect { key: value, key2: value2 }

        const promises = Object.entries(settings).map(([key, value]) => {
            return prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });

        await Promise.all(promises);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

import * as fs from 'fs';

export const restoreBackup = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No backup file provided.' });
        }

        const filePath = req.file.path;
        console.log(`♻️  Restoring backup from: ${filePath}`);

        // Read file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(fileContent);

        // Validate basic structure
        if (!jsonData.metadata || !jsonData.data) {
            // cleanup
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Invalid backup format. Missing metadata or data.' });
        }

        // Call Service
        await backupService.restoreBackup(jsonData);

        // Cleanup
        fs.unlinkSync(filePath);

        res.json({ success: true, message: 'Database restored successfully.' });

    } catch (error) {
        console.error("Restore Error:", error);
        // Try cleanup if file exists
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ error: 'Failed to restore backup: ' + (error as Error).message });
    }
};
