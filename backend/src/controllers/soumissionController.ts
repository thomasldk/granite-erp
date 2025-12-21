import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';

// const prisma = new PrismaClient();

// --- PROJECTS ---

export const getNextProjectReference = async (req: Request, res: Response) => {
    try {
        const year = new Date().getFullYear().toString().slice(-2); // 25
        const prefix = `P${year}-`;

        const lastProject = await prisma.project.findFirst({
            where: { reference: { startsWith: prefix } },
            orderBy: { createdAt: 'desc' }
        });

        let nextNum = 1;
        if (lastProject) {
            const parts = lastProject.reference.split('-');
            if (parts.length >= 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) nextNum = num + 1;
            }
        }

        const reference = `${prefix}${nextNum.toString().padStart(4, '0')}`;
        res.json({ reference });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate project reference' });
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { name, thirdPartyId, status, locationId, locationName, measureSystem, estimatedWeeks, numberOfLines, reference: providedRef } = req.body;

        let reference = providedRef;

        // If no reference provided, generate one
        if (!reference) {
            const year = new Date().getFullYear().toString().slice(-2);
            const prefix = `P${year}-`;
            const lastProject = await prisma.project.findFirst({
                where: { reference: { startsWith: prefix } },
                orderBy: { createdAt: 'desc' }
            });
            let nextNum = 1;
            if (lastProject) {
                const parts = lastProject.reference.split('-');
                if (parts.length >= 2) {
                    const num = parseInt(parts[1]);
                    if (!isNaN(num)) nextNum = num + 1;
                }
            }
            reference = `${prefix}${nextNum.toString().padStart(4, '0')}`;
        }

        let finalLocationId = locationId;

        // Handle text-based location creation/lookup
        if (!finalLocationId && locationName) {
            // Try to find existing by name
            const existingLoc = await prisma.projectLocation.findUnique({
                where: { name: locationName }
            });

            if (existingLoc) {
                finalLocationId = existingLoc.id;
            } else {
                // Create new
                const newLoc = await prisma.projectLocation.create({
                    data: { name: locationName }
                });
                finalLocationId = newLoc.id;
            }
        }

        const project = await prisma.project.create({
            data: {
                name,
                reference,
                status: status || 'Prospect',
                thirdPartyId: thirdPartyId || undefined, // Optional now
                locationId: finalLocationId || undefined,
                measureSystem: measureSystem || 'Imperial',
                estimatedWeeks: estimatedWeeks ? parseInt(estimatedWeeks) : undefined,
                numberOfLines: numberOfLines ? parseInt(numberOfLines) : undefined
            }
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project', details: error });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, thirdPartyId, status, locationId, locationName, measureSystem, estimatedWeeks, numberOfLines } = req.body;

        let finalLocationId = locationId;

        // Handle text-based location creation/lookup
        if (locationName) {
            // Try to find existing by name
            const existingLoc = await prisma.projectLocation.findUnique({
                where: { name: locationName }
            });

            if (existingLoc) {
                finalLocationId = existingLoc.id;
            } else {
                // Create new
                const newLoc = await prisma.projectLocation.create({
                    data: { name: locationName }
                });
                finalLocationId = newLoc.id;
            }
        }

        // Build data object dynamically to allow partial updates
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (measureSystem !== undefined) updateData.measureSystem = measureSystem;

        // Handle Nullable fields: If present but empty/falsy/null, set to null. If undefined, ignore.
        // For IDs/Relations:
        if (thirdPartyId !== undefined) updateData.thirdPartyId = thirdPartyId || null;
        if (finalLocationId !== undefined || locationId !== undefined) updateData.locationId = finalLocationId || null;

        // For Numbers:
        if (estimatedWeeks !== undefined) updateData.estimatedWeeks = estimatedWeeks ? parseInt(estimatedWeeks) : null;
        if (numberOfLines !== undefined) updateData.numberOfLines = numberOfLines ? parseInt(numberOfLines) : null;

        const project = await prisma.project.update({
            where: { id },
            data: updateData
        });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project', details: error });
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                client: true,
                quotes: {
                    include: {
                        client: {
                            include: { addresses: true }
                        },
                        material: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                location: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};

// ... (existing getProjects) ...

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Manual Cascade: Delete related quotes first (items are deleted by deleteQuote logic usually, but here we do raw deleteMany)
        // First find quotes to delete their items? Or trust Cascade if defined?
        // Let's do manual clean up to be safe.
        const quotes = await prisma.quote.findMany({ where: { projectId: id } });
        for (const q of quotes) {
            await prisma.quoteItem.deleteMany({ where: { quoteId: q.id } });
        }
        await prisma.quote.deleteMany({ where: { projectId: id } });

        // Finally delete project
        await prisma.project.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ error: 'Failed to delete project', details: error });
    }
};

// --- QUOTES ---

export const createQuote = async (req: Request, res: Response) => {
    try {
        const { projectId, thirdPartyId, contactId, currency } = req.body;

        if (!thirdPartyId) {
            return res.status(400).json({ error: 'ThirdPartyId is required for a quote' });
        }

        // Generate reference logic: DRC25-XXXX-C0R0
        const year = new Date().getFullYear().toString().slice(-2);

        // Find last quote to increment sequence
        const lastQuote = await prisma.quote.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        let sequence = '0001';
        if (lastQuote && lastQuote.reference && lastQuote.reference.startsWith(`DRC${year}-`)) {
            // Try to extract the 4 digits
            const parts = lastQuote.reference.split('-');
            if (parts.length >= 2) {
                const num = parseInt(parts[1]);
                if (!isNaN(num)) {
                    sequence = (num + 1).toString().padStart(4, '0');
                }
            }
        } else if (lastQuote && !lastQuote.reference.startsWith(`DRC${year}-`)) {
            // Reset sequence if new year or different pattern? 
            // Ideally we just count, but let's stick to 0001 if no pattern match for safety or simplicity
            // Actually, if we have previous quotes (Q-...), we should probably just count total?
            // Let's stick to finding the last *matching* pattern or just counting.
            // Safest simple logical increment:
            const count = await prisma.quote.count();
            sequence = (count + 1).toString().padStart(4, '0');
        }

        const reference = `DRC${year}-${sequence}-C0R0`;

        const quote = await prisma.quote.create({
            data: {
                reference,
                projectId,
                thirdPartyId,
                contactId,
                currency: currency || 'CAD',
                status: 'Draft',
                version: 1
            }
        });
        res.status(201).json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create quote', details: error });
    }
};

export const getQuoteById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                project: { include: { client: true } },
                items: true // No longer relational to catalog
            }
        });
        if (!quote) return res.status(404).json({ error: 'Quote not found' });
        res.json(quote);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quote' });
    }
};

export const addQuoteItem = async (req: Request, res: Response) => {
    try {
        const { quoteId } = req.params;
        // Updated payload to match free-text schema:
        const {
            tag, material,
            description, quantity, unit,
            length, width, thickness
        } = req.body;

        // Basic Price defaults (User sets this later in Excel usually, but we init to 0)
        let unitPrice = 0;
        const totalPrice = 0;

        const item = await prisma.quoteItem.create({
            data: {
                quoteId,
                tag,
                material,
                description,
                quantity: parseFloat(quantity),
                unit,
                length: length ? parseFloat(length) : undefined,
                width: width ? parseFloat(width) : undefined,
                thickness: thickness ? parseFloat(thickness) : undefined,
                unitPrice,
                totalPrice
            }
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add item', details: error });
    }
};
export const deleteQuote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Manually delete related items first to ensure no FK constraint error
        // even if DB cascade is missing
        await prisma.quoteItem.deleteMany({
            where: { quoteId: id }
        });

        // Now delete the quote
        await prisma.quote.delete({ where: { id } });

        res.status(204).send();
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Failed to delete quote', details: error });
    }
};

import { XmlService } from '../services/xmlService';

export const generateQuoteXml = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                project: true,
                client: { include: { addresses: true, contacts: true, paymentTerm: true } },
                items: true, // Removed productionSite include as it's not used in XML anymore and caused type issues
                contact: true,
                material: true
            }
        });

        if (!quote) return res.status(404).json({ error: 'Quote not found' });

        const quoteAny = quote as any; // Cast to any to avoid strict type checks on deep relations

        // Fetch Representative if exists
        let rep = null;
        if (quoteAny.client?.repName) {
            const [firstName, ...rest] = quoteAny.client.repName.split(' ');
            const lastName = rest.join(' ');
            rep = await prisma.representative.findFirst({
                where: {
                    firstName: { contains: firstName },
                    lastName: { contains: lastName }
                }
            });
        }

        const xmlService = new XmlService();
        const xmlContent = await xmlService.generateQuoteXml(quote, rep);

        res.header('Content-Type', 'application/xml');
        res.attachment(`${quote.reference}.rak`); // Extension changed to .rak
        res.send(xmlContent);

    } catch (error) {
        console.error("XML Gen Error:", error);
        res.status(500).json({ error: 'Failed to generate XML', details: error });
    }
};
