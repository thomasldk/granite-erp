
import { Router } from 'express';
import {
    getPartCategories,
    getPartCategoryById,
    createPartCategory,
    updatePartCategory,
    deletePartCategory
} from '../controllers/partCategoryController';

const router = Router();

router.get('/', getPartCategories);
router.get('/:id', getPartCategoryById);
router.post('/', createPartCategory);
router.put('/:id', updatePartCategory);
router.delete('/:id', deletePartCategory);

export default router;
