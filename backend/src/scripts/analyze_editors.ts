import ExcelJS from 'exceljs';

const filePath = '/Users/thomasleguendekergolan/Downloads/files/excel soumission/Editeurs.xlsm';

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    console.log("Named Ranges:");
    // ExcelJS doesn't have a direct 'definedNames' array easily accessible in all versions or it's on workbook.definedNames
    // Let's try to access it if possible, or just iterate common expected names if known.
    // Actually, workbook.definedNames might be available.
    if ((workbook as any).definedNames) {
        (workbook as any).definedNames.forEach((name: any) => {
            console.log(`- ${name.name} : ${name.ranges}`);
        });
    } else {
        console.log("No definedNames API detected or empty.");
    }

    // Also re-verify sheet 1 just in case
    const sheet = workbook.worksheets[0];
    console.log(`Sheet 1: ${sheet.name}, Rows: ${sheet.rowCount}`);
}

analyze().catch(console.error);
