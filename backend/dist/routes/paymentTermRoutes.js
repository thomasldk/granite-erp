"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentTermController_1 = require("../controllers/paymentTermController");
const router = (0, express_1.Router)();
router.get('/', paymentTermController_1.getPaymentTerms);
exports.default = router;
