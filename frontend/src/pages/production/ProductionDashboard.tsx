import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface WorkOrder {
    id: string;
    reference: string;
    mepDate: string;
    deadlineDate: string; // Used for "A Livrer Pour Le" logic if needed, but we keep DeliveryDate
    deliveryDate: string;
    clientRequiredDate: string;
    quote: {
        client: { name: string };
        project: { name: string };
    };
    clientPOFilePath?: string;
    productionSite?: { name: string }; // New
}

export default function ProductionDashboard() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        try {
            const res = await api.get('/work-orders');
            setWorkOrders(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Better: Helper to open PO
    const handleOpenPO = async (id: string) => {
        try {
            const response = await api.get(`/work-orders/${id}/po-view`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            window.open(url, '_blank');
        } catch (e) {
            alert("Impossible d'ouvrir le PO.");
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-[1920px] mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Liste des Bons de Production</h1>

            <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu de production</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MEP</th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A LIVRER POUR LE</th>

                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fichier PO</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {workOrders.map((wo) => (
                            <tr key={wo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/production/${wo.id}`} className="text-blue-600 hover:text-blue-900">
                                        {wo.reference}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wo.productionSite?.name || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(wo.mepDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wo.deliveryDate ? new Date(wo.deliveryDate).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {wo.quote.client.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wo.quote.project.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {wo.clientPOFilePath ? (
                                        <button
                                            onClick={() => handleOpenPO(wo.id)}
                                            className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                                        >
                                            Reçu
                                        </button>
                                    ) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
