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
exports.deleteContactType = exports.updateContactType = exports.createContactType = exports.getContactTypes = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const getContactTypes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = req.query;
        const where = category ? { category: String(category) } : {};
        const types = yield prisma_1.default.contactType.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        res.json(types);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch contact types' });
    }
});
exports.getContactTypes = getContactTypes;
const createContactType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, category } = req.body;
        const type = yield prisma_1.default.contactType.create({
            data: {
                name,
                category: category || 'Client' // Default to Client
            }
        });
        res.status(201).json(type);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create contact type' });
    }
});
exports.createContactType = createContactType;
const updateContactType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, category } = req.body;
        const type = yield prisma_1.default.contactType.update({
            where: { id },
            data: { name, category }
        });
        res.json(type);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update contact type' });
    }
});
exports.updateContactType = updateContactType;
const deleteContactType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.contactType.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete contact type' });
    }
});
exports.deleteContactType = deleteContactType;
