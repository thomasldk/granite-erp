import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public Routes
router.post('/login', authController.login);
router.post('/seed-admin', authController.seedAdmin);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected Routes
router.get('/me', authenticate, authController.getMe);

export default router;
