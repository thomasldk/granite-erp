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
exports.deleteProductionSite = exports.updateProductionSite = exports.createProductionSite = exports.getAllProductionSites = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllProductionSites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield prisma.productionSite.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(sites);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch production sites' });
    }
});
exports.getAllProductionSites = getAllProductionSites;
const createProductionSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = yield prisma.productionSite.create({
            data: { name }
        });
        res.status(201).json(site);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create production site' });
    }
});
exports.createProductionSite = createProductionSite;
const updateProductionSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }
        const site = yield prisma.productionSite.update({
            where: { id },
            data: { name }
        });
        res.json(site);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update production site' });
    }
});
exports.updateProductionSite = updateProductionSite;
const deleteProductionSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.productionSite.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete production site' });
    }
});
exports.deleteProductionSite = deleteProductionSite;
