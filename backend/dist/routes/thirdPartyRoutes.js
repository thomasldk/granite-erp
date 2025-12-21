"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const thirdPartyController_1 = require("../controllers/thirdPartyController");
const router = (0, express_1.Router)();
router.post('/', thirdPartyController_1.createThirdParty);
router.get('/', thirdPartyController_1.getThirdParties);
router.get('/:id', thirdPartyController_1.getThirdPartyById);
router.post('/:id/contacts', thirdPartyController_1.addContact);
router.put('/contacts/:contactId', thirdPartyController_1.updateContact); // Direct contact update
router.post('/:id/addresses', thirdPartyController_1.addAddress);
router.put('/:id', thirdPartyController_1.updateThirdParty);
router.delete('/:id', thirdPartyController_1.deleteThirdParty); // Added delete route
exports.default = router;
