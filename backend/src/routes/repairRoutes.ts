import { Router } from 'express';
import {
    getRepairs,
    getRepair,
    createRepair,
    updateRepair,
    deleteRepair
} from '../controllers/repairController';

const router = Router();

router.get('/', getRepairs);
router.get('/:id', getRepair);
router.post('/', createRepair);
router.put('/:id', updateRepair);
router.delete('/:id', deleteRepair);

export default router;
