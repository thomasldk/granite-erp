
import { Router } from 'express';
import { getProductionItems } from '../controllers/productionController';

const router = Router();

router.get('/items', getProductionItems);

export default router;
