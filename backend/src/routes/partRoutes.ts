import { Router } from 'express';
import {
    getParts,
    createPart,
    updatePart,
    deletePart
} from '../controllers/partController';

const router = Router();

router.get('/', getParts);
router.post('/', createPart);
router.put('/:id', updatePart);
router.delete('/:id', deletePart);

export default router;
