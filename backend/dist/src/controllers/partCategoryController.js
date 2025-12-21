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
exports.deletePartCategory = exports.updatePartCategory = exports.createPartCategory = exports.getPartCategories = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getPartCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield prisma_1.default.partCategory.findMany();
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch part categories' });
    }
});
exports.getPartCategories = getPartCategories;
const createPartCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name } = req.body;
        const category = yield prisma_1.default.partCategory.create({
            data: { name },
        });
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create part category' });
    }
});
exports.createPartCategory = createPartCategory;
const updatePartCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const category = yield prisma_1.default.partCategory.update({
            where: { id },
            data: { name },
        });
        res.json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update part category' });
    }
});
exports.updatePartCategory = updatePartCategory;
const deletePartCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.partCategory.delete({
            where: { id },
        });
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete part category' });
    }
});
exports.deletePartCategory = deletePartCategory;
