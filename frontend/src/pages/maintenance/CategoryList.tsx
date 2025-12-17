import React, { useEffect, useState } from 'react';
import CategoryEditModal from './CategoryEditModal';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Category {
    id: string;
    name: string;
}

const CategoryList: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    useEffect(() => {
        fetch('/api/equipment-categories')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching categories:', err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
            try {
                const res = await fetch(`/api/equipment-categories/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setCategories(categories.filter(c => c.id !== id));
                } else {
                    alert('Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleEdit = (category: Category) => {
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsEditModalOpen(true);
    };

    const handleSave = async (updatedData: Partial<Category>) => {
        try {
            const url = selectedCategory ? `/api/equipment-categories/${selectedCategory.id}` : '/api/equipment-categories';
            const method = selectedCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (res.ok) {
                const savedCategory = await res.json();
                if (selectedCategory) {
                    setCategories(categories.map(c => c.id === savedCategory.id ? savedCategory : c));
                } else {
                    setCategories([...categories, savedCategory]);
                }
                setIsEditModalOpen(false);
                setSelectedCategory(null);
            } else {
                alert('Erreur lors de la modification/création');
            }
        } catch (error) {
            console.error('Error updating/creating category:', error);
            alert('Erreur lors de la modification/création');
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Catégories d'équipement</h1>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end gap-2">
                                Actions
                                <button
                                    onClick={handleAdd}
                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full p-1"
                                    title="Ajouter une catégorie"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        title="Modifier"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Supprimer"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CategoryEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                category={selectedCategory}
                onSave={handleSave}
            />
        </div>
    );
};

export default CategoryList;

