import express from 'express';
import { getReadyPallets, createDeliveryNote, getDeliveryNotes, getDeliveryNoteById, updateDeliveryNote, deleteDeliveryNote, createPdf, addPalletToNote, removePalletFromNote, queueDeliveryRak, checkDeliveryStatus, downloadDeliveryFile, sendDeliveryEmail } from '../controllers/deliveryController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate); // Protect all routes

router.get('/pallets/ready', getReadyPallets);
router.post('/notes', createDeliveryNote);
router.get('/notes', getDeliveryNotes);
router.get('/notes/:id', getDeliveryNoteById);
router.get('/notes/:id/pdf', createPdf);
router.get('/notes/:id/download', downloadDeliveryFile);
router.post('/notes/:id/email', sendDeliveryEmail);

// Items (Pallets)
router.post('/notes/:id/items', addPalletToNote);
router.delete('/notes/:id/items/:palletId', removePalletFromNote);

// RAK
router.get('/notes/:id/rak', queueDeliveryRak); // Legacy GET
router.post('/notes/:id/generate', queueDeliveryRak); // New POST (matches Frontend)
router.get('/notes/:id/status', checkDeliveryStatus); // Polls Return

router.put('/notes/:id', updateDeliveryNote);
router.delete('/notes/:id', deleteDeliveryNote);

export default router;
