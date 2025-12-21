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
exports.deletePart = exports.updatePart = exports.createPart = exports.getParts = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getParts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const parts = yield prisma_1.default.part.findMany({
            include: {
                category: true,
                site: true
            }
        });
        res.json(parts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch parts' });
    }
});
exports.getParts = getParts;
const createPart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = req.body;
        const part = yield prisma_1.default.part.create({
            data: data,
        });
        res.json(part);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create part' });
    }
});
exports.createPart = createPart;
const updatePart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const data = req.body;
        const part = yield prisma_1.default.part.update({
            where: { id },
            data: data,
        });
        res.json(part);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update part' });
    }
});
exports.updatePart = updatePart;
const deletePart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.part.delete({
            where: { id },
        });
        res.json({ message: 'Part deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete part' });
    }
});
exports.deletePart = deletePart;
