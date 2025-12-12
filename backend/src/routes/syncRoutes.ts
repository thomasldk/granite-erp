import { Router } from 'express';
import multer from 'multer';
import * as syncController from '../controllers/syncController';

const router = Router();
const upload = multer(); // Memory storage for processing directly

// Agent Polls for pending work
router.get('/pending', syncController.pollPending);

// Agent Uploads result (XML)
router.post('/result/:id', upload.single('file'), syncController.uploadResult);

// Agent Uploads Excel
router.post('/excel/:id', upload.single('file'), syncController.uploadExcel);

export default router;
