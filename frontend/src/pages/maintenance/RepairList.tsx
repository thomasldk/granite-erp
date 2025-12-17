import React, { useEffect, useState } from 'react';
import RepairEditModal from './RepairEditModal';
import { PencilIcon, TrashIcon, PlusIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface Repair {
    id: string;
    reference: string;
    title: string | null;
    priority: string;
    status: string;
    description: string;
    requester: string | null;
    mechanic: string | null;
    type: string;
    isFunctional: boolean;
    detectionDate: string;
    dueDate: string | null;
    equipmentId: string | null;
    equipment: {
        id: string;
        name: string;
        internalId: string;
    } | null;
    createdAt: string;
}

interface Equipment {
    id: string;
    name: string;
    internalId: string;
}

const RepairList: React.FC = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [availableParts, setAvailableParts] = useState<any[]>([]); // Added
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);

    const fetchData = async () => {
        try {
            const [repairsRes, equipmentsRes, partsRes] = await Promise.all([
                fetch('/api/repairs'),
                fetch('/api/equipments'),
                fetch('/api/parts') // Added
            ]);

            if (repairsRes.ok && equipmentsRes.ok && partsRes.ok) { // Check partsRes.ok
                const repairsData = await repairsRes.json();
                const equipmentsData = await equipmentsRes.json();
                const partsData = await partsRes.json(); // Get parts data
                setRepairs(repairsData);
                setEquipments(equipmentsData);
                setAvailableParts(partsData); // Set parts data
            } else {
                console.error('Failed to fetch data');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

        try {
            const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRepairs(repairs.filter(r => r.id !== id));
            } else {
                alert('Erreur lors de la suppression.');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur réseau.');
        }
    };

    const handleEdit = (repair: Repair) => {
        setSelectedRepair(repair);
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedRepair(null);
        setIsEditModalOpen(true);
    };

    const handleSave = async (updatedData: any) => {
        try {
            const url = selectedRepair ? `/api/repairs/${selectedRepair.id}` : '/api/repairs';
            const method = selectedRepair ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (res.ok) {
                await res.json();

                // Refresh list or update state manually. 
                // Since 'equipment' object might not be fully populated in response (depending on backend implementation),
                // fetching all repairs again is safer to ensure correct table display (e.g. equipment name).
                fetchData();

                setIsEditModalOpen(false);
                setSelectedRepair(null);
            } else {
                alert('Erreur lors de la sauvegarde.');
            }
        } catch (error) {
            console.error('Error saving repair:', error);
            alert('Erreur réseau.');
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Liste des demandes</h1>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre / Problème</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priorité</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demandé par</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-end gap-2">
                                Actions
                                <button
                                    onClick={handleAdd}
                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 rounded-full p-1"
                                    title="Nouvelle Demande"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {repairs.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.reference}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {r.equipment ? `${r.equipment.name} (${r.equipment.internalId || ''})` : 'Général'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs">{r.title || r.description?.slice(0, 30)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${r.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                                            r.priority === 'High' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                        {r.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.requester || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link
                                        to={`/maintenance/repairs/print/${r.id}`}
                                        target="_blank"
                                        className="text-gray-600 hover:text-gray-900 mr-4 inline-block"
                                        title="Imprimer le bon"
                                    >
                                        <PrinterIcon className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleEdit(r)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4 inline-block"
                                        title="Modifier"
                                    >
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-900 inline-block" title="Supprimer">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {repairs.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Aucune demande de réparation.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RepairEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSave}
                repair={selectedRepair}
                equipments={equipments}
                availableParts={availableParts} // Added
            />
        </div>
    );
};

export default RepairList;

