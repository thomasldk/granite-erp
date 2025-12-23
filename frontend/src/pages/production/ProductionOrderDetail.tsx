import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface WorkOrder {
    id: string;
    reference: string;
    status: string;
    mepDate: string;
    deadlineDate: string;
    deliveryDate: string;
    note: string;
    quote: {
        id: string;
        reference: string; // Soumission #
        client: { name: string };
        project: { name: string };
        items: any[];
    };
    pallets: any[];
}

export default function ProductionOrderDetail() {
    const { id } = useParams();
    const [wo, setWo] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);
    // State to track inputs for new pallet: { quoteItemId: quantity }
    const [palletInputs, setPalletInputs] = useState<Record<string, number>>({});

    useEffect(() => {
        if (id) fetchWorkOrder();
    }, [id]);

    const fetchWorkOrder = async () => {
        try {
            const res = await api.get(`/work-orders/${id}`);
            setWo(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (!wo) return <div>Introuvable</div>;

    // Helper to calculate Produced Qty per Item
    const getProducedQty = (quoteItemId: string) => {
        let total = 0;
        wo.pallets.forEach(pallet => {
            pallet.items.forEach((pItem: any) => {
                if (pItem.quoteItemId === quoteItemId) {
                    total += pItem.quantity;
                }
            });
        });
        return total;
    };

    const handleCreatePallet = async () => {
        // Filter items with quantity > 0
        const itemsToPack = Object.entries(palletInputs)
            .filter(([_, qty]) => qty > 0)
            .map(([quoteItemId, quantity]) => ({ quoteItemId, quantity }));

        if (itemsToPack.length === 0) {
            alert("Veuillez saisir des quantités pour la palette.");
            return;
        }

        try {
            await api.post(`/work-orders/${id}/pallets`, { items: itemsToPack });
            alert("Palette créée avec succès !");
            setPalletInputs({}); // Reset inputs
            fetchWorkOrder(); // Refresh to update "Remaining" and "Produced" counts
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la création de la palette.");
        }
    };

    return (
        <div className="max-w-[1920px] mx-auto p-4 bg-slate-50 min-h-screen">
            <div className="flex items-center mb-6">
                <Link to="/production" className="mr-4 text-gray-500 hover:text-gray-700">
                    <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <h1 className="text-2xl font-bold">Bon de travail : {wo.reference}</h1>
            </div>

            {/* HEADER (Gray Box) */}
            <div className="bg-gray-200 p-4 rounded-t-lg shadow-sm mb-6 border border-gray-300">
                <div className="grid grid-cols-2 gap-8">
                    {/* Left Side */}
                    <div className="space-y-2">
                        <div className="flex">
                            <span className="w-40 font-semibold text-gray-700">Nom du client</span>
                            <span className="font-bold">{wo.quote.client.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-40 font-semibold text-gray-700">Numéro</span>
                            <span>{wo.reference}</span>
                        </div>
                        <div className="flex">
                            <span className="w-40 font-semibold text-gray-700">Date de début</span>
                            <span>{new Date(wo.mepDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex mt-4">
                            <span className="w-40 font-semibold text-gray-700">Status</span>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-sm font-medium">{wo.status}</span>
                        </div>
                        <div className="flex mt-2">
                            <span className="w-40 font-semibold text-gray-700">Note</span>
                            <p className="italic text-gray-600">{wo.note || 'Aucune note'}</p>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="space-y-2">
                        <div className="flex bg-white/50 p-1 rounded">
                            <span className="w-48 font-semibold text-gray-700">Numéro de la soumission</span>
                            <Link to={`/quotes/${wo.quote.id}`} className="text-blue-600 font-bold hover:underline">
                                {wo.quote.reference}
                            </Link>
                        </div>
                        <div className="flex">
                            <span className="w-48 font-semibold text-gray-700">A produire pour le</span>
                            <span className="font-bold">{wo.deadlineDate ? new Date(wo.deadlineDate).toLocaleDateString() : '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-48 font-semibold text-gray-700">A livrer le</span>
                            <span className="font-bold">{wo.deliveryDate ? new Date(wo.deliveryDate).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACTIONS / PALLETS HEADER REMOVED - INTEGRATED BELOW */}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Détails de production & Palettisation</h3>
                <button
                    onClick={handleCreatePallet}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2"
                >
                    <span>📦</span> Créer Palette
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="px-3 py-2 text-left w-16">Ligne</th>
                            <th className="px-3 py-2 text-left w-32">Ref</th>
                            <th className="px-3 py-2 text-left w-32">Tag</th>
                            <th className="px-3 py-2 text-left">Item</th>
                            {/* <th className="px-3 py-2 text-left">Finis</th> */}
                            <th className="px-3 py-2 text-center w-24">Qté Initiale</th>
                            <th className="px-3 py-2 text-center w-24">Reste</th>
                            <th className="px-3 py-2 text-center w-32 bg-blue-900 border-l border-blue-700">Qté Palette</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {wo.quote.items.map((item, index) => {
                            const produced = getProducedQty(item.id);
                            const remaining = (item.quantity - produced);
                            const isComplete = remaining <= 0;
                            const inputVal = palletInputs[item.id] || '';

                            return (
                                <tr key={item.id || index} className={isComplete ? 'bg-green-50 opacity-75' : 'hover:bg-gray-50'}>
                                    <td className="px-3 py-2 font-medium text-gray-500">{item.lineNo}</td>
                                    <td className="px-3 py-2 font-medium">{item.refReference || '-'}</td>
                                    <td className="px-3 py-2 font-bold">{item.tag || '-'}</td>
                                    <td className="px-3 py-2">
                                        <div className="font-medium text-gray-900">{item.product || item.description}</div>
                                        {/* <div className="text-gray-500 text-xs">{item.description}</div> */}
                                    </td>
                                    {/* <td className="px-3 py-2">{item.finish}</td> */}

                                    {/* QUANTITIES */}
                                    <td className="px-3 py-2 text-center font-bold text-gray-700">{item.quantity}</td>
                                    {/* <td className="px-3 py-2 text-right text-blue-600 font-medium">{produced}</td> */}
                                    <td className="px-3 py-2 text-center font-bold text-red-600">
                                        {remaining > 0 ? remaining : 0}
                                    </td>

                                    {/* PALLET INPUT */}
                                    <td className="px-3 py-2 text-center bg-blue-50 border-l border-blue-100 table-cell-input">
                                        {!isComplete && (
                                            <input
                                                type="number"
                                                min="0"
                                                max={remaining}
                                                className={`w-20 text-center border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-bold ${inputVal ? 'bg-white border-blue-500 shadow-sm' : 'bg-transparent'}`}
                                                placeholder="0"
                                                value={inputVal}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setPalletInputs(prev => ({
                                                        ...prev,
                                                        [item.id]: isNaN(val) ? 0 : val
                                                    }));
                                                }}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        )}
                                        {isComplete && <span className="text-green-600 font-bold">✓</span>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
