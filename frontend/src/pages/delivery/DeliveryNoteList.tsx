import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TruckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const DeliveryNoteList: React.FC = () => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const response = await api.get('/delivery/notes');
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching delivery notes", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-2" />
                Liste des Bons de Livraison
            </h1>

            {loading ? (
                <div className="text-gray-500">Chargement...</div>
            ) : notes.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    Aucun Bon de Livraison généré pour le moment.
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transporteur</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Poids (lbs)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Palettes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {notes.map((note) => (
                                <tr key={note.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {note.reference}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(note.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="font-medium text-gray-900">{note.client?.name || "Client Inconnu"}</div>
                                        <div className="text-xs text-gray-400 capitalize">{note.deliveryAddress ? "📍 Adresse définie" : "🏢 Adresse Client"}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {note.carrier || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-bold">
                                        {note.totalWeight.toFixed(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        {note._count?.items || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Expédié
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeliveryNoteList;
