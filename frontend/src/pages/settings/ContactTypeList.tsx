import React, { useEffect, useState } from 'react';
import { getContactTypes, createContactType, deleteContactType, updateContactType } from '../../services/thirdPartyService';

interface ContactType {
    id: string;
    name: string;
}

const ContactTypeList: React.FC = () => {
    const [types, setTypes] = useState<ContactType[]>([]);
    const [newType, setNewType] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'Client' | 'Supplier'>('Client');

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        loadTypes();
    }, [activeTab]);

    const loadTypes = async () => {
        try {
            const data = await getContactTypes(activeTab);
            setTypes(data);
        } catch (error) {
            console.error('Error loading contact types', error);
        }
    };

    const startEditing = (type: ContactType) => {
        setEditingId(type.id);
        setEditingName(type.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveEditing = async () => {
        if (!editingName.trim() || !editingId) return;
        try {
            await updateContactType(editingId, editingName, activeTab);
            setEditingId(null);
            loadTypes();
        } catch (error) {
            console.error('Error updating type', error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newType.trim()) return;

        setLoading(true);
        try {
            await createContactType(newType, activeTab);
            setNewType('');
            loadTypes();
        } catch (error) {
            console.error('Error adding type', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const code = window.prompt("Code de sécurité requis pour supprimer :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }

        try {
            await deleteContactType(id);
            loadTypes();
        } catch (error) {
            console.error('Failed to delete type', error);
            alert('Erreur: Impossible de supprimer (peut-être utilisé ?)');
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Types de Contact</h2>

            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'Client'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('Client')}
                >
                    Types Clients
                </button>
                <button
                    className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'Supplier'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('Supplier')}
                >
                    Types Fournisseurs
                </button>
            </div>

            <form onSubmit={handleAdd} className="mb-8 flex gap-4">
                <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder={`Nouveau type ${activeTab === 'Client' ? 'Client' : 'Fournisseur'}...`}
                    className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    {loading ? 'Ajout...' : 'Ajouter'}
                </button>
            </form>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nom
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {types.map((type) => (
                            <tr key={type.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {editingId === type.id ? (
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="shadow appearance-none border rounded py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-primary w-full"
                                        />
                                    ) : (
                                        <p className="text-gray-900 whitespace-no-wrap">{type.name}</p>
                                    )}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    {editingId === type.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={saveEditing} className="text-green-600 hover:text-green-900 font-bold">Sauver</button>
                                            <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 font-bold">Annuler</button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => startEditing(type)} className="text-blue-600 hover:text-blue-900 font-bold">Modifier</button>
                                            <button onClick={() => handleDelete(type.id)} className="text-red-600 hover:text-red-900 font-bold">Supprimer</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {types.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    Aucun type pour {activeTab === 'Client' ? 'Clients' : 'Fournisseurs'}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ContactTypeList;
