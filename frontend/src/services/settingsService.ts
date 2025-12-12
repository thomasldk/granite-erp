
import api from './api';

export interface SystemSettings {
    [key: string]: string;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
    const response = await api.get('/settings/system');
    return response.data;
};

export const updateSystemSettings = async (settings: SystemSettings): Promise<void> => {
    await api.put('/settings/system', settings);
};

// --- Languages ---
export interface Language {
    id: string;
    code: string;
    name: string;
}

export const getLanguages = async (): Promise<Language[]> => {
    const response = await api.get('/settings/languages');
    return response.data;
};

export const createLanguage = async (data: Omit<Language, 'id'>): Promise<Language> => {
    const response = await api.post('/settings/languages', data);
    return response.data;
};

export const deleteLanguage = async (id: string): Promise<void> => {
    await api.delete(`/settings/languages/${id}`);
};

// --- Currencies ---
export interface Currency {
    id: string;
    code: string;
    name: string;
    symbol?: string;
}

export const getCurrencies = async (): Promise<Currency[]> => {
    const response = await api.get('/settings/currencies');
    return response.data;
};

export const createCurrency = async (data: Omit<Currency, 'id'>): Promise<Currency> => {
    const response = await api.post('/settings/currencies', data);
    return response.data;
};

export const deleteCurrency = async (id: string): Promise<void> => {
    await api.delete(`/settings/currencies/${id}`);
};
