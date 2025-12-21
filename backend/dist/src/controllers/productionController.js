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
exports.getProductionItems = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const getProductionItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield prisma_1.default.quoteItem.findMany({
            where: {
                quote: {
                    status: 'Accepted' // Filter for accepted status
                }
            },
            include: {
                quote: {
                    include: {
                        project: true,
                        client: true,
                    }
                },
                productionSite: true // Include site info
            },
            orderBy: {
                quote: {
                    reference: 'asc'
                }
            }
        });
        const productionItems = items.map(item => {
            // "Calculations" are now just reading stored values
            // Formatting to 2 decimals for display consistency
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return {
                id: item.id,
                quoteRef: item.quote.reference,
                clientName: ((_a = item.quote.client) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                site: ((_b = item.productionSite) === null || _b === void 0 ? void 0 : _b.name) || 'Unassigned', // Return site name
                tag: item.tag || '',
                granite: item.material,
                qty: item.quantity,
                item: 'Item', // Static or type?
                length: item.length || 0,
                width: item.width || 0,
                thickness: item.thickness || 0,
                description: item.description,
                netLength: ((_c = item.netLength) === null || _c === void 0 ? void 0 : _c.toFixed(2)) || '0.00',
                netArea: ((_d = item.netArea) === null || _d === void 0 ? void 0 : _d.toFixed(2)) || '0.00',
                netVolume: ((_e = item.netVolume) === null || _e === void 0 ? void 0 : _e.toFixed(2)) || '0.00',
                totalWeight: ((_f = item.totalWeight) === null || _f === void 0 ? void 0 : _f.toFixed(2)) || '0.00',
                unitPriceCad: ((_g = item.unitPriceCad) === null || _g === void 0 ? void 0 : _g.toFixed(2)) || '0.00',
                unitPriceUsd: ((_h = item.unitPriceUsd) === null || _h === void 0 ? void 0 : _h.toFixed(2)) || '0.00',
                totalCad: ((_j = item.totalPriceCad) === null || _j === void 0 ? void 0 : _j.toFixed(2)) || '0.00',
                totalUsd: ((_k = item.totalPriceUsd) === null || _k === void 0 ? void 0 : _k.toFixed(2)) || '0.00',
                unit: item.unit
            };
        });
        res.json(productionItems);
    }
    catch (error) {
        console.error("Production Fetch Error:", error);
        res.status(500).json({ error: 'Failed to fetch production items' });
    }
});
exports.getProductionItems = getProductionItems;
