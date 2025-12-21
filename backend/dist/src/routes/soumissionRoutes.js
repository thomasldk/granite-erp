"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const soumissionController_1 = require("../controllers/soumissionController");
const router = (0, express_1.Router)();
// Projects
router.get('/next-reference', soumissionController_1.getNextProjectReference); // Added
router.post('/', soumissionController_1.createProject);
router.get('/', soumissionController_1.getProjects);
router.put('/:id', soumissionController_1.updateProject);
router.delete('/:id', soumissionController_1.deleteProject); // Added // Added
// Quotes
router.post('/quotes', soumissionController_1.createQuote);
router.get('/quotes/:id', soumissionController_1.getQuoteById);
router.get('/quotes/:id/xml', soumissionController_1.generateQuoteXml); // Added
router.post('/quotes/:quoteId/items', soumissionController_1.addQuoteItem);
router.delete('/quotes/:id', soumissionController_1.deleteQuote); // Added
exports.default = router;
