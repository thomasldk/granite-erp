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
const filePath = '/Users/thomasleguendekergolan/Downloads/files/excel soumission/Editeurs.xlsm';
function analyze() {
    return __awaiter(this, void 0, void 0, function* () {
        const workbook = new exceljs_1.default.Workbook();
        yield workbook.xlsx.readFile(filePath);
        console.log("Named Ranges:");
        // ExcelJS doesn't have a direct 'definedNames' array easily accessible in all versions or it's on workbook.definedNames
        // Let's try to access it if possible, or just iterate common expected names if known.
        // Actually, workbook.definedNames might be available.
        if (workbook.definedNames) {
            workbook.definedNames.forEach((name) => {
                console.log(`- ${name.name} : ${name.ranges}`);
            });
        }
        else {
            console.log("No definedNames API detected or empty.");
        }
        // Also re-verify sheet 1 just in case
        const sheet = workbook.worksheets[0];
        console.log(`Sheet 1: ${sheet.name}, Rows: ${sheet.rowCount}`);
    });
}
analyze().catch(console.error);
