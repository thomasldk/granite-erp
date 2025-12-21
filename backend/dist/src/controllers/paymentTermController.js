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
exports.getPaymentTerms = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const getPaymentTerms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentTerms = yield prisma_1.default.paymentTerm.findMany({
            orderBy: { code: 'asc' }
        });
        res.json(paymentTerms);
    }
    catch (error) {
        console.error('Error fetching payment terms:', error);
        res.status(500).json({ error: 'Failed to fetch payment terms' });
    }
});
exports.getPaymentTerms = getPaymentTerms;
