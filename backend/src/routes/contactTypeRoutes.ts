import { Router } from 'express';
import { getContactTypes, createContactType, deleteContactType } from '../controllers/contactTypeController';

const router = Router();

router.get('/', getContactTypes);
router.post('/', createContactType);
router.delete('/:id', deleteContactType);

export default router;
