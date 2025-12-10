import api from './api';

export interface Material {
    id: string;
    name: string;
    category?: string; // Stone, Standard
    type: string; // Granite, Quartz, etc.
    purchasePrice: number;
    sellingPrice?: number;
    unit: string;
    sellingUnit?: string; // Added
    density?: number;
    densityUnit?: string;
    quality?: string;
    wasteFactor?: number;
    imageUrl?: string;
    supplierId?: string;
    supplier?: {
        name: string;
        priceListUrl?: string; // Added
        priceListDate?: string; // Added
    };
}

export const getMaterials = async (params?: { name?: string }) => {
    const response = await api.get<Material[]>('/materials', { params });
    return response.data;
};

export const getMaterialById = async (id: string) => {
    const response = await api.get<Material>(`/materials/${id}`);
    return response.data;
};

export const createMaterial = async (data: Partial<Material>) => {
    const response = await api.post<Material>('/materials', data);
    return response.data;
};

export const updateMaterial = async (id: string, data: Partial<Material>) => {
    const response = await api.put<Material>(`/materials/${id}`, data);
    return response.data;
};

export const deleteMaterial = async (id: string) => {
    await api.delete(`/materials/${id}`);
};
