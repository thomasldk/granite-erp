
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { generateDeliveryNoteRak } from '../src/services/rakService';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting RAK Regeneration...");

    // Fetch all Delivery Notes with full includes required by rakService
    const notes = await prisma.deliveryNote.findMany({
        include: {
            client: {
                include: {
                    addresses: true,
                    contacts: true
                }
            },
            items: {
                include: {
                    pallet: {
                        include: {
                            workOrder: {
                                include: {
                                    quote: {
                                        include: {
                                            project: true,
                                            contact: true
                                        }
                                    }
                                }
                            },
                            items: {
                                include: {
                                    quoteItem: {
                                        include: {
                                            quote: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    console.log(`Found ${notes.length} Delivery Notes.`);

    for (const note of notes) {
        try {
            console.log(`Processing BL: ${note.reference}...`);
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
            console.log(`✅ Generated: ${outputPath}`);
        } catch (error) {
            console.error(`❌ Failed to generate for ${note.reference}:`, error);
        }
    }

    console.log("Regeneration Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
