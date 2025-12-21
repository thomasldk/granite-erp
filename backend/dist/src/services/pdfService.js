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
exports.PdfService = void 0;
// @ts-ignore
const pdfkit_table_1 = __importDefault(require("pdfkit-table"));
class PdfService {
    static generateQuotePdf(quote) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a, _b, _c;
                const doc = new pdfkit_table_1.default({ margin: 50, size: 'LETTER' });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                doc.on('error', reject);
                // --- HEADER ---
                doc.fontSize(20).text('SOUMISSION / QUOTE', { align: 'right' });
                doc.fontSize(10).text(quote.reference, { align: 'right' });
                doc.moveDown();
                doc.fontSize(12).font('Helvetica-Bold').text('Granite DRC');
                doc.fontSize(10).font('Helvetica').text('123 Granite Road, Stanstead, QC');
                doc.text('Phone: (555) 555-5555');
                doc.text('Email: info@granitedrc.com');
                doc.moveDown();
                // --- CLIENT INFO ---
                const startY = doc.y;
                doc.font('Helvetica-Bold').text('CLIENT:', 50, startY);
                doc.font('Helvetica').text(((_a = quote.client) === null || _a === void 0 ? void 0 : _a.name) || 'Client Inconnu', 50, startY + 15);
                if (quote.contact) {
                    doc.text(`Attn: ${quote.contact.firstName} ${quote.contact.lastName}`, 50, startY + 30);
                }
                // Project Info
                doc.font('Helvetica-Bold').text('PROJET:', 300, startY);
                doc.font('Helvetica').text(((_b = quote.project) === null || _b === void 0 ? void 0 : _b.name) || 'Projet Inconnu', 300, startY + 15);
                doc.text(`Ref Projet: ${((_c = quote.project) === null || _c === void 0 ? void 0 : _c.reference) || ''}`, 300, startY + 30);
                doc.moveDown(4);
                // --- ITEMS TABLE ---
                const currency = quote.currency || 'CAD';
                const table = {
                    title: "",
                    headers: [
                        { label: "Ref / TAG", property: 'tag', width: 60 },
                        { label: "Description", property: 'description', width: 180 },
                        { label: "Matériau", property: 'material', width: 100 },
                        { label: "Qté", property: 'qty', width: 40 },
                        { label: "Unité", property: 'unit', width: 40 },
                        { label: "Prix Unitaire", property: 'price', width: 60 },
                        { label: "Total", property: 'total', width: 60 }
                    ],
                    rows: quote.items.map((item) => [
                        item.tag || '',
                        item.description || '',
                        item.material || '',
                        (item.quantity || 0).toString(),
                        item.unit || '',
                        (currency === 'USD' ? item.unitPrice : (item.unitPriceCad || item.unitPrice || 0)).toFixed(2),
                        (currency === 'USD' ? item.totalPrice : (item.totalPriceCad || item.totalPrice || 0)).toFixed(2)
                    ])
                };
                doc.table(table, {
                    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                    prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
                });
                doc.moveDown();
                // --- TOTALS ---
                // Calculate totals manually if not updated
                let subtotal = 0;
                quote.items.forEach((item) => {
                    subtotal += (currency === 'USD' ? item.totalPrice : (item.totalPriceCad || item.totalPrice || 0));
                });
                doc.font('Helvetica-Bold').text(`Sous-total (${currency}): ${subtotal.toFixed(2)} $`, { align: 'right' });
                // Taxes (Example logic)
                const tps = subtotal * 0.05;
                const tvq = subtotal * 0.09975;
                const total = subtotal + tps + tvq;
                doc.font('Helvetica').text(`TPS (5%): ${tps.toFixed(2)} $`, { align: 'right' });
                doc.text(`TVQ (9.975%): ${tvq.toFixed(2)} $`, { align: 'right' });
                doc.fontSize(12).text(`TOTAL: ${total.toFixed(2)} $`, { align: 'right' });
                doc.end();
            });
        });
    }
}
exports.PdfService = PdfService;
