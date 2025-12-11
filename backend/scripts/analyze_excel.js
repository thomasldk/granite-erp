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
const exceljs_1 = __importDefault(require("exceljs"));
function analyze() {
    return __awaiter(this, void 0, void 0, function* () {
        const workbook = new exceljs_1.default.Workbook();
        // Path might need adjustment depending on where script is run
        const templatePath = '/Users/thomasleguendekergolan/Downloads/files/excel soumission/Modele de cotation defaut.xlsx';
        yield workbook.xlsx.readFile(templatePath);
        console.log('--- Defined Names (Named Ranges) ---');
        // ExcelJS exposes defined names via workbook.definedNames mostly? 
        // Actually properties are usually on worksheet or workbook names.
        // Let's dump workbook.names structure if possible or iterator.
        // Note: ExcelJS documentation says `workbook.definedNames` might handle this but sometimes it's `workbook.names`. 
        // Let's try to access definitions.
        // In some versions it's workbook.definedNames.model 
        // Let's try to look for specific names if we know them.
        const namesToCheck = ['LangueColonne', 'codeDevise', 'Langue', 'Devise'];
        // Manual scan or access internal if needed, but let's try standard check only if available.
        // A better way is to see if we can find where they point by guessing or checking if ExcelJS loaded them.
        // Alternative: Scan cells that look like parameters again in 'Paramètre' sheet.
        // Row 39 was [3]=Langue [4]=en. Maybe [5]=[Object] is the named range definition?
        const paramSheet = workbook.getWorksheet('Paramètre');
        if (paramSheet) {
            console.log('Re-scanning Paramètre sheet for parameter clues...');
            [38, 39, 40, 41, 42, 65].forEach(r => {
                const row = paramSheet.getRow(r);
                console.log(`Row ${r}:`, JSON.stringify(row.values));
            });
        }
        // Checking if we can list names
        // @ts-ignore
        if (workbook.names) {
            // @ts-ignore
            workbook.names.forEach(name => {
                console.log(`Name: ${name.name} -> ${JSON.stringify(name.ranges)}`);
            });
        }
        console.log('Analyzing Sheet: Cotation');
        const sheet = workbook.getWorksheet('Cotation');
        if (sheet) {
            sheet.eachRow((row, rowNumber) => {
                // Log valuable rows to find the Item Table
                // Looking for keywords: Description, Qté, Prix, Total, etc.
                const values = row.values;
                if (Array.isArray(values) && values.some(v => v && v.toString().toLowerCase().includes('description'))) {
                    console.log(`HEADER FOUND at Row ${rowNumber}:`, JSON.stringify(values));
                }
            });
            // Inspect Top Rows (Client/Project Info) to see if they assume formulas
            for (let i = 7; i <= 30; i++) {
                const row = sheet.getRow(i);
                // We want to see if cells like E7 (Col 5) have formulas
                const cellE = row.getCell(5);
                console.log(`Row ${i} Col E:`, JSON.stringify(cellE.value));
            }
            // Also dump rows 50-70 specifically as they are likely candidate for items
            for (let i = 50; i < 70; i++) {
                const row = sheet.getRow(i);
                console.log(`Row ${i}:`, JSON.stringify(row.values));
            }
        }
        else {
            console.log('Sheet Cotation not found!');
        }
    });
}
analyze().catch(err => console.error(err));
