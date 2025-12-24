
import express from 'express';
import * as userController from '../controllers/userController';

const router = express.Router();

// Routes for /api/users
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
