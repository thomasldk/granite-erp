
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || '/api';
console.log('🔗 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl
});

// --- Clients / Third Parties ---
export const getClients = async () => (await api.get('/third-parties')).data;
export const getSuppliers = async () => {
    const response = await api.get('/third-parties');
    return response.data.filter((tp: any) => tp.type === 'Supplier');
};
export const getClientById = async (id: string) => (await api.get(`/third-parties/${id}`)).data;
export const createClient = async (data: any) => (await api.post('/third-parties', data)).data;
export const updateClient = async (id: string, data: any) => (await api.put(`/third-parties/${id}`, data)).data;
export const deleteClient = async (id: string) => (await api.delete(`/third-parties/${id}`)).data;

// --- Catalogue (Materials) ---
export const getMaterials = async () => (await api.get('/materials')).data;
export const getMaterialsByCategory = async (category: string) => {
    const response = await api.get('/materials');
    return response.data.filter((m: any) => m.category === category);
};
export const getMaterialById = async (id: string) => (await api.get(`/materials/${id}`)).data;
export const createMaterial = async (data: any) => (await api.post('/materials', data)).data;
export const updateMaterial = async (id: string, data: any) => (await api.put(`/materials/${id}`, data)).data;
export const deleteMaterial = async (id: string) => (await api.delete(`/materials/${id}`)).data;


// --- Soumissions (Quotes/Projects) ---
export const getProjects = async () => (await api.get('/soumissions')).data; // Assuming soumissionRoutes handles /projects logic currently or refactor
export const getProjectById = async (id: string) => (await api.get(`/soumissions/${id}`)).data;
export const createProject = async (data: any) => (await api.post('/soumissions', data)).data;
export const updateProject = async (id: string, data: any) => (await api.put(`/soumissions/${id}`, data)).data; // Fixed: PUT to /id
export const getQuotesByProject = async (projectId: string) => (await api.get(`/soumissions/${projectId}/quotes`)).data;
export const getQuoteById = async (id: string) => (await api.get(`/quotes/${id}`)).data;
export const createQuote = async (data: any) => (await api.post('/quotes', data)).data;
export const updateQuote = async (id: string, data: any) => (await api.put(`/quotes/${id}`, data)).data;

// --- Production ---
export const getProductionData = async (site: string) => (await api.get(`/production?site=${site}`)).data;

// --- Maintenance (Equipments) ---
export const getEquipments = async () => (await api.get('/maintenance/equipment')).data;
export const getEquipmentById = async (id: string) => (await api.get(`/maintenance/equipment/${id}`)).data;
export const createEquipment = async (data: any) => (await api.post('/maintenance/equipment', data)).data;
export const updateEquipment = async (id: string, data: any) => (await api.put(`/maintenance/equipment/${id}`, data)).data;
export const deleteEquipment = async (id: string) => (await api.delete(`/maintenance/equipment/${id}`)).data;

// --- Maintenance (Equipment Categories) ---
export const getEquipmentCategories = async () => (await api.get('/maintenance/categories')).data;
export const getEquipmentCategoryById = async (id: string) => (await api.get(`/maintenance/categories/${id}`)).data;
export const createEquipmentCategory = async (data: any) => (await api.post('/maintenance/categories', data)).data;
export const updateEquipmentCategory = async (id: string, data: any) => (await api.put(`/maintenance/categories/${id}`, data)).data;
export const deleteEquipmentCategory = async (id: string) => (await api.delete(`/maintenance/categories/${id}`)).data;

// --- Maintenance (Parts) ---
export const getParts = async () => (await api.get('/maintenance/parts')).data;
export const getPartById = async (id: string) => (await api.get(`/maintenance/parts/${id}`)).data;
export const createPart = async (data: any) => (await api.post('/maintenance/parts', data)).data;
export const updatePart = async (id: string, data: any) => (await api.put(`/maintenance/parts/${id}`, data)).data;
export const deletePart = async (id: string) => (await api.delete(`/maintenance/parts/${id}`)).data;

// --- Maintenance (Part Categories) ---
export const getPartCategories = async () => (await api.get('/maintenance/part-categories')).data;
export const getPartCategoryById = async (id: string) => (await api.get(`/maintenance/part-categories/${id}`)).data;
export const createPartCategory = async (data: any) => (await api.post('/maintenance/part-categories', data)).data;
export const updatePartCategory = async (id: string, data: any) => (await api.put(`/maintenance/part-categories/${id}`, data)).data;
export const deletePartCategory = async (id: string) => (await api.delete(`/maintenance/part-categories/${id}`)).data;


// --- Settings ---
export const getRepresentatives = async () => (await api.get('/settings/representatives')).data;
export const getContactTypes = async () => (await api.get('/settings/contact-types')).data;
export const getLanguages = async () => (await api.get('/settings/languages')).data;
export const getCurrencies = async () => (await api.get('/settings/currencies')).data;
export const getProjectLocations = async () => (await api.get('/settings/locations')).data; // Added
export const createProjectLocation = async (data: any) => (await api.post('/settings/locations', data)).data; // Added
export const getProductionSites = async () => (await api.get('/production-sites')).data; // Fixed URL

export default api;
