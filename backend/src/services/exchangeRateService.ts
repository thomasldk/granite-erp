import axios from 'axios';
import prisma from '../prisma';

export class ExchangeRateService {
    /**
     * Fetches the current USD to CAD exchange rate from Frankfurter API.
     */
    static async fetchUsdToCad(): Promise<number> {
        try {
            console.log('[ExchangeRate] Fetching from api.frankfurter.app...');
            const response = await axios.get('https://api.frankfurter.app/latest?from=USD&to=CAD');
            /* Response format: { rates: { CAD: 1.3794 }, ... } */
            const rate = response.data?.rates?.CAD;
            if (typeof rate === 'number') {
                // console.log(`[ExchangeRate] Fetched Rate: ${rate}`);
                return rate;
            } else {
                throw new Error('Invalid response format from Exchange Rate API');
            }
        } catch (error: any) {
            console.error('[ExchangeRate] Error fetching rate:', error.message);
            throw new Error('Impossible de récupérer le taux de change.');
        }
    }

    /**
     * Fetches rate, updates SystemConfig, and stores history.
     */
    static async fetchAndStoreRate() {
        try {
            const rate = await this.fetchUsdToCad();

            // 1. Update System Config
            await prisma.systemConfig.upsert({
                where: { key: 'GLOBAL' },
                update: { defaultExchangeRate: rate },
                create: { key: 'GLOBAL', defaultExchangeRate: rate }
            });

            // 2. Store History
            await prisma.exchangeRateHistory.create({
                data: {
                    rate: rate,
                    date: new Date()
                }
            });

            console.log(`[ExchangeRate] Successfully stored new rate: ${rate}`);
            return rate;
        } catch (error) {
            console.error('[ExchangeRate] Failed to fetch and store rate:', error);
            throw error;
        }
    }

    /**
     * Returns the last N history entries.
     */
    static async getHistory(limit = 30) {
        const history = await prisma.exchangeRateHistory.findMany({
            orderBy: { date: 'desc' },
            take: limit
        });
        return history.reverse(); // Return oldest to newest for graph
    }
}
