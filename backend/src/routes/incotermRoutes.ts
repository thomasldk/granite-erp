import { Router } from 'express';
import { getIncoterms } from '../controllers/incotermController';

const router = Router();

router.get('/', getIncoterms);

export default router;
