import React, { useEffect, useState } from 'react';
import { getCurrencies, api } from '../../services/thirdPartyService';
import { getSystemSettings } from '../../services/settingsService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface Currency {
    id: string;
    code: string;
    name: string;
    symbol: string;
}

interface HistoryEntry {
    id: string;
    rate: number;
    date: string;
}

const CurrencyList: React.FC = () => {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [newCurr, setNewCurr] = useState({ code: '', name: '', symbol: '' });
    const [loading, setLoading] = useState(false);

    // Exchange Rate State
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [refreshingRate, setRefreshingRate] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null);

    useEffect(() => {
        loadCurrencies();
        loadExchangeRate();
        loadHistory();
    }, []);

    const loadCurrencies = async () => {
        try {
            const data = await getCurrencies();
            setCurrencies(data);
        } catch (error) {
            console.error('Error loading currencies', error);
        }
    };

    const loadExchangeRate = async () => {
        try {
            const settings = await getSystemSettings();
            if (settings.defaultExchangeRate) {
                setExchangeRate(parseFloat(settings.defaultExchangeRate));
            }
        } catch (error) {
            console.error('Error loading exchange rate', error);
        }
    };

    const loadHistory = async () => {
        try {
            const res = await api.get('/system-config/exchange-rate-history');
            // Backend returns Ascending (Oldest -> Newest)
            setHistory(res.data);
            if (res.data.length > 0) {
                // Last item is the newest
                setLastUpdateDate(res.data[res.data.length - 1].date);
            }
        } catch (error) {
            console.error('Error loading history', error);
        }
    };

    const handleRefreshRate = async () => {
        setRefreshingRate(true);
        try {
            const res = await api.post('/system-config/refresh-exchange-rate');
            setExchangeRate(res.data.rate);
            loadHistory(); // Reload history to get the new point
        } catch (error) {
            console.error('Error refreshing rate', error);
            alert("Erreur lors de l'actualisation du taux.");
        } finally {
            setRefreshingRate(false);
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

    // Prepare data for table (Newest first)
    const tableHistory = [...history].reverse();

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gestion des Devises et Taux de Change</h2>

            {/* EXCHANGE RATE SECTION */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                    <span className="mr-2">💵</span> Taux de Change (USD {'->'} CAD)
                </h3>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Current Rate Block */}
                    <div className="flex-shrink-0">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="text-4xl font-mono font-bold text-green-800">
                                {exchangeRate !== null ? exchangeRate.toFixed(4) : '...'}
                            </div>
                            <button
                                onClick={handleRefreshRate}
                                disabled={refreshingRate}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors text-sm"
                            >
                                {refreshingRate ? 'Actualisation...' : 'Actualiser le taux'}
                            </button>
                        </div>
                        {lastUpdateDate && (
                            <p className="text-sm font-semibold text-green-800 mb-1">
                                Date du taux : {format(new Date(lastUpdateDate), 'dd/MM/yyyy HH:mm')}
                            </p>
                        )}
                        <p className="text-xs text-green-700">
                            Source: api.frankfurter.app
                            <br />
                            Mise à jour auto : Tous les jours à 10h00
                        </p>
                    </div>

                    {/* Graph */}
                    <div className="flex-1 h-64 bg-white rounded border border-green-100 p-2">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis domain={[1.2, 1.6]} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy HH:mm')}
                                    />
                                    <Line type="monotone" dataKey="rate" stroke="#16a34a" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="mt-6">
                    <h4 className="text-sm font-bold text-green-900 mb-2">Historique récent</h4>
                    <div className="max-h-40 overflow-y-auto bg-white rounded border border-green-200">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-green-100 font-bold text-green-900 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Taux</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-green-100">
                                {tableHistory.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-1.5">{format(new Date(entry.date), 'dd/MM/yyyy HH:mm')}</td>
                                        <td className="px-4 py-1.5 font-mono">{entry.rate.toFixed(4)}</td>
                                    </tr>
                                ))}
                                {tableHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-2 text-gray-500 italic">Aucun historique disponible.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <form onSubmit={handleAdd} className="mb-8 flex gap-4 items-end">
                {/* ... existing form ... */}
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
