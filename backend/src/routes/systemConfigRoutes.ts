import { Router } from 'express';
import { getSystemConfig, updateSystemConfig, refreshExchangeRate, getExchangeRateHistory } from '../controllers/systemConfigController';

const router = Router();

router.get('/', getSystemConfig);
router.put('/', updateSystemConfig);
router.post('/refresh-exchange-rate', refreshExchangeRate);
router.get('/exchange-rate-history', getExchangeRateHistory);

export default router;
