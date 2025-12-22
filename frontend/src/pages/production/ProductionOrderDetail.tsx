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

            {/* ACTIONS / PALLETS */}
            <div className="mb-4 flex justify-between items-center bg-white p-3 rounded shadow-sm">
                <h3 className="text-lg font-bold">Informations détaillées (Palettes: {wo.pallets.length})</h3>
                <div className="space-x-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        + Créer Palette
                    </button>
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Ajouter Item à Palette
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white shadow overflow-hidden rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="px-3 py-2 text-left">Ligne</th>
                            <th className="px-3 py-2 text-left">Statut</th>
                            <th className="px-3 py-2 text-left">Tag</th>
                            <th className="px-3 py-2 text-left">Item</th>
                            <th className="px-3 py-2 text-left">Finis</th>
                            <th className="px-3 py-2 text-right">Qté Initiale</th>
                            <th className="px-3 py-2 text-right">Qté Produite (Pal)</th>
                            <th className="px-3 py-2 text-right">Reste à Produire</th>
                            <th className="px-3 py-2 text-right">Unit</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {wo.quote.items.map((item, index) => {
                            const produced = getProducedQty(item.id);
                            const remaining = (item.quantity - produced);
                            const isComplete = remaining <= 0;

                            return (
                                <tr key={item.id || index} className={isComplete ? 'bg-green-50' : 'hover:bg-gray-50'}>
                                    <td className="px-3 py-2 font-medium">{item.lineNo}</td>
                                    <td className="px-3 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${isComplete ? 'bg-green-200 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {isComplete ? 'Complet' : '00 - Ouvert'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2 font-bold">{item.tag}</td>
                                    <td className="px-3 py-2">
                                        <div className="font-medium text-xs">{item.material}</div>
                                        <div className="text-gray-500 text-xs">{item.description}</div>
                                    </td>
                                    <td className="px-3 py-2">{item.finish}</td>

                                    {/* QUANTITIES */}
                                    <td className="px-3 py-2 text-right font-bold">{item.quantity}</td>
                                    <td className="px-3 py-2 text-right text-blue-600 font-medium">{produced}</td>
                                    <td className="px-3 py-2 text-right font-bold text-red-600">
                                        {remaining > 0 ? remaining : 0}
                                    </td>
                                    <td className="px-3 py-2 text-right">{item.unit}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
