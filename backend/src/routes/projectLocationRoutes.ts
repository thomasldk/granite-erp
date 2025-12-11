import { Router } from 'express';
import { getProjectLocations, createProjectLocation, deleteProjectLocation } from '../controllers/projectLocationController';

const router = Router();

router.get('/', getProjectLocations);
router.post('/', createProjectLocation);
router.delete('/:id', deleteProjectLocation);

export default router;
