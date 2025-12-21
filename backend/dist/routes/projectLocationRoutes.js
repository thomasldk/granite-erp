"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectLocationController_1 = require("../controllers/projectLocationController");
const router = (0, express_1.Router)();
router.get('/', projectLocationController_1.getProjectLocations);
router.post('/', projectLocationController_1.createProjectLocation);
router.delete('/:id', projectLocationController_1.deleteProjectLocation);
exports.default = router;
