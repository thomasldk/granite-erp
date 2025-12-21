import { Router } from 'express';
import { getProjectLocations, createProjectLocation, deleteProjectLocation, updateProjectLocation } from '../controllers/projectLocationController';

const router = Router();

router.get('/', getProjectLocations);
router.post('/', createProjectLocation);
router.delete('/:id', deleteProjectLocation);
router.put('/:id', updateProjectLocation);

export default router;
