import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Repair {
    id: string;
    reference: string;
    title: string | null;
    priority: string;
    status: string;
    description: string;
    requester: string | null;
    equipment: {
        name: string;
        internalId: string;
    } | null;
    createdAt: string;
}

const RepairList: React.FC = () => {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRepairs = () => {
        fetch('/api/repairs')
            .then(res => res.json())
            .then(data => {
                setRepairs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching repairs:', err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchRepairs();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette demande ?')) return;

        try {
            const res = await fetch(`/api/repairs/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRepairs(); // Refresh list
            } else {
                alert('Erreur lors de la suppression.');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur réseau.');
        }
    };

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Liste des demandes</h1>
                <Link to="/maintenance/repairs/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Nouvelle Demande
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {repairs.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.reference}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {r.equipment ? `${r.equipment.name} (${r.equipment.internalId || ''})` : 'Général'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.title || r.description?.slice(0, 30)}</td>
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
                                    <Link to={`/maintenance/repairs/edit/${r.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4 inline-block" title="Modifier">
                                        <PencilIcon className="w-5 h-5" />
                                    </Link>
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
        </div>
    );
};

export default RepairList;

