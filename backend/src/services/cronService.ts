
import cron from 'node-cron';
import { ExchangeRateService } from './exchangeRateService';

export const startCronJobs = () => {
    console.log('[Cron] Initializing cron jobs...');

    // Runs every day at 10:00 AM
    // Cron format: Minute Hour Day Month DayOfWeek
    cron.schedule('0 10 * * *', async () => {
        console.log('[Cron] Running daily exchange rate update...');
        try {
            await ExchangeRateService.fetchAndStoreRate();
        } catch (error) {
            console.error('[Cron] Exchange rate update failed:', error);
        }
    });

    console.log('[Cron] Jobs scheduled: Daily Exchange Rate Update (10:00 AM)');
};
