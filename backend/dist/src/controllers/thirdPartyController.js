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
exports.deleteThirdParty = exports.updateContact = exports.updateThirdParty = exports.addAddress = exports.addContact = exports.getThirdPartyById = exports.getThirdParties = exports.createThirdParty = void 0;
// import { PrismaClient } from '@prisma/client';
const prisma_1 = __importDefault(require("../prisma"));
// const prisma = new PrismaClient();
const createThirdParty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, code, email, phone, fax, website, addressLine1, addressCity, addressState, addressZip, addressCountry, contactFirstName, contactLastName, contactEmail, contactPhone, contactRole, defaultCurrency, paymentTermId, paymentDays, depositPercentage, taxScheme, creditLimit, repName, supplierType, language, unitSystem, incoterm, incotermId, incotermCustomText, // Added
        priceListUrl, priceListDate, internalNotes, 
        // V8
        semiStandardRate, salesCurrency, palletPrice, palletRequired, discountPercentage, discountDays, paymentCustomText, exchangeRate, validityDuration } = req.body;
        const thirdParty = yield prisma_1.default.thirdParty.create({
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
                incotermId: incotermId || null,
                incotermCustomText,
                priceListUrl,
                priceListDate, // Added
                internalNotes,
                // V8
                semiStandardRate,
                salesCurrency,
                palletPrice,
                palletRequired,
                discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
                discountDays: discountDays ? parseInt(discountDays) : 0,
                paymentCustomText,
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
                validityDuration: validityDuration ? parseInt(validityDuration) : null,
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating third party' });
    }
});
exports.createThirdParty = createThirdParty;
const getThirdParties = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        const where = type ? { type: String(type) } : {};
        const thirdParties = yield prisma_1.default.thirdParty.findMany({
            where,
            include: { contacts: true, addresses: true, paymentTerm: true },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(thirdParties);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch third parties' });
    }
});
exports.getThirdParties = getThirdParties;
const getThirdPartyById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const thirdParty = yield prisma_1.default.thirdParty.findUnique({
            where: { id },
            include: { contacts: true, addresses: true, paymentTerm: true },
        });
        if (!thirdParty) {
            return res.status(404).json({ error: 'Third party not found' });
        }
        res.json(thirdParty);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch third party' });
    }
});
exports.getThirdPartyById = getThirdPartyById;
const addContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // thirdPartyId
        const { firstName, lastName, email, phone, mobile, fax, role } = req.body;
        const contact = yield prisma_1.default.contact.create({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add contact', details: error });
    }
});
exports.addContact = addContact;
const addAddress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params; // thirdPartyId
        const { type, line1, line2, city, state, zipCode, country } = req.body;
        const address = yield prisma_1.default.address.create({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add address', details: error });
    }
});
exports.addAddress = addAddress;
const updateThirdParty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, type, code, email, phone, fax, website, defaultCurrency, paymentTerms, paymentTermId, taxScheme, creditLimit, paymentDays, depositPercentage, supplierType, priceListUrl, priceListDate, // Added
        repName, language, unitSystem, incoterm, incotermId, incotermCustomText, internalNotes, addressLine1, addressCity, addressState, addressZip, addressCountry, 
        // V8
        semiStandardRate, salesCurrency, palletPrice, palletRequired, discountPercentage, discountDays, paymentCustomText, exchangeRate, validityDuration } = req.body;
        // update core fields
        const thirdParty = yield prisma_1.default.thirdParty.update({
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
                repName, language, unitSystem, incoterm,
                incotermId: incotermId || null, // Fix foreign key
                incotermCustomText,
                internalNotes, // unitSystem is included in the update data
                // V8
                semiStandardRate,
                salesCurrency,
                palletPrice,
                palletRequired,
                discountPercentage: discountPercentage !== undefined ? parseFloat(discountPercentage) : undefined,
                discountDays: discountDays !== undefined ? parseInt(discountDays) : undefined,
                paymentCustomText,
                exchangeRate: exchangeRate !== undefined ? parseFloat(exchangeRate) : undefined,
                validityDuration: validityDuration !== undefined ? parseInt(validityDuration) : undefined
            }
        });
        // Update Main address if address fields are provided
        if (addressLine1) {
            // Check if main address exists
            const mainAddress = yield prisma_1.default.address.findFirst({
                where: { thirdPartyId: id, type: 'Main' }
            });
            if (mainAddress) {
                yield prisma_1.default.address.update({
                    where: { id: mainAddress.id },
                    data: {
                        line1: addressLine1,
                        city: addressCity || '',
                        state: addressState,
                        zipCode: addressZip,
                        country: addressCountry || 'Canada'
                    }
                });
            }
            else {
                yield prisma_1.default.address.create({
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
    }
    catch (error) {
        console.error('Update ThirdParty Error:', error);
        res.status(500).json({ error: 'Failed to update third party', details: error });
    }
});
exports.updateThirdParty = updateThirdParty;
const updateContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contactId } = req.params;
        const { firstName, lastName, email, phone, mobile, fax, role } = req.body;
        const contact = yield prisma_1.default.contact.update({
            where: { id: contactId },
            data: { firstName, lastName, email, phone, mobile, fax, role }
        });
        res.json(contact);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update contact', details: error });
    }
});
exports.updateContact = updateContact;
const deleteThirdParty = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.thirdParty.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Delete ThirdParty Error:', error);
        res.status(500).json({ error: 'Failed to delete third party', details: error });
    }
});
exports.deleteThirdParty = deleteThirdParty;
