"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quoteController_1 = require("../controllers/quoteController");
const quoteController = __importStar(require("../controllers/quoteController")); // Import all as quoteController for consistency with the new route
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
// Configure basic multer for temp storage
const uploadDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
const upload = (0, multer_1.default)({ dest: uploadDir });
const router = (0, express_1.Router)();
// Excel Generation
router.get('/:id/excel', quoteController.generateQuoteExcel);
// Basic CRUD
router.get('/next-reference', quoteController.getNextQuoteReference);
router.get('/', quoteController.getQuotes);
router.get('/:id', quoteController_1.getQuoteById);
router.post('/', quoteController_1.createQuote);
router.put('/:id', quoteController_1.updateQuote);
router.delete('/:id', quoteController.deleteQuote); // Added
// Items are sub-resources of a quote ideally, or just linked
router.post('/:quoteId/items', quoteController_1.addItem);
router.delete('/items/:itemId', quoteController_1.deleteItem);
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
const agentStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/temp');
        if (!fs_1.default.existsSync(uploadDir))
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const agentUpload = (0, multer_1.default)({ storage: agentStorage });
router.get('/agent/pending-xml', quoteController.listPendingXmls);
router.get('/agent/pending-xml/:filename', quoteController.downloadPendingXml);
router.post('/agent/ack-xml', quoteController.ackPendingXml);
// Updated to accept 'pdf' field
router.post('/agent/upload-bundle', agentUpload.fields([{ name: 'xml', maxCount: 1 }, { name: 'excel', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), quoteController.processAgentBundle);
exports.default = router;
