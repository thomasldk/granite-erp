
import { Router } from 'express';
import {
    getAllProductionSites,
    createProductionSite,
    updateProductionSite,
    deleteProductionSite
} from '../controllers/productionSiteController';

const router = Router();

router.get('/', getAllProductionSites);
router.post('/', createProductionSite);
router.put('/:id', updateProductionSite);
router.delete('/:id', deleteProductionSite);

export default router;
