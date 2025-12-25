import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface CreateDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPalletIds: string[];
    availablePallets: any[];
    onSuccess: () => void;
}

const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
    isOpen,
    onClose,
    selectedPalletIds,
    availablePallets,
    onSuccess
}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [carrier, setCarrier] = useState('');
    const [address, setAddress] = useState('');
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter selected pallets
    const selectedPallets = availablePallets.filter(p => selectedPalletIds.includes(p.id));

    useEffect(() => {
        if (selectedPallets.length > 0) {
            // Auto-populate logic based on first selected pallet
            const firstP = selectedPallets[0];
            const client = firstP.workOrder?.quote?.client;
            if (client) {
                setClientId(client.id);
                // Default Address Logic: Project Location or Client Address?
                // For now, let's look for project location or manually entered
                const project = firstP.workOrder?.quote?.project;
                if (project && project.location) {
                    setAddress(project.location.name); // Simplified
                } else if (client.addresses && client.addresses.length > 0) {
                    const addr = client.addresses[0];
                    setAddress(`${addr.line1}, ${addr.city}`);
                }
            }
        }
    }, [selectedPallets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await api.post('/delivery/notes', {
                clientId,
                date,
                carrier,
                address,
                palletIds: selectedPalletIds
            });
            onSuccess();
        } catch (err) {
            console.error("Failed to create delivery note", err);
            setError("Erreur lors de la création du BL.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Calculate totals
    const totalWeight = selectedPallets.reduce((sum, p) =>
        sum + (p.items?.reduce((s: number, i: any) => s + (i.quoteItem?.totalWeight || 0), 0) || 0), 0
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Créer Bon de Livraison</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded text-sm text-blue-800 mb-4">
                        <p><strong>{selectedPallets.length} Palette(s) sélectionnée(s)</strong></p>
                        <p>Poids Total estimé: {totalWeight.toFixed(1)} lbs</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
                        <input
                            type="text"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            placeholder="Ex: Robert Transport, Propre camion..."
                            className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de Livraison</label>
                        <textarea
                            required
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 bg-white"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                        >
                            {loading && <span className="animate-spin mr-2">⏳</span>}
                            Générer BL
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateDeliveryModal;
