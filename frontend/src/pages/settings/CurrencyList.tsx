import React, { useEffect, useState } from 'react';
import { getCurrencies, api } from '../../services/thirdPartyService';

interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
}

const CurrencyList: React.FC = () => {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [newCurr, setNewCurr] = useState({ code: '', name: '', symbol: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        try {
            const data = await getCurrencies();
            setCurrencies(data);
        } catch (error) {
            console.error('Error loading currencies', error);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCurr.code.trim() || !newCurr.name.trim()) return;

        setLoading(true);
        try {
            await api.post('/settings/currencies', newCurr);
            setNewCurr({ code: '', name: '', symbol: '' });
            loadCurrencies();
        } catch (error) {
            console.error('Error adding currency', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette devise ?')) return;
        try {
            await api.delete(`/settings/currencies/${id}`);
            loadCurrencies();
        } catch (error) {
            console.error('Error deleting currency', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Devises</h2>

            <form onSubmit={handleAdd} className="mb-8 flex gap-4 items-end">
                <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Code</label>
                    <input
                        type="text"
                        value={newCurr.code}
                        onChange={(e) => setNewCurr({ ...newCurr, code: e.target.value })}
                        placeholder="Ex: CAD"
                        className="w-24 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-gray-700 text-xs font-bold mb-1">Nom</label>
                    <input
                        type="text"
                        value={newCurr.name}
                        onChange={(e) => setNewCurr({ ...newCurr, name: e.target.value })}
                        placeholder="Ex: Dollar Canadien"
                        className="w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-xs font-bold mb-1">Symbole</label>
                    <input
                        type="text"
                        value={newCurr.symbol}
                        onChange={(e) => setNewCurr({ ...newCurr, symbol: e.target.value })}
                        placeholder="Ex: $"
                        className="w-20 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-0.5"
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
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Symbole</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currencies.map((curr) => (
                            <tr key={curr.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 font-mono font-bold">{curr.code}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900">{curr.name}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900">{curr.symbol}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                    <button
                                        onClick={() => handleDelete(curr.id)}
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

export default CurrencyList;
