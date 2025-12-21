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
exports.deleteRepresentative = exports.updateRepresentative = exports.createRepresentative = exports.getRepresentatives = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const getRepresentatives = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reps = yield prisma_1.default.representative.findMany({
            orderBy: { lastName: 'asc' }
        });
        res.json(reps);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch representatives' });
    }
});
exports.getRepresentatives = getRepresentatives;
const createRepresentative = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, email, phone, mobile, fax } = req.body;
        const rep = yield prisma_1.default.representative.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                mobile,
                fax,
                active: true
            }
        });
        res.status(201).json(rep);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create representative', details: error });
    }
});
exports.createRepresentative = createRepresentative;
const updateRepresentative = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, mobile, fax, active } = req.body;
        const rep = yield prisma_1.default.representative.update({
            where: { id },
            data: {
                firstName,
                lastName,
                email,
                phone,
                mobile,
                fax,
                active
            }
        });
        res.json(rep);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update representative', details: error });
    }
});
exports.updateRepresentative = updateRepresentative;
const deleteRepresentative = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.representative.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete representative' });
    }
});
exports.deleteRepresentative = deleteRepresentative;
