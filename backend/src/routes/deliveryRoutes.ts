import express from 'express';
import { getReadyPallets, createDeliveryNote, getDeliveryNotes, getDeliveryNote } from '../controllers/deliveryController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.get('/pallets/ready', getReadyPallets);
router.post('/notes', createDeliveryNote);
router.get('/notes', getDeliveryNotes);
router.get('/notes/:id', getDeliveryNote);

export default router;
