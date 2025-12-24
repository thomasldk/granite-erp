import { Router } from 'express';
import * as workOrderController from '../controllers/workOrderController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure Multer for Client POs
const uploadDir = path.join(process.cwd(), 'uploads', 'client_pos');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Safe filename: BT-{Timestamp}-OriginalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'PO-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Routes
router.post('/', upload.single('clientPOFile'), workOrderController.createWorkOrder);
router.get('/next-reference', workOrderController.getNextReference);
router.get('/label/status', workOrderController.checkLabelStatus); // New
router.get('/label/download', workOrderController.downloadLabelExcel); // New
router.get('/', workOrderController.getWorkOrders);
router.patch('/:id', workOrderController.updateWorkOrder);
router.post('/:id/pallets', workOrderController.createPallet);
router.patch('/:id/pallets/:palletId', workOrderController.updatePallet); // Add Update Path
router.get('/:id', workOrderController.getWorkOrderById);
router.get('/:id/po-view', workOrderController.viewClientPO);
router.post('/:id/pallets/:palletId/print', workOrderController.printPalletLabel);

export default router;
