import { Router } from 'express';
import { getRepresentatives, createRepresentative, updateRepresentative, deleteRepresentative } from '../controllers/representativeController';

const router = Router();

router.get('/', getRepresentatives);
router.post('/', createRepresentative);
router.put('/:id', updateRepresentative);
router.delete('/:id', deleteRepresentative);

export default router;
