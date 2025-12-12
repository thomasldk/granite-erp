
import { Router } from 'express';
import {
    getAllMaintenanceSites,
    createMaintenanceSite,
    updateMaintenanceSite,
    deleteMaintenanceSite
} from '../controllers/maintenanceSiteController';

const router = Router();

router.get('/', getAllMaintenanceSites);
router.post('/', createMaintenanceSite);
router.put('/:id', updateMaintenanceSite);
router.delete('/:id', deleteMaintenanceSite);

export default router;
