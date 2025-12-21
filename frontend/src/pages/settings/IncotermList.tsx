import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const IncotermList: React.FC = () => {
    const [incoterms, setIncoterms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncoterms();
    }, []);

    const fetchIncoterms = async () => {
        try {
            const res = await api.get('/incoterms');
            setIncoterms(res.data);
        } catch (error) {
            console.error('Error fetching incoterms:', error);
        } finally {
            setLoading(false);
        }
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const handleEdit = (incoterm: any) => {
        setEditingId(incoterm.id);
        setEditForm({ ...incoterm });
    };

    const handleSave = async () => {
        try {
            await api.put(`/incoterms/${editingId}`, editForm);
            setEditingId(null);
            fetchIncoterms();
        } catch (error) {
            console.error('Error updating incoterm:', error);
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Incoterms</h1>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {incoterms.map((incoterm) => (
                        <li key={incoterm.id}>
                            <div className="px-4 py-4 sm:px-6">
                                {editingId === incoterm.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Nom</label>
                                                <input
                                                    type="text"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700">Code XML (ex: 1, 2, 3...)</label>
                                                <input
                                                    type="text"
                                                    value={editForm.xmlCode}
                                                    onChange={(e) => setEditForm({ ...editForm, xmlCode: e.target.value })}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editForm.requiresText}
                                                    onChange={(e) => setEditForm({ ...editForm, requiresText: e.target.checked })}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="text-sm text-gray-700">Nécessite une saisie manuelle (Texte)</span>
                                            </label>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={handleCancel} className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Annuler</button>
                                            <button onClick={handleSave} className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700">Enregistrer</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-blue-600 truncate w-48">
                                                {incoterm.name}
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${incoterm.requiresText ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                    {incoterm.xmlCode}
                                                </span>
                                            </div>
                                            <span className="ml-4 text-xs text-gray-500">
                                                {incoterm.requiresText ? 'Saisie Manuelle' : 'Standard'}
                                            </span>
                                        </div>
                                        <button onClick={() => handleEdit(incoterm)} className="text-sm text-indigo-600 hover:text-indigo-900 border border-indigo-100 px-3 py-1 rounded bg-indigo-50">
                                            Modifier
                                        </button>
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default IncotermList;
