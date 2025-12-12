
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getPartCategories, deletePartCategory } from '../../services/api';

const PartCategoryList: React.FC = () => {
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getPartCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading part categories:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
            try {
                await deletePartCategory(id);
                loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Catégories de Pièces</h1>
                <Link
                    to="/maintenance/part-categories/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nouvelle Catégorie
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <Link to={`/maintenance/part-categories/${category.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                                            <PencilIcon className="w-5 h-5" />
                                        </Link>
                                        <button onClick={() => handleDelete(category.id)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartCategoryList;
