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
router.get('/next-reference', workOrderController.getNextReference); // Add this BEFORE /:id
router.get('/', workOrderController.getWorkOrders);
router.get('/:id', workOrderController.getWorkOrderById);
router.get('/:id/po-view', workOrderController.viewClientPO); // Add this

export default router;
