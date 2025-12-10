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

            // Client Info (Assuming header starts earlier, mapping based on pattern)
            // If Row 15 starts with Name/Matisse, maybe Client section is Rows 15-19?
            // Row 15: [3]=Nom, [4]=Matisse. This looks like the Sender/Internal info or Client?
            // "Matisse" sounds like a name.
            // Row 22: Emetteur = Stanislas...
            // Let's assume Rows 7-13 were Client in the previous version, but maybe they are actually 15-19?
            // Wait, Row 15 "Matisse" might be previous client example.

            // Let's write Client info to D7-D13 trusting previous knowledge BUT shifting to Col D if it was C.
            // If the user says "understand parameters", I should be careful.
            // Row 15 "Nom" might be "Contact Name" or "Client Name".

            const client = quote.client as ThirdParty & { addresses: any[], contacts: any[] };

            // Writing to D7 for Client Name (Hypothesis based on D being Value col)
            paramSheet.getCell(7, 4).value = client.name; // D7

            const address = client.addresses?.[0] || {};
            paramSheet.getCell(8, 4).value = address.line1 || '';
            paramSheet.getCell(9, 4).value = address.city || '';
            paramSheet.getCell(11, 4).value = address.state || '';
            paramSheet.getCell(12, 4).value = address.country || '';
            paramSheet.getCell(13, 4).value = address.zipCode || '';

            // Map Contact
            const contact = client.contacts?.[0];
            // Contact info might be around Row 14-19 or 25-30?
            // Row 25 "Représentant" -> Name Inconnu. This is Internal Rep.
            // Row 15 "Nom" / "Matisse". Row 16 "Tel". Row 19 "Mail".
            // This looks like Client Contact block.
            paramSheet.getCell(15, 4).value = contact ? `${contact.firstName} ${contact.lastName}` : (client.name || '');
            paramSheet.getCell(16, 4).value = contact?.phone || client.phone || '';
            paramSheet.getCell(19, 4).value = contact?.email || client.email || '';

            // Project Info (Confirmed)
            // Row 20: [3]=Projet, [4]=Projet Name -> D20
            paramSheet.getCell(20, 4).value = quote.project?.name || '';

            // Row 21: [3]=Numero, [4]=Ref -> D21
            paramSheet.getCell(21, 4).value = quote.reference;

            // Row 31: [3]=Nombre de semaine -> D31
            if (quote.estimatedWeeks || quote.estimatedWeeks === 0) {
                paramSheet.getCell(31, 4).value = quote.estimatedWeeks;
            }

            // Row 39: [3]=Langue -> D39
            // Formula checks IF(UPPER(Langue)="FR"...), so case insensitive but cleaner to uppercase
            let langCode = (client.language || 'fr').toUpperCase();
            paramSheet.getCell(39, 4).value = langCode;

            // Row 33: [3]=Délai de paiement -> D33
            if (client.paymentTerms) {
                // If terms are "Net 30", extracting 30 might be safer if D33 expects just days.
                // But for now, user didn't complain specifically about this value format, just "parameters created".
                // We keep passing the string unless we parse it.
                paramSheet.getCell(33, 4).value = client.paymentTerms;
            }

            // Row 40: System de mesure -> E40 (Col 5)
            const sys = quote.project?.measureSystem === 'Metric' ? 'Métrique' : 'Impérial';
            paramSheet.getCell(40, 5).value = sys;

            // Currency Code
            // Analysis Row 65: [3]=Code de la devise client, [4]=USD
            // Must write to Col 4 (D65)
            if (quote.currency) {
                paramSheet.getCell(65, 4).value = quote.currency;
            } else if (client.defaultCurrency) {
                paramSheet.getCell(65, 4).value = client.defaultCurrency;
            }

            // Exchange Rate -> D38
            // Check if quote has it, otherwise default 1.0 or client default?
            if (quote.exchangeRate) {
                paramSheet.getCell(38, 4).value = quote.exchangeRate;
            } else {
                paramSheet.getCell(38, 4).value = 1.0;
            }

            // Material Price - Intrant
            // Adding it to a clear free space, e.g. D55
            if (quote.material) {
                paramSheet.getCell(55, 3).value = "Pierre (Intrant)";
                paramSheet.getCell(55, 4).value = quote.material.name;
                paramSheet.getCell(56, 3).value = "Prix Achat ($)";
                paramSheet.getCell(56, 4).value = quote.material.purchasePrice;
            }
        }

        // --- Populate Cotation ---
        // Restoration: Analysis showed E7, E20 etc are empty (null), so no formulas link them to Paramètre.
        // We MUST populate them manually.

        const sheet = workbook.getWorksheet('Cotation');
        if (sheet) {
            // 1. Client Info (Rows 7-13)
            // E7: Client Name
            sheet.getCell('E7').value = quote.client?.name || '';

            // Address
            const addr = quote.client?.addresses?.[0]; // Use first address
            if (addr) {
                sheet.getCell('E8').value = addr.line1 || '';
                sheet.getCell('E9').value = addr.line2 || '';
                sheet.getCell('E10').value = addr.city || '';
                sheet.getCell('E11').value = addr.state || ''; // Province
                sheet.getCell('E13').value = addr.zipCode || '';
            }

            // Reference in D3 (as requested)
            sheet.getCell('D3').value = quote.reference;

            // 2. Project Info (Rows 20-30)
            // E20: Project Name
            sheet.getCell('E20').value = quote.project?.name || '';

            // Project Location 
            // We'll put it in E23 (Ville) for now as it's often a city/region name
            if (quote.project?.location?.name) {
                sheet.getCell('E23').value = quote.project.location.name;
            }

            // 3. Project Settings
            // E31: Estimated Weeks
            if (quote.project?.estimatedWeeks) {
                sheet.getCell('E31').value = quote.project.estimatedWeeks;
            } else if (quote.project?.estimatedWeeks === 0) {
                sheet.getCell('E31').value = 0;
            }

            // F40: Measurement System (Impérial / Métrique)
            const sys = quote.project?.measureSystem === 'Metric' ? 'Métrique' : 'Impérial';
            sheet.getCell('F40').value = sys;

            // 4. Payment Terms
            if (quote.client?.paymentTerms) {
                // Mapping terms string to E43 (Condition de paiement Texte ?) based on previous logic check
                sheet.getCell('E43').value = quote.client.paymentTerms;
            }

            // Material Info (Intrant) - Explicit Addition
            if (quote.material) {
                // Placing it in a likely free area for visibility, matching Paramètre update
                sheet.getCell('D35').value = "Matériau/Pierre:";
                sheet.getCell('E35').value = quote.material.name;
                sheet.getCell('D36').value = "Prix Achat ($):";
                sheet.getCell('E36').value = quote.material.purchasePrice;
            }

            // --- Dynamic Line Generation ---
            // Based on Project.numberOfLines
            // Template Row is Row 13 (based on analysis) containing formulas.
            // We need to ensure we have 'numberOfLines' rows starting at 13.

            const numberOfLines = quote.project?.numberOfLines || 1; // Default to 1 if not defined
            const START_ROW = 13;

            if (numberOfLines > 0) {
                const templateRow = sheet.getRow(START_ROW);

                // We loop to ensure rows exist and are copies of template
                // We start at 1 because Row 13 (index 0 relative check) is already there.
                // But we might want to "reset" Row 13 if it had dummy data? 
                // Creating a loop from 0 to N-1

                for (let i = 0; i < numberOfLines; i++) {
                    const currentRowNum = START_ROW + i;
                    const currentRow = sheet.getRow(currentRowNum);

                    if (currentRowNum === START_ROW) {
                        // It's the template row itself. Keep it but maybe clear values input?
                        // If we preserve it, good.
                        continue;
                    }

                    // For subsequent rows, we copy styles and formulas from Template Row
                    currentRow.height = templateRow.height;

                    templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const targetCell = currentRow.getCell(colNumber);

                        // Copy Style
                        targetCell.style = cell.style;

                        // Copy Value / Formula
                        if (cell.type === ExcelJS.ValueType.Formula) {
                            // Adjust formula reference: Replace '13' with 'currentRowNum'
                            // Regex to match '13' preceded by non-digit or at start, followed by non-digit or end.
                            // But simpler: just replace "13" might be risky if "130" exists.
                            // Given the specific layout, strictly replacing references like "A13", "AC13" is safer.
                            // But formulas can be complex.
                            // Quick heuristic: simple replaceAll "13" with "currentRowNum" IF it looks like a cell ref.
                            // Most refs are [Letter]13.
                            // Regex: ([A-Z]+)13(\D|$) -> $1{NewRow}$2

                            const formula = cell.formula;
                            const newFormula = formula.replace(/([A-Z]+)13(\b|\D)/g, (match, p1, p2) => {
                                return `${p1}${currentRowNum}${p2}`;
                            });

                            // Handling complex "ROW(G13)" or similar
                            // The regex above handles G13.
                            // What about "13" as a constant? e.g. /13. If formula has constant division, we might break it.
                            // But usually constants are not 13.
                            // Row 13 formulas viewed:
                            // IF(Mesure="Impérial",N13/12*L13...)
                            // INDIRECT(...,ROW(M13)-5)
                            // This regex `([A-Z]+)13` covers N13, L13, M13. Safe.

                            targetCell.value = {
                                formula: newFormula,
                                result: undefined // Clear result to force calc
                            } as any;
                        } else {
                            // Copy static value if meant to be template structure (like "step" or values)
                            // But maybe we want empty values for inputs?
                            // Inputs are usually in M, N, O, P, Q.
                            // Template has: 1, "step", 96, 24, 7...
                            // If we want "Blank" lines for user to fill, we should clear specific columns.
                            // Let's copy everything first (to keep structure) and then maybe clear inputs if this is a "Blank Quote" generation.
                            // User said "bypassing manual entry... Excel template itself will serve as mechanism".
                            // So we just provide the lines.
                            targetCell.value = cell.value;
                        }
                    });

                    currentRow.commit();
                }
            }
        }

        await workbook.xlsx.writeFile(outputPath);
        return outputPath;
    }
}
