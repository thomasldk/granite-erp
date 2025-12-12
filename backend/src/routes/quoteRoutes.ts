import { Router } from 'express';
import { getQuotes, getQuoteById, createQuote, updateQuote, addItem, deleteItem, generateQuoteExcel } from '../controllers/quoteController';
import * as quoteController from '../controllers/quoteController'; // Import all as quoteController for consistency with the new route

import multer from 'multer';

// Configure basic multer for temp storage
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Excel Generation
router.get('/:id/excel', quoteController.generateQuoteExcel);

// Basic CRUD
router.get('/next-reference', quoteController.getNextQuoteReference);
router.get('/', quoteController.getQuotes);
router.get('/:id', getQuoteById);
router.post('/', createQuote);
router.put('/:id', updateQuote);
router.delete('/:id', quoteController.deleteQuote); // Added


// Items are sub-resources of a quote ideally, or just linked
router.post('/:quoteId/items', addItem);
router.delete('/items/:itemId', deleteItem);
router.post('/:id/revise', quoteController.reviseQuote);
router.post('/:id/duplicate', quoteController.duplicateQuote);
router.get('/:id/xml', quoteController.generateQuoteXml);
router.post('/:id/export-local', quoteController.exportQuoteToLocal); // Save to server disk
router.post('/:id/import-network', quoteController.importNetworkXml); // Import from server disk
router.get('/:id/download-excel', quoteController.downloadQuoteExcel); // Download generated Excel from network // Added

// Import XML
router.post('/:id/import-xml', upload.single('file'), quoteController.importQuoteXml);
router.post('/:id/reintegrate-excel', upload.single('file'), quoteController.reintegrateExcel);
router.get('/:id/download-source-excel', quoteController.downloadSourceExcel); // For Agent to download uploaded Excel
router.post('/save-rak', quoteController.saveRakToNetwork);
router.post('/:id/fetch-return-xml', quoteController.fetchReturnXml);
router.get('/:id/download-pdf', quoteController.downloadQuotePdf);
router.post('/:id/emit', quoteController.emitQuote);

router.get('/:id/download-result', quoteController.downloadQuoteResult);

export default router;
