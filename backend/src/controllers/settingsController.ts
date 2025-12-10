import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
