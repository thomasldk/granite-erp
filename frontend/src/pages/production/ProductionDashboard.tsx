import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import ProductionLineView from './ProductionLineView';

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
        items: any[]; // New for Production Line View
    };
    clientPOFilePath?: string;
    productionSite?: { name: string };
    pallets?: any[]; // Allow pallets to pass through
}

export default function ProductionDashboard() {
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterSite, setFilterSite] = useState<string>('All');

    useEffect(() => {
        fetchWorkOrders();
    }, []);

    const fetchWorkOrders = async () => {
        try {
            const res = await api.get('/work-orders');
            console.log("Dashboard fetched WOs:", res.data); // DEBUG
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

    const location = useLocation();
    // Determine view based on URL. Default to 'list' if just /production
    const isLineView = location.pathname.includes('/line');

    // ... useEffect ...

    // ... fetchWorkOrders ...

    // ... handleOpenPO ...

    const filteredWorkOrders = workOrders.filter(wo => {
        if (filterSite === 'All') return true;
        return wo.productionSite?.name === filterSite;
    });

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="max-w-[1920px] mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-6">
                    <h1 className="text-2xl font-bold border-r pr-6 border-gray-300">
                        {isLineView ? 'Ligne de production' : 'Liste des BT'}
                    </h1>
                </div>

                <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Site:</label>
                    <select
                        value={filterSite}
                        onChange={(e) => setFilterSite(e.target.value)}
                        className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="All">Tout</option>
                        <option value="RAP">RAP</option>
                        <option value="STD">STD</option>
                    </select>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden rounded-md min-h-[500px]">
                {!isLineView ? (
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
                            {filteredWorkOrders.map((wo) => (
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
                ) : (
                    <div className="p-4">
                        <ProductionLineView workOrders={filteredWorkOrders} />
                    </div>
                )}
            </div>
        </div>
    );
}
