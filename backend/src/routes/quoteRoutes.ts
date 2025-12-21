import { Router } from 'express';
import { getQuotes, getQuoteById, createQuote, updateQuote, addItem, deleteItem, generateQuoteExcel } from '../controllers/quoteController';
import * as quoteController from '../controllers/quoteController'; // Import all as quoteController for consistency with the new route


import fs from 'fs';
import path from 'path';
import multer from 'multer';

// Configure basic multer for temp storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

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
// Basic CRUD
router.get('/:id/download-source', quoteController.downloadQuoteResult); // Alias for Agent to get previous file
router.post('/save-rak', quoteController.saveRakToNetwork);
router.post('/:id/fetch-return-xml', quoteController.fetchReturnXml);
router.get('/:id/download-pdf', quoteController.downloadQuotePdf);
router.post('/:id/generate-pdf', quoteController.generatePdf); // PDF Trigger
router.post('/:id/emit', quoteController.emitQuote);

router.get('/:id/download-result', quoteController.downloadQuoteResult);
router.get('/:id/download-source-excel', quoteController.downloadSourceExcel); // Explicit Agent Route



// --- AGENT POLLING ROUTES ---
const agentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const agentUpload = multer({ storage: agentStorage });

router.get('/agent/pending-xml', quoteController.listPendingXmls);
router.get('/agent/pending-xml/:filename', quoteController.downloadPendingXml);
router.post('/agent/ack-xml', quoteController.ackPendingXml);
// Updated to accept 'pdf' field
router.post('/agent/upload-bundle', agentUpload.fields([{ name: 'xml', maxCount: 1 }, { name: 'excel', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), quoteController.processAgentBundle);

export default router;
