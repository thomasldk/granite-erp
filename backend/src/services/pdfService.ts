// @ts-ignore
import PDFDocument from 'pdfkit-table';
import { Quote, QuoteItem, Project, ThirdParty, Contact } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

interface QuoteWithRelations extends Quote {
    items: QuoteItem[];
    project: Project;
    client: ThirdParty;
    contact?: Contact | null;
}

export class PdfService {
    static async generateQuotePdf(quote: QuoteWithRelations): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
            const buffers: Buffer[] = [];

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
            doc.font('Helvetica').text(quote.client?.name || 'Client Inconnu', 50, startY + 15);
            if (quote.contact) {
                doc.text(`Attn: ${quote.contact.firstName} ${quote.contact.lastName}`, 50, startY + 30);
            }
            // Project Info
            doc.font('Helvetica-Bold').text('PROJET:', 300, startY);
            doc.font('Helvetica').text(quote.project?.name || 'Projet Inconnu', 300, startY + 15);
            doc.text(`Ref Projet: ${quote.project?.reference || ''}`, 300, startY + 30);
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
                rows: quote.items.map((item: any) => [
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
            quote.items.forEach((item: any) => {
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

    }

    static async generateDeliveryNotePdf(note: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            const startY = 50;
            // --- HEADER ---
            // Use absolute path for logo
            const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, startY, { width: 100 });
            } else {
                console.warn(`[PDF] Logo not found at ${logoPath}`);
            }
            doc.stroke(); // Placeholder if logo exists, else skip
            // Fallback text if image fails or just text
            doc.fontSize(20).font('Helvetica-Bold').text('BON DE LIVRAISON', { align: 'right' });
            doc.fontSize(12).font('Helvetica').text(note.reference, { align: 'right' });
            doc.fontSize(10).text(`Date: ${new Date(note.date).toLocaleDateString()}`, { align: 'right' });

            doc.moveDown();
            doc.fontSize(10).font('Helvetica-Bold').text('Granite DRC');
            doc.font('Helvetica').text('123 Granite Road, Stanstead, QC');
            doc.text('Phone: (555) 555-5555');
            doc.moveDown(2);

            // --- INFO GRID ---
            const leftX = 50;
            const rightX = 300;
            const currentY = doc.y;

            // Client Info
            doc.font('Helvetica-Bold').text('EXPÉDIÉ À:', leftX, currentY);
            doc.font('Helvetica').text(note.client?.name || 'Client Inconnu', leftX, currentY + 15);
            if (note.deliveryAddress) {
                // Parse address if JSON or use simple string
                // note.deliveryAddress is JSON stored as string or object? 
                // Model says Json? No, schema says String?
                // Actually schema says deliveryAddress String? (Wait, I added Structured Address? No, just string in controller? Let's assume content)
                // If structured, it's fields. If flat string, use it.
                // Based on create: deliveryAddress: address
                doc.text(typeof note.deliveryAddress === 'string' ? note.deliveryAddress : JSON.stringify(note.deliveryAddress), leftX, currentY + 30, { width: 200 });
            }
            // Contact
            if (note.siteContactName) {
                doc.font('Helvetica-Bold').text('Contact Chantier:', leftX, currentY + 70);
                doc.font('Helvetica').text(`${note.siteContactName} ${note.siteContactPhone ? '- ' + note.siteContactPhone : ''}`, leftX, currentY + 85);
            }

            // Carrier Info
            doc.font('Helvetica-Bold').text('TRANSPORTEUR:', rightX, currentY);
            doc.font('Helvetica').text(note.carrier || 'Non spécifié', rightX, currentY + 15);

            doc.moveDown(8);

            // --- PALLETS TABLE ---
            const rows: any[] = [];

            note.items.forEach((item: any) => {
                const pallet = item.pallet;
                if (pallet) {
                    const contentDesc = pallet.items?.map((pi: any) => {
                        const qi = pi.quoteItem;
                        return `${qi?.quantity || pi.quantity}x ${qi?.tag || ''} ${qi?.description || ''} (${qi?.refReference || ''})`;
                    }).join('\n');

                    const weight = pallet.items?.reduce((sum: number, i: any) => sum + (i.quoteItem?.totalWeight || 0), 0);

                    rows.push([
                        `P#${pallet.number?.toString().padStart(2, '0')}`,
                        `${pallet.workOrder?.orderNumber}\n${pallet.workOrder?.quote?.project?.name}`,
                        contentDesc || 'Contenu Inconnu',
                        `${weight?.toFixed(1)} lbs`
                    ]);
                }
            });

            const table = {
                title: "",
                headers: [
                    { label: "Palette #", property: 'pallet', width: 60 },
                    { label: "Projet / Commande", property: 'project', width: 100 },
                    { label: "Contenu", property: 'content', width: 300 },
                    { label: "Poids", property: 'weight', width: 60 }
                ],
                rows: rows
            };

            doc.table(table, {
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(9)
            });

            doc.moveDown(2);

            // --- SUMMARY ---
            doc.fontSize(12).font('Helvetica-Bold').text(`Poids Total: ${note.totalWeight?.toFixed(1) || 0} lbs`, { align: 'right' });
            doc.text(`Nombre de Palettes: ${rows.length}`, { align: 'right' });

            doc.moveDown(4);

            // --- SIGNATURES ---
            const sigY = doc.y;
            doc.fontSize(10).font('Helvetica').text('Expédié par:', 50, sigY);
            doc.text('__________________________', 50, sigY + 20);

            doc.text('Transporteur:', 250, sigY);
            doc.text('__________________________', 250, sigY + 20);

            doc.text('Reçu par:', 450, sigY);
            doc.text('__________________________', 450, sigY + 20);

            doc.end();
        });
    }
}
