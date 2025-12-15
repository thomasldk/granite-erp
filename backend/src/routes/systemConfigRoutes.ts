import { Router } from 'express';
import { getSystemConfig, updateSystemConfig } from '../controllers/systemConfigController';

const router = Router();

router.get('/', getSystemConfig);
router.put('/', updateSystemConfig);

export default router;
