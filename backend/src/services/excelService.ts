import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { Quote, QuoteItem, ThirdParty, Contact } from '@prisma/client';

export class ExcelService {
    private templatePath: string;

    constructor() {
        // Assuming template is stored in a known location, e.g., defined in env or relative path
        // For now hardcoding or using a default relative path
        this.templatePath = '/Users/thomasleguendekergolan/Downloads/files/excel soumission/Modele de cotation defaut.xlsx';
    }

    async generateQuoteExcel(quote: any): Promise<string> {
        if (!fs.existsSync(this.templatePath)) {
            throw new Error(`Template file not found at ${this.templatePath}`);
        }

        // Use a temp file for output
        const fileName = `${quote.reference || 'Soumission'}.xlsx`;
        const outputDir = path.join(__dirname, '../../temp');
        const outputPath = path.join(outputDir, fileName);

        // Ensure temp dir exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(this.templatePath);

        // --- Populate Paramètre ---
        const paramSheet = workbook.getWorksheet('Paramètre');
        if (paramSheet) {
            // Updated mapping based on analysis of rows 15-50
            // Convention seems to be: Label in Col C (3), Value in Col D (4)

            // Let's write Client info to D7-D13 trusting previous knowledge BUT shifting to Col D if it was C.
            // If the user says "understand parameters", I should be careful.
            // Row 15 "Nom" might be "Contact Name" or "Client Name".

            // Correct mapping based on analysis: [null, null, null, "Label", Value]
            // Label is Col D (4), Value is Col E (5)

            const client = quote.client as ThirdParty & { addresses: any[], contacts: any[] };

            // Writing to E7 for Client Name
            paramSheet.getCell(7, 5).value = client.name;

            const address = client.addresses?.[0] || {};
            paramSheet.getCell(8, 5).value = address.line1 || '';
            paramSheet.getCell(9, 5).value = address.city || '';
            paramSheet.getCell(11, 5).value = address.state || '';
            paramSheet.getCell(12, 5).value = address.country || '';
            paramSheet.getCell(13, 5).value = address.zipCode || '';

            // Map Contact
            const contact = client.contacts?.[0];
            paramSheet.getCell(15, 5).value = contact ? `${contact.firstName} ${contact.lastName}` : (client.name || '');
            paramSheet.getCell(16, 5).value = contact?.phone || client.phone || '';
            paramSheet.getCell(19, 5).value = contact?.email || client.email || '';

            // Project Info
            paramSheet.getCell(20, 5).value = quote.project?.name || '';
            paramSheet.getCell(21, 5).value = quote.reference;

            if (quote.estimatedWeeks || quote.estimatedWeeks === 0) {
                paramSheet.getCell(31, 5).value = quote.estimatedWeeks;
            }

            // Langue
            let langCode = (client.language || 'fr').toUpperCase();
            paramSheet.getCell(39, 5).value = langCode;

            // Payment Terms
            if (client.paymentTerms) {
                paramSheet.getCell(33, 5).value = client.paymentTerms;
            }

            // System de mesure -> E40 (Col 5) - Unchanged
            const sys = quote.project?.measureSystem === 'Metric' ? 'Métrique' : 'Impérial';
            paramSheet.getCell(40, 5).value = sys;

            // Currency -> E65
            if (quote.currency) {
                paramSheet.getCell(65, 5).value = quote.currency;
            } else if (client.defaultCurrency) {
                paramSheet.getCell(65, 5).value = client.defaultCurrency;
            }

            // Exchange Rate -> E38
            if (quote.exchangeRate) {
                paramSheet.getCell(38, 5).value = quote.exchangeRate;
            } else {
                paramSheet.getCell(38, 5).value = 1.0;
            }

            // Material Price - Intrant
            if (quote.material) {
                paramSheet.getCell(55, 3).value = "Pierre (Intrant)";
                paramSheet.getCell(55, 5).value = quote.material.name; // Changed to Col 5
                paramSheet.getCell(56, 3).value = "Prix Achat ($)";
                paramSheet.getCell(56, 5).value = quote.material.purchasePrice; // Changed to Col 5
            }
        }

        // --- Populate Cotation ---
        // Restoration: Analysis showed E7, E20 etc are empty (null), so no formulas link them to Paramètre.
        // We MUST populate them manually.

        const sheet = workbook.getWorksheet('Cotation');
        if (sheet) {
            // ... (Client info in E7-E13 is Correct as it targets E by string)

            sheet.getCell('E7').value = quote.client?.name || '';
            const addr = quote.client?.addresses?.[0]; // Use first address
            if (addr) {
                sheet.getCell('E8').value = addr.line1 || '';
                sheet.getCell('E9').value = addr.line2 || '';
                sheet.getCell('E10').value = addr.city || '';
                sheet.getCell('E11').value = addr.state || ''; // Province
                sheet.getCell('E13').value = addr.zipCode || '';
            }
            sheet.getCell('D3').value = quote.reference;
            sheet.getCell('E20').value = quote.project?.name || '';
            if (quote.project?.location?.name) sheet.getCell('E23').value = quote.project.location.name;
            if (quote.project?.estimatedWeeks || quote.project?.estimatedWeeks === 0) sheet.getCell('E31').value = quote.project.estimatedWeeks;
            const sys = quote.project?.measureSystem === 'Metric' ? 'Métrique' : 'Impérial';
            sheet.getCell('F40').value = sys;
            if (quote.client?.paymentTerms) sheet.getCell('E43').value = quote.client.paymentTerms;

            if (quote.material) {
                sheet.getCell('D35').value = "Matériau/Pierre:";
                sheet.getCell('E35').value = quote.material.name;
                sheet.getCell('D36').value = "Prix Achat ($):";
                sheet.getCell('E36').value = quote.material.purchasePrice;
            }

            // --- Dynamic Line Generation & Population ---
            const items = quote.items || [];
            // We ensure we have enough lines for the items + any extra defined by project settings
            const numberOfLines = Math.max(items.length, quote.project?.numberOfLines || 1);
            const START_ROW = 13;

            if (numberOfLines > 0) {
                const templateRow = sheet.getRow(START_ROW);

                for (let i = 0; i < numberOfLines; i++) {
                    const currentRowNum = START_ROW + i;
                    const currentRow = sheet.getRow(currentRowNum);

                    if (currentRowNum !== START_ROW) {
                        currentRow.height = templateRow.height;
                        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                            const targetCell = currentRow.getCell(colNumber);
                            targetCell.style = cell.style;
                            // Copy value/formula initially to keep structure
                            // But we will overwrite data cells next
                            targetCell.value = cell.value;
                        });
                        currentRow.commit();
                    }

                    // Populate Data if item exists for this row
                    if (i < items.length) {
                        const item = items[i];
                        // Mappings based on Analysis:
                        // K(11): Tag
                        // L(12): Material (Granite)
                        // M(13): Qty
                        // N(14): Unit
                        // O(15): Length
                        // P(16): Width
                        // Q(17): Thickness
                        // R(18): Description
                        // S(19): Net Length
                        // T(20): Net Area
                        // U(21): Net Volume
                        // V(22): Weight
                        // W(23): Unit Price CAD
                        // X(24): Unit Price USD
                        // Z(26): Total CAD
                        // AA(27): Total USD

                        currentRow.getCell(11).value = item.tag || (i + 1);
                        currentRow.getCell(12).value = item.material || quote.material?.name || '';
                        currentRow.getCell(13).value = item.quantity;
                        currentRow.getCell(14).value = item.unit || 'ea';
                        currentRow.getCell(15).value = item.length;
                        currentRow.getCell(16).value = item.width;
                        currentRow.getCell(17).value = item.thickness;
                        currentRow.getCell(18).value = item.description;

                        // Outputs (Overwriting formulas with calculated values)
                        currentRow.getCell(19).value = item.netLength;
                        currentRow.getCell(20).value = item.netArea;
                        currentRow.getCell(21).value = item.netVolume;
                        currentRow.getCell(22).value = item.totalWeight;
                        currentRow.getCell(23).value = item.unitPriceCad;
                        currentRow.getCell(24).value = item.unitPriceUsd;
                        // Col Y (25) is 'UNIT' again? Log says "UNIT".

                        currentRow.getCell(26).value = item.totalPriceCad;
                        currentRow.getCell(27).value = item.totalPriceUsd;

                        currentRow.commit();
                    }
                }
            }
        }

        await workbook.xlsx.writeFile(outputPath);
        return outputPath;
    }
}
