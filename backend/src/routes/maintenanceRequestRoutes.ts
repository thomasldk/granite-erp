import { Router } from 'express';
import {
    getAllMaintenanceRequests,
    createMaintenanceRequest,
    getMaintenanceRequestById,
    updateMaintenanceRequest,
    deleteMaintenanceRequest
} from '../controllers/maintenanceRequestController';

const router = Router();

router.get('/', getAllMaintenanceRequests);
router.post('/', createMaintenanceRequest);
router.get('/:id', getMaintenanceRequestById);
router.put('/:id', updateMaintenanceRequest);
router.delete('/:id', deleteMaintenanceRequest);

export default router;
