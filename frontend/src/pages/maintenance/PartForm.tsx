
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPart, getPartById, updatePart, getPartCategories, getEquipments } from '../../services/api';

const PartForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        reference: '',
        stockQuantity: 0,
        minQuantity: 0,
        categoryId: '',
        equipmentId: '',
        description: '',
        location: '',
        note: '',
        supplier: ''
    });

    useEffect(() => {
        loadDependencies();
        if (id) {
            loadPart();
        }
    }, [id]);

    const loadDependencies = async () => {
        try {
            const [cats, equips] = await Promise.all([
                getPartCategories(),
                getEquipments()
            ]);
            setCategories(cats);
            setEquipments(equips);
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    };

    const loadPart = async () => {
        try {
            const data = await getPartById(id!);
            setFormData({
                name: data.name,
                reference: data.reference || '',
                stockQuantity: data.stockQuantity,
                minQuantity: data.minQuantity,
                categoryId: data.categoryId || '',
                equipmentId: data.equipmentId || '',
                description: data.description || '',
                location: data.location || '',
                note: data.note || '',
                supplier: data.supplier || ''
            });
        } catch (error) {
            console.error('Error loading part:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (id) {
                await updatePart(id, formData);
            } else {
                await createPart(formData);
            }
            navigate('/maintenance/parts');
        } catch (error) {
            console.error('Error saving part:', error);
            alert('Erreur lors de la sauvegarde.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{id ? 'Modifier Pièce' : 'Nouvelle Pièce'}</h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nom</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Référence</label>
                    <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantité en Stock</label>
                        <input
                            type="number"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantité Minimale</label>
                        <input
                            type="number"
                            name="minQuantity"
                            value={formData.minQuantity}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Catégorie</label>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Équipement lié</label>
                    <select
                        name="equipmentId"
                        value={formData.equipmentId}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    >
                        <option value="">Aucun équipement spécifique</option>
                        {equipments.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.name} ({eq.number})</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Lieu de stockage</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fournisseur (Nom)</label>
                        <input
                            type="text"
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Note</label>
                    <textarea
                        name="note"
                        value={formData.note}
                        onChange={handleChange}
                        rows={2}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/maintenance/parts')}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PartForm;
