import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const EquipmentCategoryForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isEditing) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await api.get(`/maintenance/categories/${id}`);
            setName(response.data.name);
        } catch (err) {
            setError('Erreur lors du chargement de la catégorie');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                await api.put(`/maintenance/categories/${id}`, { name });
            } else {
                await api.post('/maintenance/categories', { name });
            }
            navigate('/maintenance/categories');
        } catch (err) {
            setError('Erreur lors de la sauvegarde');
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                {isEditing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h1>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la catégorie
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="ex: Automobile"
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/maintenance/categories')}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EquipmentCategoryForm;
