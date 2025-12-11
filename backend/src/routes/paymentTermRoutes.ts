
import { Router } from 'express';
import { getPaymentTerms } from '../controllers/paymentTermController';

const router = Router();

router.get('/', getPaymentTerms);

export default router;
