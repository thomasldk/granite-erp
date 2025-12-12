import { Router } from 'express';
import {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
} from '../controllers/equipmentController';

const router = Router();

router.get('/', getAllEquipment);
router.get('/:id', getEquipmentById);
router.post('/', createEquipment);
router.put('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

export default router;
