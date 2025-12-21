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
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const exchangeRateService_1 = require("./exchangeRateService");
const startCronJobs = () => {
    console.log('[Cron] Initializing cron jobs...');
    // Runs every day at 10:00 AM
    // Cron format: Minute Hour Day Month DayOfWeek
    node_cron_1.default.schedule('0 10 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[Cron] Running daily exchange rate update...');
        try {
            yield exchangeRateService_1.ExchangeRateService.fetchAndStoreRate();
        }
        catch (error) {
            console.error('[Cron] Exchange rate update failed:', error);
        }
    }));
    console.log('[Cron] Jobs scheduled: Daily Exchange Rate Update (10:00 AM)');
};
exports.startCronJobs = startCronJobs;
