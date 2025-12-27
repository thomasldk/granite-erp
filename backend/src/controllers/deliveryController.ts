import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateDeliveryNoteRak } from '../services/rakService';
import { Resend } from 'resend';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// Get Ready Pallets
export const getReadyPallets = async (req: Request, res: Response) => {
    try {
        const pallets = await prisma.pallet.findMany({
            where: {
                status: 'Validé', // Matched DB value
                deliveryItem: null // Ensure pallet is not already in a Delivery Note
            },
            include: {
                workOrder: {
                    include: {
                        quote: {
                            include: {
                                client: {
                                    include: { addresses: true }
                                },
                                project: true
                            }
                        }
                    }
                },
                items: {
                    include: {
                        quoteItem: true
                    }
                }
            }
        });

        // Group by Client -> Project if needed by Frontend, or just return flat list
        // Returning flat list for flexibility
        res.json(pallets);
    } catch (error) {
        console.error("Error fetching ready pallets:", error);
        res.status(500).json({ error: "Failed to fetch status" });
    }
};

// Create Delivery Note
export const createDeliveryNote = async (req: Request, res: Response) => {
    try {
        const { clientId, date, carrier, address, palletIds, siteContactName, siteContactPhone, siteContactEmail, freightCost } = req.body;

        if (!clientId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Fetch Client for Default Broker Fee
        const client = await prisma.thirdParty.findUnique({
            where: { id: clientId },
            select: { customsBrokerFee: true }
        });

        // Generate Reference (BL-YY-XXXX)
        const year = new Date().getFullYear().toString().slice(-2);

        // Fix: Use findFirst with orderBy to get the last one, instead of count
        const lastNote = await prisma.deliveryNote.findFirst({
            where: {
                reference: {
                    startsWith: `BL${year}-`
                }
            },
            orderBy: {
                reference: 'desc'
            }
        });

        let nextNum = 1;
        if (lastNote) {
            const parts = lastNote.reference.split('-');
            const lastNum = parseInt(parts[1], 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }

        const reference = `BL${year}-${nextNum.toString().padStart(4, '0')}`;

        // Calculate Total Weight
        // We need to fetch pallets to sum weights
        const pallets = await prisma.pallet.findMany({
            where: { id: { in: palletIds } },
            include: { items: { include: { quoteItem: true } } }
        });

        let totalWeight = 0;
        pallets.forEach(p => {
            p.items.forEach(pi => {
                totalWeight += (pi.quoteItem.totalWeight || 0); // Logic might need adjustment if quantity is partial
            });
        });

        // Transaction: Create Note, Create Items, Update Pallets
        const result = await prisma.$transaction(async (tx) => {
            // Create Note
            const note = await tx.deliveryNote.create({
                data: {
                    reference,
                    clientId,
                    date: new Date(date),
                    carrier,
                    deliveryAddress: address,
                    status: 'Draft', // Default to Draft as per user requirement
                    totalWeight,
                    siteContactName,
                    siteContactPhone,
                    siteContactEmail,
                    siteContactRole: req.body.siteContactRole,
                    freightCost: freightCost ? parseFloat(freightCost) : 0,
                    customsBrokerFee: client?.customsBrokerFee || 0, // New Default
                    createdById: (req as any).user?.id // Save creator
                }
            });

            // Auto-Save Address to Client if provided
            console.log("Auto-Save Address Check:", { addressId: req.body.addressId, line1: req.body.addrLine1 });
            if (req.body.addressId) {
                // Update Existing Address Contact Info
                await tx.address.update({
                    where: { id: req.body.addressId },
                    data: {
                        siteContactName: siteContactName,
                        siteContactPhone: siteContactPhone,
                        siteContactEmail: siteContactEmail,
                        siteContactRole: req.body.siteContactRole
                    }
                });
            } else if (req.body.addrLine1) {
                const { addrLine1, addrCity, addrState, addrZip, addrCountry } = req.body;

                // Check for existing duplicate to avoid spamming
                const existing = await tx.address.findFirst({
                    where: {
                        thirdPartyId: clientId,
                        line1: addrLine1,
                        city: addrCity,
                        zipCode: addrZip
                    }
                });

                if (!existing) {
                    await tx.address.create({
                        data: {
                            thirdPartyId: clientId,
                            type: 'Delivery', // Chantier/Livraison
                            line1: addrLine1,
                            city: addrCity || '',
                            state: addrState || '',
                            zipCode: addrZip || '',
                            country: addrCountry || 'Canada',
                            siteContactName: siteContactName,
                            siteContactPhone: siteContactPhone,
                            siteContactEmail: siteContactEmail,
                            siteContactRole: req.body.siteContactRole
                        }
                    });
                } else {
                    // Update the found existing address with new contact info
                    await tx.address.update({
                        where: { id: existing.id },
                        data: {
                            siteContactName: siteContactName,
                            siteContactPhone: siteContactPhone,
                            siteContactEmail: siteContactEmail,
                            siteContactRole: req.body.siteContactRole
                        }
                    });
                }
            }

            // Create Items & Update Pallets
            for (const palletId of palletIds) {
                await tx.deliveryNoteItem.create({
                    data: {
                        deliveryNoteId: note.id,
                        palletId
                    }
                });

                // No longer setting status to 'Shipped' immediately. 
                // Pallet remains 'Validé' but is linked to a Note, so getReadyPallets will exclude it.
            }

            return note;
        });

        res.json(result);

    } catch (error: any) {
        console.error("Error creating delivery note:", error);
        try {
            fs.appendFileSync(path.join(__dirname, '../../backend_error.log'), `[${new Date().toISOString()}] Create Delivery Note Error: ${error.message}\nStack: ${error.stack}\n`);
        } catch (e) { console.error("Failed to write log", e); }
        res.status(500).json({ error: "Failed to create delivery note: " + error.message });
    }
};

// Get Delivery Notes List
export const getDeliveryNotes = async (req: Request, res: Response) => {
    try {
        const notes = await prisma.deliveryNote.findMany({
            include: {
                client: {
                    include: {
                        addresses: true,
                        contacts: true,
                        customsBroker: true
                    }
                },
                createdBy: true, // Include Creator
                items: {
                    include: {
                        pallet: {
                            include: {
                                items: {
                                    include: { quoteItem: true }
                                },
                                workOrder: {
                                    include: {
                                        projectManager: true,
                                        accountingContact: true,
                                        additionalContacts: { include: { contact: true, role: true } },
                                        quote: {
                                            include: { project: true, contact: true, representative: true }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch delivery notes" });
    }
};

// Update Delivery Note
export const updateDeliveryNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { date, carrier, deliveryAddress, siteContactName, siteContactPhone, siteContactEmail, status, freightCost, customsBrokerFee } = req.body;

        const updatedNote = await prisma.deliveryNote.update({
            where: { id },
            data: {
                date: date ? new Date(date) : undefined,
                carrier,
                deliveryAddress,
                siteContactName,
                siteContactPhone,
                siteContactEmail,
                status,
                freightCost: freightCost !== undefined ? parseFloat(freightCost) : undefined,
                customsBrokerFee: customsBrokerFee !== undefined ? parseFloat(customsBrokerFee) : undefined // New
            },
            include: {
                client: {
                    include: {
                        addresses: true,
                        customsBroker: true
                    }
                },
                createdBy: true,
                items: {
                    include: {
                        pallet: {
                            include: {
                                workOrder: {
                                    include: {
                                        projectManager: true,
                                        accountingContact: true,
                                        additionalContacts: { include: { contact: true, role: true } },
                                        quote: { include: { project: true, representative: true } }
                                    }
                                },
                                items: { include: { quoteItem: true } }
                            }
                        }
                    }
                }
            }
        });

        res.json(updatedNote);
    } catch (error) {
        console.error("Error updating delivery note:", error);
        res.status(500).json({ error: "Failed to update delivery note" });
    }
};

// Get Delivery Note Detail
export const getDeliveryNoteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: {
                client: {
                    include: { customsBroker: true }
                },
                createdBy: true,
                items: {
                    include: {
                        pallet: {
                            include: {
                                workOrder: {
                                    include: {
                                        projectManager: true,
                                        accountingContact: true,
                                        additionalContacts: { include: { contact: true, role: true } },
                                        quote: { include: { project: true, contact: true, representative: true } }
                                    }
                                },
                                items: { include: { quoteItem: true } }
                            }
                        }
                    }
                }
            }
        });
        if (!note) return res.status(404).json({ error: "Note not found" });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch note" });
    }
};

// Delete Delivery Note
export const deleteDeliveryNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Verify it exists
        const existing = await prisma.deliveryNote.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: "Note not found" });

        // Optional: Reset pallet status to 'Validé' so they can be shipped again?
        // For now, just delete the note. Cascading delete might be needed for items
        // depending on schema. Assuming CASCADE or manual cleanup.
        // Let's manually cleanup items to be safe and reset pallets.

        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: { items: true }
        });

        if (note && note.items.length > 0) {
            const palletIds = note.items.map(i => i.palletId);
            // Reset pallets to Validé
            await prisma.pallet.updateMany({
                where: { id: { in: palletIds } },
                data: { status: 'Validé' }
            });
        }

        // Delete Note (Cascades items usually, but explicit is fine)
        await prisma.deliveryNote.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error("Error deleting delivery note:", error);
        res.status(500).json({ error: "Failed to delete note" });
    }
};

// Generate PDF
export const createPdf = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: {
                client: true,
                items: {
                    include: {
                        pallet: {
                            include: {
                                workOrder: { include: { quote: { include: { project: true } } } },
                                items: { include: { quoteItem: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!note) {
            return res.status(404).json({ error: "Delivery Note not found" });
        }

        const pdfService = await import('../services/pdfService');
        const pdfBuffer = await pdfService.PdfService.generateDeliveryNotePdf(note);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=BL-${note.reference}.pdf`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
};

// Add Pallet to Note
export const addPalletToNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { palletId } = req.body;

        const note = await prisma.deliveryNote.findUnique({ where: { id } });
        if (!note) return res.status(404).json({ error: "Note not found" });

        const pallet = await prisma.pallet.findUnique({
            where: { id: palletId },
            include: { deliveryItem: true }
        });

        if (!pallet) return res.status(404).json({ error: "Pallet not found" });
        if (pallet.deliveryItem) return res.status(400).json({ error: "Pallet already in a delivery note" });

        await prisma.deliveryNoteItem.create({
            data: {
                deliveryNoteId: id,
                palletId
            }
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Error adding pallet:", error);
        res.status(500).json({ error: "Failed to add pallet" });
    }
};

// Remove Pallet from Note
export const removePalletFromNote = async (req: Request, res: Response) => {
    try {
        const { id, palletId } = req.params;

        const note = await prisma.deliveryNote.findUnique({ where: { id } });
        if (!note) return res.status(404).json({ error: "Note not found" });

        const item = await prisma.deliveryNoteItem.findUnique({
            where: { palletId }
        });

        if (!item || item.deliveryNoteId !== id) {
            return res.status(404).json({ error: "Pallet not found in this note" });
        }

        await prisma.deliveryNoteItem.delete({
            where: { id: item.id }
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Error removing pallet:", error);
        res.status(500).json({ error: "Failed to remove pallet" });
    }
};

// Queue RAK for Agent
// Force Restart (RAK Address V2 Logic)
export const queueDeliveryRak = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: {
                client: {
                    include: {
                        addresses: true,
                        contacts: true,
                        customsBroker: true
                    }
                },
                items: { include: { pallet: { include: { workOrder: { include: { quote: { include: { project: true, contact: true } } } }, items: { include: { quoteItem: { include: { quote: { include: { project: true } } } } } } } } } }
            }
        });

        if (!note) return res.status(404).json({ error: "Delivery Note not found" });

        const xmlContent = await generateDeliveryNoteRak(note);

        // Save to Pending XML for Agent
        const safeRef = note.reference.replace(/[^a-zA-Z0-9-]/g, '_');
        const filename = `${safeRef}.rak`;
        const outputPath = path.join(process.cwd(), 'pending_xml', filename);

        // Ensure pending_xml exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }


        fs.writeFileSync(outputPath, xmlContent);
        console.log(`[RAK] Delivery Note Queued: ${outputPath}`);

        // RESET STATUS TO DRAFT (or PENDING) SO FRONTEND WAITS
        await prisma.deliveryNote.update({
            where: { id },
            data: { status: 'Draft' }
        });

        res.json({ message: "Sent to Agent", status: "PENDING_AGENT" });


    } catch (error) {
        console.error("Queue Rak Error:", error);
        res.status(500).json({ error: "Failed to queue RAK" });
    }
};

// Check Status & Process Return
export const checkDeliveryStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const note = await prisma.deliveryNote.findUnique({ where: { id } });
        if (!note) return res.status(404).json({ error: "Note not found" });

        // HYBRID SYNC FIX:
        // We do NOT poll the folder anymore because the Agent uploads the result.
        // If we poll, we might detect the XML before the Agent uploads the Excel/PDF.
        // We rely on 'syncController.uploadExcel' to update the status to 'Generated'.

        res.json({ status: note.status === 'Generated' ? 'Visualiser' : (note.status === 'Draft' ? 'Pending' : 'Visualiser') });

    } catch (error) {
        console.error("Check Status Error:", error);
        res.status(500).json({ error: "Error checking status" });
    }
};

const processDeliveryReturn = async (noteId: string, xmlPath: string, note: any) => {
    try {
        const xmlContent = fs.readFileSync(xmlPath, 'utf-8');
        const cibleMatch = xmlContent.match(/cible=['"](.*?)['"]/);
        const ciblePath = cibleMatch ? cibleMatch[1] : ''; // F:\BL\...

        // Update DB
        await prisma.deliveryNote.update({
            where: { id: noteId },
            data: {
                status: 'Generated',
                pdfFilePath: ciblePath.replace('.xlsx', '.pdf'),
                excelFilePath: ciblePath
            }
        });

        // Move XML to processed
        try {
            fs.renameSync(xmlPath, xmlPath + '.processed');
        } catch (e) { console.error("Could not rename XML", e); }

    } catch (e) {
        console.error("Process Return Error:", e);
    }
};

// Download Generated File (Excel/PDF)
export const downloadDeliveryFile = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { type } = req.query; // 'excel' or 'pdf'

    try {
        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            include: {
                client: true,
                items: { include: { pallet: { include: { workOrder: { include: { quote: { include: { project: true } } } }, items: { include: { quoteItem: { include: { quote: true } } } } } } } }
            }
        });
        if (!note) return res.status(404).json({ error: "Note not found" });

        if (type === 'excel') {
            // Serve the uploaded Excel
            let filePath = note.excelFilePath;

            // Fallback: Check uploads/ by Reference naming convention if filePath is remote/missing
            if (!filePath || filePath.startsWith('F:') || filePath.startsWith('/')) {
                const uploadsDir = path.join(process.cwd(), 'uploads');
                try {
                    const fileSearch = fs.readdirSync(uploadsDir).find(f => f.includes(note.reference) && f.endsWith('.xlsx'));
                    if (fileSearch) {
                        filePath = `uploads/${fileSearch}`;
                    }
                } catch (e) { }
            }

            if (filePath && !filePath.startsWith('F:') && fs.existsSync(path.join(process.cwd(), filePath))) {
                const absolutePath = path.join(process.cwd(), filePath);
                // Use the actual filename from disk (which now has the correct format)
                res.download(absolutePath, path.basename(absolutePath));
            } else {
                res.status(404).json({ error: "Fichier Excel non disponible." });
            }


        } else if (type === 'pdf') {
            // Priority: Serve Uploaded PDF from Agent
            let pdfServed = false;
            // Check if pdfFilePath is valid and exists locally (uploads/)
            if (note.pdfFilePath && !note.pdfFilePath.startsWith('F:') && fs.existsSync(path.join(process.cwd(), note.pdfFilePath))) {
                const absolutePath = path.join(process.cwd(), note.pdfFilePath);
                res.download(absolutePath, path.basename(absolutePath));
                pdfServed = true;
            }

            // Fallback: Check uploads by Ref if database path is missing/wrong
            if (!pdfServed) {
                const uploadsDir = path.join(process.cwd(), 'uploads');
                try {
                    const pdfSearch = fs.readdirSync(uploadsDir).find(f => f.includes(note.reference) && f.endsWith('.pdf'));
                    if (pdfSearch) {
                        res.download(path.join(uploadsDir, pdfSearch), pdfSearch);
                        pdfServed = true;
                    }
                } catch (e) { }
            }

            if (!pdfServed) {
                // Final Fallback blocked: Generate Local PDF
                console.log("[Download] Generating local PDF fallback.");
                const pdfService = await import('../services/pdfService');
                const pdfBuffer = await pdfService.PdfService.generateDeliveryNotePdf(note);

                // PERSISTENCE FIX: Save to Uploads and Update DB
                const filename = `BL-${note.reference}.pdf`;
                const uploadsDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                const savePath = path.join(uploadsDir, filename);
                fs.writeFileSync(savePath, pdfBuffer);
                console.log(`[Download] Saved generated PDF to ${savePath}`);

                // Update DB so "Emit BL" button becomes active
                await prisma.deliveryNote.update({
                    where: { id: note.id },
                    data: {
                        pdfFilePath: `uploads/${filename}`,
                        status: 'Generated'
                    }
                });

                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=${filename}`,
                    'Content-Length': pdfBuffer.length
                });
                res.send(pdfBuffer);
            }
        } else {
            res.status(400).json({ error: "Invalid file type" });
        }


    } catch (e) {
        console.error("Download Error:", e);
        res.status(500).json({ error: "Download failed" });
    }
};

// Send Email
export const sendDeliveryEmail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { recipients, cc, bcc, subject, message, clientPOFilePath } = req.body;

        if ((!recipients || recipients.length === 0) && (!cc || cc.length === 0)) {
            return res.status(400).json({ error: "No recipients specified" });
        }


        const note = await prisma.deliveryNote.findUnique({
            where: { id },
            // ... existing include logic ...
            include: {
                client: {
                    include: {
                        addresses: true,
                        contacts: true,
                        customsBroker: true
                    }
                },
                items: {
                    include: {
                        pallet: {
                            include: {
                                workOrder: { include: { quote: { include: { project: true } } } },
                                items: { include: { quoteItem: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!note) {
            return res.status(404).json({ error: "Delivery Note not found" });
        }

        // PDF Generation / Retrieval Logic
        // Priority: Serve Uploaded PDF from Agent
        let pdfBuffer: Buffer | null = null;
        const uploadsDir = path.join(process.cwd(), 'uploads');
        let filename = `BL-${note.reference}.pdf`;

        // 1. Check if pdfFilePath is valid and exists locally
        if (note.pdfFilePath && !note.pdfFilePath.startsWith('F:') && fs.existsSync(path.join(process.cwd(), note.pdfFilePath))) {
            const absolutePath = path.join(process.cwd(), note.pdfFilePath);
            pdfBuffer = fs.readFileSync(absolutePath);
            filename = path.basename(absolutePath);
            console.log(`[Email] Attached official PDF from DB path: ${filename}`);
        }

        // 2. Fallback: Search uploads/ by Reference if DB path is missing/wrong (Agent sync might have happened but DB update lagged or path mismatch)
        if (!pdfBuffer) {
            try {
                const pdfSearch = fs.readdirSync(uploadsDir).find(f => f.includes(note.reference) && f.endsWith('.pdf') && !f.startsWith('BL-')); // Exclude BL- prefix which is usually our generated one? Or include? Agent format is usually "Reference...pdf" w/o BL- prefix maybe? 
                // Actually Agent filename is usually just Reference if simple, or complex. 
                // Let's rely on 'includes(reference)'.
                if (pdfSearch) {
                    const flPath = path.join(uploadsDir, pdfSearch);
                    pdfBuffer = fs.readFileSync(flPath);
                    filename = pdfSearch;
                    console.log(`[Email] Attached official PDF found in uploads: ${filename}`);
                }
            } catch (e) { }
        }

        // 3. Final Fallback: Generate Local PDF
        if (!pdfBuffer) {
            console.log("[Email] Generating local PDF fallback (official not found).");
            const pdfService = await import('../services/pdfService');
            pdfBuffer = await pdfService.PdfService.generateDeliveryNotePdf(note);
            filename = `BL-${note.reference}.pdf`;
        }

        // Compose Email
        const emailHtml = message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : `
            <p>Bonjour,</p>
            <p>Veuillez trouver ci-joint le Bon de Livraison <strong>${note.reference}</strong>.</p>
            <p>Cordialement,</p>
            <p><strong>L'équipe Granite DRC</strong></p>
        `;

        // Send via Resend
        // Force DEV MODE override (Default to DEV if not explicitly PRODUCTION)
        const isDev = process.env.NODE_ENV !== 'production';
        const finalTo = isDev ? ['thomasldk@granitedrc.com'] : recipients;
        const finalCc = isDev ? [] : cc;
        const finalBcc = isDev ? [] : bcc;

        console.log(`[Email] Sending BL ${note.reference} TO: ${finalTo?.join(', ')} CC: ${finalCc?.join(', ')}`);

        // Prepare Attachments
        const attachments: any[] = [
            {
                filename: filename,
                content: pdfBuffer,
            }
        ];

        // Attach Client PO if available
        if (clientPOFilePath) {
            try {
                // Ensure path is safe/local
                // Path format from DB: "uploads/filename.pdf" or "F:/..."
                let poPath = '';
                if (clientPOFilePath.startsWith('uploads/') || clientPOFilePath.startsWith('uploads\\')) {
                    poPath = path.join(process.cwd(), clientPOFilePath);
                } else {
                    // If absolute path (F:), try to read it directly? Or ignore?
                    // Backend might not have access to mapped drives in same way, but usually node can read if user has perm.
                    // Safe approach: check exists.
                    poPath = clientPOFilePath;
                }

                if (fs.existsSync(poPath)) {
                    const poBuffer = fs.readFileSync(poPath);
                    const poFilename = path.basename(poPath);
                    attachments.push({
                        filename: poFilename, // Keep original name e.g. PO123.pdf
                        content: poBuffer
                    });
                    console.log(`[Email] Attached Client PO: ${poFilename}`);
                } else {
                    console.warn(`[Email] Client PO file not found at: ${poPath}`);
                }
            } catch (err) {
                console.error(`[Email] Error attaching PO:`, err);
            }
        }

        const { data, error } = await resend.emails.send({
            from: 'Livraisons Granite DRC <onboarding@resend.dev>',
            to: finalTo,
            cc: finalCc,
            bcc: finalBcc,
            subject: subject || `Bon de Livraison ${note.reference}`,
            html: emailHtml,
            attachments: attachments,
        });

        if (error) {
            console.error('Resend API Error:', error);
            return res.status(500).json({ error: 'Failed to send email via Resend', details: error });
        }

        console.log(`[Email] Sent successfully! ID: ${data?.id}`);
        res.json({ success: true, id: data?.id });

    } catch (error: any) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send email", details: { message: error.message || String(error) } });
    }
};
