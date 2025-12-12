import { Router } from 'express';
import {
    getContactTypes, createContactType,
    updateContactType,
    deleteContactType
} from '../controllers/contactTypeController';

const router = Router();

router.get('/', getContactTypes);
router.post('/', createContactType);
router.put('/:id', updateContactType);
router.delete('/:id', deleteContactType);

export default router;
