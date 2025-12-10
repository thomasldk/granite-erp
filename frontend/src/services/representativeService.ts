import api from './api';

export interface Representative {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    active: boolean;
}

export const getRepresentatives = async () => {
    const response = await api.get<Representative[]>('/representatives');
    return response.data;
};
