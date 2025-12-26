import jwt from 'jsonwebtoken';
import { exec } from 'child_process';

const JWT_SECRET = 'granite-erp-super-secret-key-2025';
const token = jwt.sign({ id: 'test', email: 'test@granite.com', role: 'ADMIN' }, JWT_SECRET);

console.log("Token:", token);

const id = '46db458d-6da6-4d6d-8eb2-59eb20d376ae'; // From previous check_db
const urlPdf = `http://localhost:5006/api/delivery/notes/${id}/download?type=pdf&token=${token}`;
const urlExcel = `http://localhost:5006/api/delivery/notes/${id}/download?type=excel&token=${token}`;

console.log(`\nTesting PDF Download: ${urlPdf}`);
exec(`curl -v "${urlPdf}" -o test_download.pdf`, (err, stdout, stderr) => {
    if (err) console.error("PDF Curl Error:", stderr);
    else console.log("PDF Download Success (Size check pending)");
});

console.log(`\nTesting Excel Download: ${urlExcel}`);
exec(`curl -v "${urlExcel}" -o test_download.xlsx`, (err, stdout, stderr) => {
    if (err) console.error("Excel Curl Error:", stderr);
    else console.log("Excel Download Success (Size check pending)");
});
