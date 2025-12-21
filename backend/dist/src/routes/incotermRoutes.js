"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incotermController_1 = require("../controllers/incotermController");
const router = (0, express_1.Router)();
router.get('/', incotermController_1.getIncoterms);
router.put('/:id', incotermController_1.updateIncoterm);
exports.default = router;
