import { Router } from 'express';
import {
    createThirdParty, getThirdParties, getThirdPartyById, updateThirdParty, deleteThirdParty,
    addContact, updateContact, addAddress
} from '../controllers/thirdPartyController';

const router = Router();

router.post('/', createThirdParty);
router.get('/', getThirdParties);
router.get('/:id', getThirdPartyById);

router.post('/:id/contacts', addContact);
router.put('/contacts/:contactId', updateContact); // Direct contact update
router.post('/:id/addresses', addAddress);
router.put('/:id', updateThirdParty);
router.delete('/:id', deleteThirdParty); // Added delete route

export default router;
