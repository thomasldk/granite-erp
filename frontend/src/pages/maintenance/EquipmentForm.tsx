import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

interface ProductionSite {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    name: string;
}

interface EquipmentCategory {
    id: string;
    name: string;
}

const EquipmentForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        number: '',
        name: '',
        serialNumber: '',
        categoryId: '',
        productionSiteId: '',
        supplierId: ''
    });

    const [sites, setSites] = useState<ProductionSite[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchOptions();
        if (isEditMode) {
            fetchEquipment();
        }
    }, [id]);

    const fetchOptions = async () => {
        try {
            const [sitesRes, suppliersRes, categoriesRes] = await Promise.all([
                api.get('/production-sites'),
                api.get('/third-parties?type=Supplier'),
                api.get('/maintenance/categories')
            ]);
            setSites(sitesRes.data);
            setSuppliers(suppliersRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await api.get(`/maintenance/equipment/${id}`);
            const data = response.data;
            setFormData({
                number: data.number,
                name: data.name,
                serialNumber: data.serialNumber || '',
                categoryId: data.categoryId || '',
                productionSiteId: data.productionSiteId || '',
                supplierId: data.supplierId || ''
            });
        } catch (error) {
            console.error('Error fetching equipment:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditMode) {
                await api.put(`/maintenance/equipment/${id}`, formData);
            } else {
                await api.post('/maintenance/equipment', formData);
            }
            navigate('/maintenance/equipment');
        } catch (error) {
            console.error('Error saving equipment:', error);
            alert('Error saving equipment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Modifier' : 'Ajouter'} un Équipement</h2>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Numéro</label>
                    <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Numéro de série</label>
                    <input
                        type="text"
                        name="serialNumber"
                        value={formData.serialNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Localisation (Site)</label>
                    <select
                        name="productionSiteId"
                        value={formData.productionSiteId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    >
                        <option value="">Sélectionner un site</option>
                        {sites.map(site => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fournisseur</label>
                    <select
                        name="supplierId"
                        value={formData.supplierId}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                    >
                        <option value="">Sélectionner un fournisseur</option>
                        {suppliers.map(sup => (
                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/maintenance/equipment')}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EquipmentForm;
