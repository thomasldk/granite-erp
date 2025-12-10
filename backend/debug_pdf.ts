
import { PdfService } from './src/services/pdfService';
import * as fs from 'fs';

// Mock data
const mockQuote: any = {
    reference: "TEST-QUOTE",
    client: { name: "Test Client" },
    project: { name: "Test Project", reference: "P001" },
    contact: { firstName: "John", lastName: "Doe" },
    items: [
        {
            description: "Test Item",
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
            unitPriceCad: 100,
            totalPriceCad: 200
        }
    ],
    currency: "CAD"
};

async function test() {
    try {
        console.log("Generating PDF...");
        const buffer = await PdfService.generateQuotePdf(mockQuote);
        fs.writeFileSync('test_output.pdf', buffer);
        console.log("PDF generated successfully: test_output.pdf");
    } catch (e) {
        console.error("PDF Generation Failed:", e);
    }
}

test();
