"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemConfigController_1 = require("../controllers/systemConfigController");
const router = (0, express_1.Router)();
router.get('/', systemConfigController_1.getSystemConfig);
router.put('/', systemConfigController_1.updateSystemConfig);
exports.default = router;
