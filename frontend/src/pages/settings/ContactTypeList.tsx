import React, { useEffect, useState } from 'react';
import { getContactTypes, createContactType, deleteContactType } from '../../services/thirdPartyService';

interface ContactType {
    id: string;
    name: string;
}

const ContactTypeList: React.FC = () => {
    const [types, setTypes] = useState<ContactType[]>([]);
    const [newType, setNewType] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            const data = await getContactTypes();
            setTypes(data);
        } catch (error) {
            console.error('Error loading contact types', error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newType.trim()) return;

        setLoading(true);
        try {
            await createContactType(newType);
            setNewType('');
            loadTypes();
        } catch (error) {
            console.error('Error adding type', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) return;
        try {
            await deleteContactType(id);
            loadTypes();
        } catch (error) {
            console.error('Error deleting type', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Types de Contact</h2>

            <form onSubmit={handleAdd} className="mb-8 flex gap-4">
                <input
                    type="text"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    placeholder="Nouveau type (ex: Architecte, Comptable...)"
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
                                    <p className="text-gray-900 whitespace-no-wrap">{type.name}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    <button
                                        onClick={() => handleDelete(type.id)}
                                        className="text-red-600 hover:text-red-900 font-bold"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {types.length === 0 && (
                            <tr>
                                <td colSpan={2} className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    Aucun type de contact défini.
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
