import express from 'express';
import {
    getRoles, createRole, deleteRole, updateRole,
    getHRSites, createHRSite, deleteHRSite, updateHRSite,
    getDepartments, createDepartment, deleteDepartment, updateDepartment,
    getJobTitles, createJobTitle, deleteJobTitle, updateJobTitle,
    getPrinters, createPrinter, deletePrinter, updatePrinter
} from '../controllers/hrSettingsController';

const router = express.Router();

// Roles
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.delete('/roles/:id', deleteRole);
router.put('/roles/:id', updateRole);

// HR Sites
router.get('/sites', getHRSites);
router.post('/sites', createHRSite);
router.delete('/sites/:id', deleteHRSite);
router.put('/sites/:id', updateHRSite);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.delete('/departments/:id', deleteDepartment);
router.put('/departments/:id', updateDepartment);

// Job Titles
router.get('/job-titles', getJobTitles);
router.post('/job-titles', createJobTitle);
router.delete('/job-titles/:id', deleteJobTitle);
router.put('/job-titles/:id', updateJobTitle);

// Printers
router.get('/printers', getPrinters);
router.post('/printers', createPrinter);
router.put('/printers/:id', updatePrinter);
router.delete('/printers/:id', deletePrinter);

export default router;
