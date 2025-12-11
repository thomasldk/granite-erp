import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createThirdParty = async (req: Request, res: Response) => {
    try {
        const {
            name, type, code, email, phone, fax, website,
            addressLine1, addressCity, addressState, addressZip, addressCountry,
            contactFirstName, contactLastName, contactEmail, contactPhone, contactRole,
            defaultCurrency, paymentTermId, paymentDays, depositPercentage,
            taxScheme, creditLimit, repName, supplierType, language, unitSystem, incoterm, priceListUrl, priceListDate, // Added
            internalNotes
        } = req.body;

        const thirdParty = await prisma.thirdParty.create({
            data: {
                name,
                type,
                code,
                email,
                phone,
                fax,
                website,
                defaultCurrency,
                paymentTermId,
                paymentDays: paymentDays ? parseInt(paymentDays) : 0,
                depositPercentage: depositPercentage ? parseFloat(depositPercentage) : 0,
                taxScheme,
                creditLimit: creditLimit ? parseFloat(creditLimit) : null,
                repName,
                supplierType,
                language,
                unitSystem,
                incoterm,
                priceListUrl,
                priceListDate, // Added
                internalNotes,
                addresses: {
                    create: {
                        line1: addressLine1,
                        city: addressCity,
                        state: addressState,
                        zipCode: addressZip,
                        country: addressCountry,
                        type: 'Main'
                    }
                },
                contacts: contactFirstName ? {
                    create: {
                        firstName: contactFirstName,
                        lastName: contactLastName,
                        email: contactEmail,
                        phone: contactPhone,
                        role: contactRole
                    }
                } : undefined
            }
        });
        res.json(thirdParty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating third party' });
    }
};

export const getThirdParties = async (req: Request, res: Response) => {
    try {
        const { type } = req.query;
        const where = type ? { type: String(type) } : {};
        const thirdParties = await prisma.thirdParty.findMany({
            where,
            include: { contacts: true, addresses: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(thirdParties);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch third parties' });
    }
};

export const getThirdPartyById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const thirdParty = await prisma.thirdParty.findUnique({
            where: { id },
            include: { contacts: true, addresses: true },
        });
        if (!thirdParty) {
            return res.status(404).json({ error: 'Third party not found' });
        }
        res.json(thirdParty);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch third party' });
    }
};

export const addContact = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // thirdPartyId
        const { firstName, lastName, email, phone, mobile, fax, role } = req.body;

        const contact = await prisma.contact.create({
            data: {
                thirdPartyId: id,
                firstName,
                lastName,
                email,
                phone,
                mobile,
                fax,
                role
            }
        });
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add contact', details: error });
    }
};

export const addAddress = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // thirdPartyId
        const { type, line1, line2, city, state, zipCode, country } = req.body;

        const address = await prisma.address.create({
            data: {
                thirdPartyId: id,
                type, // Billing, Delivery
                line1,
                line2,
                city,
                state,
                zipCode,
                country
            }
        });
        res.status(201).json(address);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add address', details: error });
    }
};

export const updateThirdParty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, type, code, email, phone, fax, website,
            defaultCurrency, paymentTerms, paymentTermId, taxScheme, creditLimit,
            paymentDays, depositPercentage, supplierType, priceListUrl, priceListDate, // Added
            repName, language, unitSystem, incoterm, internalNotes,
            addressLine1, addressCity, addressState, addressZip, addressCountry
        } = req.body;

        // update core fields
        const thirdParty = await prisma.thirdParty.update({
            where: { id },
            data: {
                name, type, code, email, phone, fax, website,
                defaultCurrency, paymentTerms,
                paymentTermId: paymentTermId || null, // Convert empty string to null
                taxScheme,
                paymentDays: paymentDays !== undefined ? parseInt(paymentDays) : undefined,
                depositPercentage: depositPercentage !== undefined ? parseFloat(depositPercentage) : undefined,
                creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
                supplierType,
                priceListUrl, // Added
                priceListDate, // Added
                repName, language, unitSystem, incoterm, internalNotes // unitSystem is included in the update data
            }
        });

        // Update Main address if address fields are provided
        if (addressLine1) {
            // Check if main address exists
            const mainAddress = await prisma.address.findFirst({
                where: { thirdPartyId: id, type: 'Main' }
            });

            if (mainAddress) {
                await prisma.address.update({
                    where: { id: mainAddress.id },
                    data: {
                        line1: addressLine1,
                        city: addressCity || '',
                        state: addressState,
                        zipCode: addressZip,
                        country: addressCountry || 'Canada'
                    }
                });
            } else {
                await prisma.address.create({
                    data: {
                        thirdPartyId: id,
                        type: 'Main',
                        line1: addressLine1,
                        city: addressCity || '',
                        state: addressState,
                        zipCode: addressZip,
                        country: addressCountry || 'Canada'
                    }
                });
            }
        }

        res.json(thirdParty);
    } catch (error) {
        console.error('Update ThirdParty Error:', error);
        res.status(500).json({ error: 'Failed to update third party', details: error });
    }
};

export const updateContact = async (req: Request, res: Response) => {
    try {
        const { contactId } = req.params;
        const { firstName, lastName, email, phone, mobile, fax, role } = req.body;

        const contact = await prisma.contact.update({
            where: { id: contactId },
            data: { firstName, lastName, email, phone, mobile, fax, role }
        });
        res.json(contact);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update contact', details: error });
    }
};

export const deleteThirdParty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.thirdParty.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Delete ThirdParty Error:', error);
        res.status(500).json({ error: 'Failed to delete third party', details: error });
    }
};
