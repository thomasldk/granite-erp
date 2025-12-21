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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../prisma"));
class ExchangeRateService {
    /**
     * Fetches the current USD to CAD exchange rate from Frankfurter API.
     */
    static fetchUsdToCad() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log('[ExchangeRate] Fetching from api.frankfurter.app...');
                const response = yield axios_1.default.get('https://api.frankfurter.app/latest?from=USD&to=CAD');
                /* Response format: { rates: { CAD: 1.3794 }, ... } */
                const rate = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.rates) === null || _b === void 0 ? void 0 : _b.CAD;
                if (typeof rate === 'number') {
                    // console.log(`[ExchangeRate] Fetched Rate: ${rate}`);
                    return rate;
                }
                else {
                    throw new Error('Invalid response format from Exchange Rate API');
                }
            }
            catch (error) {
                console.error('[ExchangeRate] Error fetching rate:', error.message);
                throw new Error('Impossible de récupérer le taux de change.');
            }
        });
    }
    /**
     * Fetches rate, updates SystemConfig, and stores history.
     */
    static fetchAndStoreRate() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rate = yield this.fetchUsdToCad();
                // 1. Update System Config
                yield prisma_1.default.systemConfig.upsert({
                    where: { key: 'GLOBAL' },
                    update: { defaultExchangeRate: rate },
                    create: { key: 'GLOBAL', defaultExchangeRate: rate }
                });
                // 2. Store History
                yield prisma_1.default.exchangeRateHistory.create({
                    data: {
                        rate: rate,
                        date: new Date()
                    }
                });
                console.log(`[ExchangeRate] Successfully stored new rate: ${rate}`);
                return rate;
            }
            catch (error) {
                console.error('[ExchangeRate] Failed to fetch and store rate:', error);
                throw error;
            }
        });
    }
    /**
     * Returns the last N history entries.
     */
    static getHistory() {
        return __awaiter(this, arguments, void 0, function* (limit = 30) {
            const history = yield prisma_1.default.exchangeRateHistory.findMany({
                orderBy: { date: 'desc' },
                take: limit
            });
            return history.reverse(); // Return oldest to newest for graph
        });
    }
}
exports.ExchangeRateService = ExchangeRateService;
