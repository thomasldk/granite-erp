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
exports.deleteProjectLocation = exports.createProjectLocation = exports.getProjectLocations = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getProjectLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield prisma.projectLocation.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(locations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch locations' });
    }
});
exports.getProjectLocations = getProjectLocations;
const createProjectLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.body;
    try {
        const existing = yield prisma.projectLocation.findUnique({
            where: { name }
        });
        if (existing) {
            return res.status(200).json(existing);
        }
        const location = yield prisma.projectLocation.create({
            data: { name }
        });
        res.status(201).json(location);
    }
    catch (error) {
        console.error("Create Location Error:", error);
        res.status(500).json({
            error: 'Failed to create location',
            details: error.message || String(error),
            receivedBody: req.body
        });
    }
});
exports.createProjectLocation = createProjectLocation;
const deleteProjectLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        yield prisma.projectLocation.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete location' });
    }
});
exports.deleteProjectLocation = deleteProjectLocation;
