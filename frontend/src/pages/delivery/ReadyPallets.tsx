import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardDocumentCheckIcon, TruckIcon } from '@heroicons/react/24/outline';
import CreateDeliveryModal from '../../components/delivery/CreateDeliveryModal'; // We will create this next

const ReadyPallets: React.FC = () => {
    const [pallets, setPallets] = useState<any[]>([]);
    const [selectedPallets, setSelectedPallets] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);

    useEffect(() => {
        fetchReadyPallets();
    }, []);

    const fetchReadyPallets = async () => {
        try {
            const response = await api.get('/delivery/pallets/ready');
            setPallets(response.data);
        } catch (error) {
            console.error("Error fetching ready pallets", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedPallets(prev =>
            prev.includes(id)
                ? prev.filter(pId => pId !== id)
                : [...prev, id]
        );
    };

    const handleCreateClick = () => {
        if (selectedPallets.length === 0) return;
        setIsCreationModalOpen(true);
    };

    // Group pallets by Client -> Project for better display
    const groupedPallets = pallets.reduce((acc: any, pallet: any) => {
        const clientName = pallet.workOrder?.quote?.client?.name || "Inconnu";
        const projectId = pallet.workOrder?.quote?.projectId || "Divers";
        const projectRef = pallet.workOrder?.quote?.project?.reference || "Divers";
        const projectName = pallet.workOrder?.quote?.project?.name || "";

        if (!acc[clientName]) acc[clientName] = {};
        if (!acc[clientName][projectId]) acc[clientName][projectId] = {
            ref: projectRef,
            name: projectName,
            pallets: []
        };

        acc[clientName][projectId].pallets.push(pallet);
        return acc;
    }, {});


    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 mr-2" />
                    Palettes Prêtes à Livrer
                </h1>
                <button
                    onClick={handleCreateClick}
                    disabled={selectedPallets.length === 0}
                    className={`flex items-center px-4 py-2 rounded shadow transition-colors ${selectedPallets.length > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <TruckIcon className="h-5 w-5 mr-2" />
                    Créer Bon de Livraison ({selectedPallets.length})
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500">Chargement...</div>
            ) : pallets.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    Aucune palette prête à être livrée. (Statut requis: Validé)
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedPallets).map(([client, projects]: [string, any]) => (
                        <div key={client} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-700">{client}</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                {Object.values(projects).map((project: any) => (
                                    <div key={project.ref} className="border border-gray-100 rounded p-3">
                                        <h3 className="text-sm font-medium text-blue-600 mb-2">
                                            {project.ref} - {project.name}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {project.pallets.map((pallet: any) => (
                                                <div
                                                    key={pallet.id}
                                                    onClick={() => toggleSelection(pallet.id)}
                                                    className={`cursor-pointer rounded border p-3 flex justify-between items-start transition-all ${selectedPallets.includes(pallet.id)
                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-800">Palette {pallet.number}</div>
                                                        <div className="text-xs text-gray-500">{new Date(pallet.createdAt).toLocaleDateString()}</div>
                                                        <div className="text-xs text-gray-600 mt-1">
                                                            Poids: {pallet.items?.reduce((sum: number, item: any) => sum + (item.quoteItem?.totalWeight || 0), 0).toFixed(1)} lbs
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPallets.includes(pallet.id)}
                                                        onChange={() => { }} // Handled by div click
                                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isCreationModalOpen && (
                <CreateDeliveryModal
                    isOpen={isCreationModalOpen}
                    onClose={() => setIsCreationModalOpen(false)}
                    selectedPalletIds={selectedPallets}
                    availablePallets={pallets} // Pass all to find details
                    onSuccess={() => {
                        setIsCreationModalOpen(false);
                        setSelectedPallets([]);
                        fetchReadyPallets();
                    }}
                />
            )}
        </div>
    );
};

export default ReadyPallets;
