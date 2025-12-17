import React, { useEffect, useState } from 'react';
import PartEditModal from './PartEditModal';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Part {
    id: string;
    name: string;
    reference: string | null;
    categoryId: string | null;
    siteId: string | null;
    category: { id: string, name: string } | null;
    site: { id: string, name: string } | null;
    stockQuantity: number;
    minQuantity: number;
    description: string | null;
    supplier: string | null;
}

interface PartCategory {
    id: string;
    name: string;
}

interface MaintenanceSite {
    id: string;
    name: string;
}

const PartList: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [categories, setCategories] = useState<PartCategory[]>([]);
    const [sites, setSites] = useState<MaintenanceSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [partsRes, categoriesRes, sitesRes] = await Promise.all([
                    fetch('/api/parts'),
                    fetch('/api/part-categories'),
                    fetch('/api/maintenance-sites')
                ]);

                if (partsRes.ok && categoriesRes.ok && sitesRes.ok) {
                    const partsData = await partsRes.json();
                    const categoriesData = await categoriesRes.json();
                    const sitesData = await sitesRes.json();
                    setParts(partsData);
                    setCategories(categoriesData);
                    setSites(sitesData);
                } else {
                    console.error('Failed to fetch data');
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) {
            try {
                const res = await fetch(`/api/parts/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setParts(parts.filter(p => p.id !== id));
                } else {
                    alert('Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Error deleting part:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleEdit = (part: Part) => {
        setSelectedPart(part);
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedPart(null);
        setIsEditModalOpen(true);
    };

    const handleSave = async (updatedData: Partial<Part>) => {
        try {
            const url = selectedPart ? `/api/parts/${selectedPart.id}` : '/api/parts';
            const method = selectedPart ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (res.ok) {
                const savedPart = await res.json();
                if (selectedPart) {
                    setParts(parts.map(p => p.id === savedPart.id ? savedPart : p));
                } else {
                    setParts([...parts, savedPart]);
                }
                setIsEditModalOpen(false);
                setSelectedPart(null);
            } else {
                alert('Erreur lors de la modification/création');
            }
        } catch (error) {
            console.error('Error updating/creating part:', error);
            alert('Erreur lors de la modification/création');
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des Pièces</h1>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièce</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté. Dispo.</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté. Min.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end gap-2">
                                Actions
                                <button
                                    onClick={handleAdd}
                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full p-1"
                                    title="Ajouter une pièce"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {parts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.reference || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.site?.name || '-'}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${p.stockQuantity <= p.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>{p.stockQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{p.minQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.supplier || ''}>{p.supplier || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    <button
                                        onClick={() => handleEdit(p)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        title="Modifier"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(p.id)}
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

            <PartEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                part={selectedPart}
                onSave={handleSave}
                categories={categories}
                sites={sites}
            />
        </div>
    );
};

export default PartList;


