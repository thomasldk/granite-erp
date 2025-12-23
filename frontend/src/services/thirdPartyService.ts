import api from './api';
export { api };

export interface ThirdParty {
    id: string;
    name: string;
    type: string;
    code?: string;
    email?: string;
    phone?: string;
    fax?: string;
    website?: string;
    defaultCurrency?: string;
    paymentTerms?: string;
    paymentTermId?: string;
    paymentDays?: number;
    depositPercentage?: number;
    supplierType?: string;
    priceListUrl?: string; // Added
    priceListDate?: string; // Added "Prix 2023", etc.
    taxScheme?: string;
    creditLimit?: number;
    repName?: string;
    language?: string;
    internalNotes?: string;
    taxId?: string; // Added
    customsBrokerId?: string; // Added
    customsBroker?: { name: string }; // Optional relation data
    // Address fields for creation
    addressLine1?: string;
    addressCity?: string;
    addressState?: string;
    addressZip?: string;
    addressCountry?: string;
    createdAt: string;
    updatedAt: string;
}

export const getThirdParties = async (type?: string) => {
    const response = await api.get<ThirdParty[]>('/third-parties', { params: { type } });
    return response.data;
};

export const createThirdParty = async (data: Omit<ThirdParty, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await api.post<ThirdParty>('/third-parties', data);
    return response.data;
};

export const getThirdPartyById = async (id: string) => {
    const response = await api.get<ThirdParty & { contacts: any[], addresses: any[] }>(`/third-parties/${id}`);
    return response.data;
};

export const addContact = async (thirdPartyId: string, contactData: any) => {
    const response = await api.post(`/third-parties/${thirdPartyId}/contacts`, contactData);
    return response.data;
};

export const updateContact = async (contactId: string, contactData: any) => {
    const response = await api.put(`/third-parties/contacts/${contactId}`, contactData);
    return response.data;
};

export const updateThirdParty = async (id: string, data: any) => {
    const response = await api.put(`/third-parties/${id}`, data);
    return response.data;
};

export const deleteThirdParty = async (id: string) => {
    await api.delete(`/third-parties/${id}`);
};

// Contact Types
export const getContactTypes = async (category?: string) => {
    const response = await api.get('/contact-types', { params: { category } });
    return response.data;
};

export const createContactType = async (name: string, category: string = 'Client') => {
    const response = await api.post('/contact-types', { name, category });
    return response.data;
};

export const updateContactType = async (id: string, name: string, category: string) => {
    const response = await api.put(`/contact-types/${id}`, { name, category });
    return response.data;
};

export const deleteContactType = async (id: string) => {
    await api.delete(`/contact-types/${id}`);
};

// Settings (Languages & Currencies)
export const getLanguages = async () => {
    const response = await api.get('/settings/languages');
    return response.data;
};

export const getCurrencies = async () => {
    const response = await api.get('/settings/currencies');
    return response.data;
};
