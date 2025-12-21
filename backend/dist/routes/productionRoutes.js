"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productionController_1 = require("../controllers/productionController");
const router = (0, express_1.Router)();
router.get('/items', productionController_1.getProductionItems);
exports.default = router;
