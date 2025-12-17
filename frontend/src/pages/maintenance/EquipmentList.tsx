import React, { useEffect, useState } from 'react';
import EquipmentEditModal from './EquipmentEditModal';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface Equipment {
    id: string;
    name: string;
    internalId: string;
    serialNumber: string;
    categoryId: string | null;
    siteId: string | null;
    category: { id: string, name: string } | null;
    site: { id: string, name: string } | null;
    status: string;
}

interface EquipmentCategory {
    id: string;
    name: string;
}

interface MaintenanceSite {
    id: string;
    name: string;
}

const EquipmentList: React.FC = () => {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [categories, setCategories] = useState<EquipmentCategory[]>([]);
    const [sites, setSites] = useState<MaintenanceSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [equipmentsRes, categoriesRes, sitesRes] = await Promise.all([
                    fetch('/api/equipments'),
                    fetch('/api/equipment-categories'),
                    fetch('/api/maintenance-sites')
                ]);

                if (equipmentsRes.ok && categoriesRes.ok && sitesRes.ok) {
                    const equipmentsData = await equipmentsRes.json();
                    const categoriesData = await categoriesRes.json();
                    const sitesData = await sitesRes.json();
                    setEquipments(equipmentsData);
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
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
            try {
                const res = await fetch(`/api/equipments/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setEquipments(equipments.filter(e => e.id !== id));
                } else {
                    alert('Erreur lors de la suppression');
                }
            } catch (error) {
                console.error('Error deleting equipment:', error);
                alert('Erreur lors de la suppression');
            }
        }
    };

    const handleEdit = (equipment: Equipment) => {
        setSelectedEquipment(equipment);
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedEquipment(null);
        setIsEditModalOpen(true);
    };

    const handleSave = async (updatedData: Partial<Equipment>) => {
        try {
            const url = selectedEquipment ? `/api/equipments/${selectedEquipment.id}` : '/api/equipments';
            const method = selectedEquipment ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (res.ok) {
                const savedEquipment = await res.json();

                // Manually populate category and site names for display if returned object relies on IDs
                const populatedEquipment = {
                    ...savedEquipment,
                    category: savedEquipment.category || categories.find(c => c.id === savedEquipment.categoryId) || null,
                    site: savedEquipment.site || sites.find(s => s.id === savedEquipment.siteId) || null
                };

                if (selectedEquipment) {
                    setEquipments(equipments.map(e => e.id === populatedEquipment.id ? populatedEquipment : e));
                } else {
                    setEquipments([...equipments, populatedEquipment]);
                }
                setIsEditModalOpen(false);
                setSelectedEquipment(null);
            } else {
                alert('Erreur lors de la modification/création');
            }
        } catch (error) {
            console.error('Error updating/creating equipment:', error);
            alert('Erreur lors de la modification/création');
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des Équipements</h1>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Système</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end gap-2">
                                Actions
                                <button
                                    onClick={handleAdd}
                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full p-1"
                                    title="Ajouter un équipement"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {equipments.map((eq) => (
                            <tr key={eq.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{eq.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.internalId || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.category?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.site?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eq.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {eq.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                    <button
                                        onClick={() => handleEdit(eq)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        title="Modifier"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(eq.id)}
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

            <EquipmentEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                equipment={selectedEquipment}
                onSave={handleSave}
                categories={categories}
                sites={sites}
            />
        </div>
    );
};

export default EquipmentList;


