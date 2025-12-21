import { Router } from 'express';
import { getIncoterms, updateIncoterm } from '../controllers/incotermController';

const router = Router();

router.get('/', getIncoterms);
router.put('/:id', updateIncoterm);

export default router;
