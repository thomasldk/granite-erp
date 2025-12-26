import React, { useState, useEffect } from 'react';
import { getThirdParties } from '../../services/thirdPartyService';
import { formatPhoneNumber } from '../../utils/formatters';
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
    // Structured Address State
    const [addrLine1, setAddrLine1] = useState('');
    const [addrCity, setAddrCity] = useState('');
    const [addrState, setAddrState] = useState('');
    const [addrZip, setAddrZip] = useState('');
    const [addrCountry, setAddrCountry] = useState('Canada');

    const [siteContactName, setSiteContactName] = useState('');
    const [siteContactPhone, setSiteContactPhone] = useState('');
    const [siteContactEmail, setSiteContactEmail] = useState('');
    const [clientId, setClientId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transportSuppliers, setTransportSuppliers] = useState<any[]>([]);

    // Filter selected pallets
    const selectedPallets = availablePallets.filter(p => selectedPalletIds.includes(p.id));

    useEffect(() => {
        const fetchTransportSuppliers = async () => {
            try {
                const suppliers = await getThirdParties('Supplier');
                const transporters = suppliers.filter((s: any) =>
                    s.supplierType?.toLowerCase().includes('transport')
                );
                setTransportSuppliers(transporters);
            } catch (err) {
                console.error("Failed to fetch transport suppliers", err);
            }
        };
        fetchTransportSuppliers();
    }, []);

    useEffect(() => {
        if (selectedPallets.length > 0) {
            // Auto-populate logic based on first selected pallet
            const firstP = selectedPallets[0];
            const client = firstP.workOrder?.quote?.client;
            if (client) {
                setClientId(client.id);
                // Pre-fill address if available
                const project = firstP.workOrder?.quote?.project;
                // If Client Address is available, use it as fallback
                if (client.addresses && client.addresses.length > 0) {
                    const addr = client.addresses[0];
                    setAddrLine1(addr.line1 || '');
                    setAddrCity(addr.city || '');
                    setAddrState(addr.state || '');
                    setAddrZip(addr.zipCode || '');
                    setAddrCountry(addr.country || 'Canada');
                }

                // If Project Location Name looks like an address, put it in Line 1 (Simple heuristic)
                if (project && project.location) {
                    setAddrLine1(project.location.name); // Overwrite Line1
                }
            }
        }
    }, [selectedPallets]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Concatenate Address
        const fullAddress = `
${addrLine1}
${addrCity ? addrCity + ', ' : ''}${addrState ? addrState + ' ' : ''}${addrZip ? addrZip : ''}
${addrCountry}
        `.trim();

        try {
            await api.post('/delivery/notes', {
                clientId,
                date,
                carrier,
                address: fullAddress,
                // Pass structured address for creation
                addrLine1,
                addrCity,
                addrState,
                addrZip,
                addrCountry,
                siteContactName,
                siteContactPhone,
                siteContactEmail,
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
                        <select
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">-- Sélectionner Transporteur --</option>
                            <option value="Propre camion">Propre camion</option>
                            <option value="Client ramasse">Client ramasse</option>
                            {transportSuppliers.map((s: any) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700 underline">Adresse Complète du Chantier</label>
                            {/* Address Selector */}
                            <select
                                className="text-sm border-gray-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;

                                    // Find address in client data (from first pallet)
                                    // We need to access availablePallets in this scope or store addresses in state
                                    // Ideally we store available addresses in state when pallet changes
                                    const firstP = selectedPallets[0];
                                    const clientAddrs = firstP?.workOrder?.quote?.client?.addresses || [];
                                    const selectedAddr = clientAddrs.find((a: any) => a.id === val);

                                    if (selectedAddr) {
                                        setAddrLine1(selectedAddr.line1 || '');
                                        setAddrCity(selectedAddr.city || '');
                                        setAddrState(selectedAddr.state || '');
                                        setAddrZip(selectedAddr.zipCode || '');
                                        setAddrCountry(selectedAddr.country || 'Canada');
                                    }
                                }}
                            >
                                <option value="">-- Choisir une adresse existante --</option>
                                {/* We need to list addresses here. But 'selectedPallets' is derived. */}
                                {/* Let's use a function or memos */}
                                {(() => {
                                    const clientAddrs = selectedPallets[0]?.workOrder?.quote?.client?.addresses || [];
                                    return clientAddrs.map((a: any) => (
                                        <option key={a.id} value={a.id}>
                                            {a.line1}, {a.city} ({a.type})
                                        </option>
                                    ));
                                })()}
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <input
                                placeholder="Adresse (Ligne 1)"
                                value={addrLine1}
                                onChange={(e) => setAddrLine1(e.target.value)}
                                className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Ville"
                                    value={addrCity}
                                    onChange={(e) => setAddrCity(e.target.value)}
                                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                                <input
                                    placeholder="Province / État"
                                    value={addrState}
                                    onChange={(e) => setAddrState(e.target.value)}
                                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Code Postal"
                                    value={addrZip}
                                    onChange={(e) => setAddrZip(e.target.value)}
                                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                                <input
                                    placeholder="Pays"
                                    value={addrCountry}
                                    onChange={(e) => setAddrCountry(e.target.value)}
                                    className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Chantier</label>
                            <input
                                type="text"
                                value={siteContactName}
                                onChange={(e) => setSiteContactName(e.target.value)}
                                placeholder="Nom du responsable"
                                className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cellulaire</label>
                            <input
                                type="text"
                                value={siteContactPhone}
                                onChange={(e) => setSiteContactPhone(formatPhoneNumber(e.target.value))}
                                placeholder="+1 (xxx) xxx-xxxx"
                                className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Courriel</label>
                            <input
                                type="email"
                                value={siteContactEmail}
                                onChange={(e) => setSiteContactEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                className="w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        </div>
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
