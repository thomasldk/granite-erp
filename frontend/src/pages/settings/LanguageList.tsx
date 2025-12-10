import React, { useEffect, useState } from 'react';
import { getLanguages, api } from '../../services/thirdPartyService';

interface Language {
    id: string;
    code: string;
    name: string;
}

const LanguageList: React.FC = () => {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [newLang, setNewLang] = useState({ code: '', name: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLanguages();
    }, []);

    const loadLanguages = async () => {
        try {
            const data = await getLanguages();
            setLanguages(data);
        } catch (error) {
            console.error('Error loading languages', error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLang.code.trim() || !newLang.name.trim()) return;

        setLoading(true);
        try {
            await api.post('/settings/languages', newLang);
            setNewLang({ code: '', name: '' });
            loadLanguages();
        } catch (error) {
            console.error('Error adding language', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette langue ?')) return;
        try {
            await api.delete(`/settings/languages/${id}`);
            loadLanguages();
        } catch (error) {
            console.error('Error deleting language', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Langues</h2>

            <form onSubmit={handleAdd} className="mb-8 flex gap-4">
                <input
                    type="text"
                    value={newLang.code}
                    onChange={(e) => setNewLang({ ...newLang, code: e.target.value })}
                    placeholder="Code (ex: fr)"
                    className="w-32 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                />
                <input
                    type="text"
                    value={newLang.name}
                    onChange={(e) => setNewLang({ ...newLang, name: e.target.value })}
                    placeholder="Nom (ex: Français)"
                    className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    required
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
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {languages.map((lang) => (
                            <tr key={lang.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 font-mono font-bold">{lang.code}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900">{lang.name}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    <button
                                        onClick={() => handleDelete(lang.id)}
                                        className="text-red-600 hover:text-red-900 font-bold"
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LanguageList;
