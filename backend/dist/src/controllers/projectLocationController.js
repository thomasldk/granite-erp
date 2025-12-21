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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectLocation = exports.deleteProjectLocation = exports.createProjectLocation = exports.getProjectLocations = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const getProjectLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield prisma_1.default.projectLocation.findMany({
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
        const existing = yield prisma_1.default.projectLocation.findUnique({
            where: { name }
        });
        if (existing) {
            return res.status(200).json(existing);
        }
        const location = yield prisma_1.default.projectLocation.create({
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
        yield prisma_1.default.projectLocation.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete location' });
    }
});
exports.deleteProjectLocation = deleteProjectLocation;
const updateProjectLocation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const location = yield prisma_1.default.projectLocation.update({
            where: { id },
            data: { name }
        });
        res.json(location);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update location' });
    }
});
exports.updateProjectLocation = updateProjectLocation;
