"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMaintenanceSite = exports.updateMaintenanceSite = exports.createMaintenanceSite = exports.getAllMaintenanceSites = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllMaintenanceSites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield prisma.maintenanceSite.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(sites);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch maintenance sites' });
    }
});
exports.getAllMaintenanceSites = getAllMaintenanceSites;
const createMaintenanceSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = yield prisma.maintenanceSite.create({
            data: { name }
        });
        res.status(201).json(site);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create maintenance site' });
    }
});
exports.createMaintenanceSite = createMaintenanceSite;
const updateMaintenanceSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = yield prisma.maintenanceSite.update({
            where: { id },
            data: { name }
        });
        res.json(site);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update maintenance site' });
    }
});
exports.updateMaintenanceSite = updateMaintenanceSite;
const deleteMaintenanceSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.maintenanceSite.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete maintenance site' });
    }
});
exports.deleteMaintenanceSite = deleteMaintenanceSite;
