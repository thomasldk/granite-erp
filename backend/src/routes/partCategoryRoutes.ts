import { Router } from 'express';
import {
    getPartCategories,
    createPartCategory,
    updatePartCategory,
    deletePartCategory
} from '../controllers/partCategoryController';

const router = Router();

router.get('/', getPartCategories);
router.post('/', createPartCategory);
router.put('/:id', updatePartCategory);
router.delete('/:id', deletePartCategory);

export default router;
