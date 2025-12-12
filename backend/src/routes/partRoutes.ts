
import { Router } from 'express';
import {
    getParts,
    getPartById,
    createPart,
    updatePart,
    deletePart
} from '../controllers/partController';

const router = Router();

router.get('/', getParts);
router.get('/:id', getPartById);
router.post('/', createPart);
router.put('/:id', updatePart);
router.delete('/:id', deletePart);

export default router;
