import { Router } from 'express';
import {
    createProject, getProjects, updateProject, deleteProject, getNextProjectReference, // Added
    createQuote, getQuoteById, addQuoteItem, deleteQuote, generateQuoteXml
} from '../controllers/soumissionController';

const router = Router();

// Projects
router.get('/next-reference', getNextProjectReference); // Added
router.post('/', createProject);
router.get('/', getProjects);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject); // Added // Added

// Quotes
router.post('/quotes', createQuote);
router.get('/quotes/:id', getQuoteById);
router.get('/quotes/:id/xml', generateQuoteXml); // Added
router.post('/quotes/:quoteId/items', addQuoteItem);
router.delete('/quotes/:id', deleteQuote); // Added

export default router;
