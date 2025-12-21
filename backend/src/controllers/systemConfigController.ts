import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();
const CONFIG_KEY = 'GLOBAL';

export const getSystemConfig = async (req: Request, res: Response) => {
    try {
        let config = await prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY }
        });

        if (!config) {
            config = await prisma.systemConfig.create({
                data: {
                    key: CONFIG_KEY,
                    defaultSemiStandardRate: 0.4,
                    defaultSalesCurrency: 'CAD',
                    defaultPalletPrice: 50.0,
                    defaultPalletRequired: false,
                    // V8 Defaults
                    defaultPaymentDays: 30,
                    defaultDepositPercentage: 0,
                    defaultDiscountPercentage: 0,
                    defaultDiscountDays: 10,
                    defaultExchangeRate: 1.0
                }
            });
        }

        res.json(config);
    } catch (error) {
        console.error('Error fetching system config:', error);
        res.status(500).json({ error: 'Failed to fetch system configuration' });
    }
};

export const updateSystemConfig = async (req: Request, res: Response) => {
    try {
        const {
            defaultSemiStandardRate,
            defaultSalesCurrency,
            defaultPalletPrice,
            defaultPalletRequired,
            // V8
            defaultPaymentDays,
            defaultDepositPercentage,
            defaultDiscountPercentage,
            defaultDiscountDays,
            defaultExchangeRate,
            defaultPaymentTermId,
            taxRateTPS, taxRateTVQ, taxRateTVH, taxRateTVH_Maritimes,
            defaultMeasureUnit, defaultValidityDuration
        } = req.body;

        const config = await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {
                defaultSemiStandardRate: parseFloat(defaultSemiStandardRate),
                defaultSalesCurrency,
                defaultPalletPrice: parseFloat(defaultPalletPrice),
                defaultPalletRequired: Boolean(defaultPalletRequired),
                // V8
                defaultPaymentDays: parseInt(defaultPaymentDays),
                defaultDepositPercentage: parseFloat(defaultDepositPercentage),
                defaultDiscountPercentage: parseFloat(defaultDiscountPercentage),
                defaultDiscountDays: parseInt(defaultDiscountDays),
                defaultExchangeRate: parseFloat(defaultExchangeRate),
                defaultPaymentTermId,
                // V8 Tax Rates
                taxRateTPS: parseFloat(taxRateTPS),
                taxRateTVQ: parseFloat(taxRateTVQ),
                taxRateTVH: parseFloat(taxRateTVH),
                taxRateTVH_Maritimes: parseFloat(taxRateTVH_Maritimes),
                defaultMeasureUnit: defaultMeasureUnit || 'an',
                defaultValidityDuration: parseInt(defaultValidityDuration) || 30
            },
            create: {
                key: CONFIG_KEY,
                defaultSemiStandardRate: parseFloat(defaultSemiStandardRate || 0.4),
                defaultSalesCurrency: defaultSalesCurrency || 'CAD',
                defaultPalletPrice: parseFloat(defaultPalletPrice || 50.0),
                defaultPalletRequired: Boolean(defaultPalletRequired),
                // V8
                defaultPaymentDays: parseInt(defaultPaymentDays || 30),
                defaultDepositPercentage: parseFloat(defaultDepositPercentage || 0),
                defaultDiscountPercentage: parseFloat(defaultDiscountPercentage || 0),
                defaultDiscountDays: parseInt(defaultDiscountDays || 0),
                defaultExchangeRate: parseFloat(defaultExchangeRate || 1.35),
                defaultPaymentTermId,
                // V8 Tax Rates
                taxRateTPS: parseFloat(taxRateTPS || 5.0),
                taxRateTVQ: parseFloat(taxRateTVQ || 9.975),
                taxRateTVH: parseFloat(taxRateTVH || 13.0),
                taxRateTVH_Maritimes: parseFloat(taxRateTVH_Maritimes || 15.0),
                defaultMeasureUnit: defaultMeasureUnit || 'an',
                defaultValidityDuration: parseInt(defaultValidityDuration) || 30
            }
        });

        res.json(config);
    } catch (error) {
        console.error('Error updating system config:', error);
        res.status(500).json({ error: 'Failed to update system configuration' });
    }
};

import { ExchangeRateService } from '../services/exchangeRateService';

export const refreshExchangeRate = async (req: Request, res: Response) => {
    try {
        console.log('[SystemConfig] Refreshing Exchange Rate...');
        const rate = await ExchangeRateService.fetchAndStoreRate();

        res.json({ message: 'Taux de change mis à jour', rate });

    } catch (error: any) {
        console.error('refreshExchangeRate Error:', error);
        res.status(500).json({ error: 'Failed to refresh exchange rate', details: error.message });
    }
};

export const getExchangeRateHistory = async (req: Request, res: Response) => {
    try {
        // limit could be query param
        const history = await ExchangeRateService.getHistory(30);
        res.json(history);
    } catch (error: any) {
        console.error('getExchangeRateHistory Error:', error);
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
};
