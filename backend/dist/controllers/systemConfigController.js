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
exports.updateSystemConfig = exports.getSystemConfig = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CONFIG_KEY = 'GLOBAL';
const getSystemConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let config = yield prisma.systemConfig.findUnique({
            where: { key: CONFIG_KEY }
        });
        if (!config) {
            config = yield prisma.systemConfig.create({
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
    }
    catch (error) {
        console.error('Error fetching system config:', error);
        res.status(500).json({ error: 'Failed to fetch system configuration' });
    }
});
exports.getSystemConfig = getSystemConfig;
const updateSystemConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { defaultSemiStandardRate, defaultSalesCurrency, defaultPalletPrice, defaultPalletRequired, 
        // V8
        defaultPaymentDays, defaultDepositPercentage, defaultDiscountPercentage, defaultDiscountDays, defaultExchangeRate, defaultPaymentTermId, taxRateTPS, taxRateTVQ, taxRateTVH, taxRateTVH_Maritimes, defaultMeasureUnit, defaultValidityDuration } = req.body;
        const config = yield prisma.systemConfig.upsert({
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
    }
    catch (error) {
        console.error('Error updating system config:', error);
        res.status(500).json({ error: 'Failed to update system configuration' });
    }
});
exports.updateSystemConfig = updateSystemConfig;
