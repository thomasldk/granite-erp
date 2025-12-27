import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import ProductionItemModal from '../../components/ProductionItemModal';
import PalletEditModal from '../../components/PalletEditModal';
import { useAuth } from '../../context/AuthContext';

// Define interface for Quote Item
interface QuoteItem {
    id: string;
    reference: string;
    lineNo?: string;
    tag?: string;
    description: string;
    quantity: number;
    material?: string;
    unit?: string;
    finish?: string;
    refReference?: string;
    product?: string;
    // Dimensions for weight calc
    length?: number;
    width?: number;
    thickness?: number;
}

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
        reference: string;
        client: { name: string };
        project: { name: string; measureSystem?: string };
        items: QuoteItem[];
    };
    pallets: any[];
    clientPO?: string;
    productionSite?: { name: string };
    additionalContacts?: {
        id: string;
        role: { name: string; nameEn?: string };
        contact: { firstName: string; lastName: string; email: string; mobilePhone?: string };
    }[];
}

// Default density
const DEFAULT_DENSITY_LBS_FT3 = 175.24;

export default function ProductionOrderDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const [wo, setWo] = useState<WorkOrder | null>(null);
    const [loading, setLoading] = useState(true);

    // State to track inputs for new pallet: { quoteItemId: quantity }
    const [palletInputs, setPalletInputs] = useState<Record<string, number>>({});
    const [selectedItem, setSelectedItem] = useState<{ item: any; wo: any } | null>(null);

    // State for selected pallets (for weight calculation)
    const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);

    // State for Pallet Edit Modal
    const [editingPallet, setEditingPallet] = useState<any | null>(null);

    // State for Status Change Confirmation Modal
    // State for Status Change Confirmation Modal
    const [statusChangePallet, setStatusChangePallet] = useState<any | null>(null);

    // Track Printing State
    const [printingPalletId, setPrintingPalletId] = useState<string | null>(null);

    // Load WO
    useEffect(() => {
        fetchWorkOrder();
    }, [id]);

    // Initialize selected pallets when WO loads
    useEffect(() => {
        if (wo && wo.pallets) {
            if (selectedPalletIds.length === 0) {
                setSelectedPalletIds(wo.pallets.map((p: any) => p.id));
            }
        }
    }, [wo?.pallets?.length]);

    const fetchWorkOrder = async () => {
        try {
            const res = await api.get(`/work-orders/${id}`);
            // Sort pallets by createdAt to ensure stable order
            if (res.data && res.data.pallets) {
                res.data.pallets.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            }
            setWo(res.data);
        } catch (e) {
            console.error(e);
            alert("Erreur lors du chargement du bon de travail");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmStatusChange = async () => {
        if (!statusChangePallet || !wo) return;

        // Determine next status
        const current = statusChangePallet.status;
        let next = 'Open';
        if (current === 'Open' || current === 'Ouvert') next = 'Fermé';
        else if (current === 'Fermé') next = 'Validé';

        try {
            await api.patch(`/work-orders/${wo.id}/pallets/${statusChangePallet.id}`, {
                status: next
            });
            fetchWorkOrder();
            setStatusChangePallet(null);
        } catch (e) {
            console.error("Status update failed", e);
            alert("Erreur lors du changement de statut");
        }
    };

    // Helper to view PO
    const handleViewPO = async () => {
        if (!wo?.id) return;
        try {
            const response = await api.get(`/work-orders/${wo.id}/po-view`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error viewing PO:", error);
            alert("Impossible d'ouvrir le fichier PO (introuvable ou erreur serveur).");
        }
    };

    // Helper: Pallet ID
    const getPalletId = (index: number, createdAt: string) => {
        const date = new Date(createdAt);
        const year = date.getFullYear().toString().slice(-2);
        const num = (index + 1).toString().padStart(2, '0');
        const woRef = wo?.reference || '';
        const parts = woRef.split('-');
        const btSuffix = parts.length > 1 ? parts[parts.length - 1] : woRef;
        return `P#${num}-${year}-${btSuffix}`;
    };

    // Helper: Produced Qty
    const getProducedQty = (itemId: string) => {
        if (!wo) return 0;
        let total = 0;
        wo.pallets.forEach((p: any) => {
            p.items.forEach((pi: any) => {
                if (pi.quoteItemId === itemId) {
                    total += pi.quantity;
                }
            });
        });
        return total;
    };

    // Helper map for Modal
    const getProducedMap = () => {
        if (!wo || !wo.quote || !wo.quote.items) return {};
        const map: Record<string, number> = {};
        wo.quote.items.forEach((item: any) => {
            map[item.id] = getProducedQty(item.id);
        });
        return map;
    };

    const calculateItemWeight = (item: QuoteItem, qty: number) => {
        const isImperial = (wo?.quote.project?.measureSystem === 'Imperial') || (!wo?.quote.project?.measureSystem);
        let volumeFt3 = 0;
        if (isImperial) {
            const l = item.length || 0;
            const w = item.width || 0;
            const t = item.thickness || 0;
            volumeFt3 = (l * w * t) / 1728;
        } else {
            const l = (item.length || 0) / 304.8;
            const w = (item.width || 0) / 304.8;
            const t = (item.thickness || 0) / 304.8;
            volumeFt3 = l * w * t;
        }
        return volumeFt3 * DEFAULT_DENSITY_LBS_FT3 * qty;
    };

    const getPalletWeight = (pallet: any) => {
        if (!wo) return 0;
        let total = 0;
        pallet.items.forEach((pi: any) => {
            const item = wo.quote.items.find((q: any) => q.id === pi.quoteItemId);
            if (item) {
                total += calculateItemWeight(item, pi.quantity);
            }
        });
        return total;
    };

    // Toggle pallet selection
    const togglePalletSelection = (palletId: string) => {
        setSelectedPalletIds(prev => {
            if (prev.includes(palletId)) return prev.filter(id => id !== palletId);
            return [...prev, palletId];
        });
    };

    const totalSelectedWeight = wo?.pallets
        .filter((p: any) => selectedPalletIds.includes(p.id))
        .reduce((sum: number, p: any) => sum + getPalletWeight(p), 0) || 0;


    const handlePrintPallet = async (pallet: any) => {
        const printerName = user?.employeeProfile?.printerLabel;

        if (!printerName) {
            alert("Aucune imprimante étiquette configurée dans votre profil. Veuillez en sélectionner une dans Paramètres > Mon Profil.");
            return;
        }

        setPrintingPalletId(pallet.id); // START INDICATOR

        try {
            const res = await api.post(`/work-orders/${id}/pallets/${pallet.id}/print`, { printerName });
            console.log(`Impression envoyée vers ${printerName} !`);

            // Start Polling for Excel Download
            const { filename, clientName } = res.data;

            if (filename && clientName) {
                console.log('Polling for Excel generation:', filename);
                const startTime = Date.now();
                const pollInterval = setInterval(async () => {
                    // Timeout 60s
                    if (Date.now() - startTime > 60000) {
                        clearInterval(pollInterval);
                        setPrintingPalletId(null); // STOP INDICATOR (Timeout)
                        console.warn('Polling timeout for Excel');
                        return;
                    }

                    try {
                        const statusRes = await api.get(`/work-orders/label/status?filename=${filename}`);
                        if (statusRes.data.ready) {
                            clearInterval(pollInterval);
                            console.log('Excel ready, triggering download...');
                            setPrintingPalletId(null); // STOP INDICATOR (Success)

                            // Trigger Download
                            const downloadUrl = `${import.meta.env.VITE_API_URL}/work-orders/label/download?filename=${filename}&clientName=${clientName}`;
                            window.location.assign(downloadUrl);
                        }
                    } catch (e) {
                        // Ignore polling errors
                    }
                }, 2000); // Check every 2s
            } else {
                setPrintingPalletId(null); // Stop if no filename returned (shouldn't happen)
            }

        } catch (error) {
            console.error("Print error:", error);
            setPrintingPalletId(null); // STOP INDICATOR (Error)
            alert("Erreur lors de l'envoi de l'impression.");
        }
    };


    const handleCreatePallet = async () => {
        const items = Object.entries(palletInputs)
            .filter(([_, qty]) => qty > 0)
            .map(([quoteItemId, quantity]) => ({ quoteItemId, quantity }));

        if (items.length === 0) {
            alert("Veuillez saisir des quantités pour créer une palette.");
            return;
        }

        try {
            await api.post(`/work-orders/${id}/pallets`, { items });
            setPalletInputs({});
            fetchWorkOrder();
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la création de la palette");
        }
    };

    // UI Helpers for Status
    const getStatusColor = (status: string) => {
        if (status === 'Open' || status === 'Ouvert') return 'bg-green-100 text-green-800';
        if (status === 'Fermé') return 'bg-gray-100 text-gray-800';
        if (status === 'Validé') return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-500';
    };

    // Derived Next Status Label
    const getNextStatusLabel = (current: string) => {
        if (current === 'Open' || current === 'Ouvert') return 'Fermer';
        if (current === 'Fermé') return 'Valider';
        return null;
    };

    if (loading) return <div>Chargement...</div>;
    if (!wo) return <div>Introuvable</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header Section */}
            <div className="flex justify-between items-start bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <Link to="/production" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">Bon de Travail: {wo.reference}</h1>
                        {wo.quote?.project?.name && (
                            <span className="text-lg bg-gray-50 text-gray-600 px-3 py-1 rounded-md border border-gray-200 font-medium">
                                {wo.quote.project.name}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${wo.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {wo.status}
                    </span>
                </div>
            </div>

            {/* Editable Info Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Client</label>
                        <div className="font-medium text-gray-900">{wo.quote.client.name}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">A produire pour le</label>
                        <div className="font-medium">{new Date(wo.deadlineDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Lieu de Production</label>
                        <div className="font-medium">{wo.productionSite?.name || 'Non défini'}</div>
                    </div>
                    {wo.clientPO && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                PO Client
                                <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            </label>
                            <button onClick={handleViewPO} className="text-blue-600 hover:underline font-medium">
                                {wo.clientPO}
                            </button>
                        </div>
                    )}

                    {/* Dynamic Contacts */}
                    {wo.additionalContacts && wo.additionalContacts.map((ac) => (
                        <div key={ac.id}>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                {ac.role.name}
                            </label>
                            <div className="font-medium text-gray-900">{ac.contact.firstName} {ac.contact.lastName}</div>
                            <div className="text-xs text-gray-500">{ac.contact.mobilePhone || ac.contact.email}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PRODUCTION LINES */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Lignes de Production</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qté Totale</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Reste</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50">Ajouter à Palette</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {wo.quote.items.map((item: any) => {
                                const produced = getProducedQty(item.id);
                                const remaining = item.quantity - produced;
                                const isComplete = remaining <= 0;

                                return (
                                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isComplete ? 'bg-green-50' : ''}`} onClick={() => setSelectedItem({ item, wo })}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.refReference || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold">{item.tag || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">{item.product || item.description}</div>
                                            <div className="text-xs text-gray-400">{item.material} - {item.finish}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-bold">{item.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-bold">{produced}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold">
                                            <span className={remaining > 0 ? 'text-red-500' : 'text-gray-400'}>{remaining > 0 ? remaining : '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center bg-blue-50" onClick={(e) => e.stopPropagation()}>
                                            {!isComplete && (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    className="w-20 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center text-sm"
                                                    placeholder="0"
                                                    value={palletInputs[item.id] || ''}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setPalletInputs(prev => ({ ...prev, [item.id]: isNaN(val) ? 0 : val }));
                                                    }}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={handleCreatePallet}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Créer une nouvelle palette
                    </button>
                </div>
            </div>

            {/* CREATED PALLETS LIST */}
            {wo.pallets.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-6 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">Palettes Créées ({wo.pallets.length})</h3>
                        <div className="flex flex-col">
                            <span className="text-red-600 font-bold text-lg">
                                Poids total : {totalSelectedWeight.toLocaleString('fr-CA', { maximumFractionDigits: 0 })} lbs
                            </span>
                            <span className="text-xs text-gray-400 italic">
                                Cocher ou décocher les palettes pour avoir le total de leur poids
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {wo.pallets.map((pallet: any, i: number) => {
                            const totalWeight = getPalletWeight(pallet);
                            const isSelected = selectedPalletIds.includes(pallet.id);
                            const displayStatus = pallet.status === 'Open' ? 'Ouvert' : pallet.status;
                            const statusColor = getStatusColor(displayStatus);
                            const nextAction = getNextStatusLabel(displayStatus);

                            return (
                                <div key={pallet.id} className={`bg-white rounded-lg shadow border transition-all duration-200 p-4 ${isSelected ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200 opacity-80'}`}>
                                    <div className="flex justify-between items-start mb-2 border-b pb-2">
                                        <div className="flex items-center gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-blue-800 text-lg">{getPalletId(i, pallet.createdAt)}</span>
                                                    {/* NEXT STATUS BUTTON */}
                                                    {nextAction && (
                                                        <button
                                                            onClick={() => setStatusChangePallet(pallet)}
                                                            className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm"
                                                            title={`Passer au statut : ${nextAction === 'Fermer' ? 'Fermé' : 'Validé'}`}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">{new Date(pallet.createdAt).toLocaleString()}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    <span className="mr-2">BT: <strong>{wo.reference}</strong></span>
                                                    <span>PO: <strong>{wo.clientPO || '-'}</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            {/* Status Badge - Click to Edit Content */}
                                            <button
                                                onClick={() => setEditingPallet(pallet)}
                                                className={`text-xs px-2 py-1 rounded-full font-bold cursor-pointer hover:opacity-80 transition-opacity ${statusColor}`}
                                            >
                                                {displayStatus}
                                            </button>
                                            <div className="mt-2 font-bold text-sm text-gray-700">
                                                {totalWeight.toLocaleString('fr-CA', { maximumFractionDigits: 0 })} lbs
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handlePrintPallet(pallet)}
                                            disabled={printingPalletId === pallet.id}
                                            className={`${printingPalletId === pallet.id
                                                ? 'text-red-600 animate-pulse cursor-wait'
                                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                                } ml-2 p-1 rounded transition-colors`}
                                            title="Imprimer l'étiquette palette"
                                        >
                                            🖨️
                                        </button>
                                    </div>
                                    <ul className="text-sm space-y-2 mt-2 mb-8">
                                        {pallet.items.map((pi: any, idx: number) => {
                                            const details = wo.quote.items.find((q: any) => q.id === pi.quoteItemId);
                                            const lineWeight = details ? calculateItemWeight(details, pi.quantity) : 0;

                                            return (
                                                <li key={idx} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-gray-900">{details?.tag || 'No Tag'}</span>
                                                                {details?.refReference && (
                                                                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                                                        {details.refReference}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 italic mt-0.5">
                                                                {details?.material || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-lg leading-none">x {pi.quantity}</div>
                                                            <div className="text-xs text-blue-700 font-medium mt-1">
                                                                {lineWeight.toLocaleString('fr-CA', { maximumFractionDigits: 0 })} lbs
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => togglePalletSelection(pallet.id)}
                                            className={`
                                                flex items-center justify-center p-2 rounded-full transition-colors
                                                ${isSelected
                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}
                                            `}
                                            title={isSelected ? "Désélectionner" : "Sélectionner"}
                                        >
                                            {isSelected ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div >
            )
            }

            {/* Item Detail Modal */}
            <ProductionItemModal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                // Passing the whole item object + context
                item={selectedItem?.item || null}
                project={wo.quote.project}
                client={wo.quote.client}
                producedQty={selectedItem ? getProducedQty(selectedItem.item.id) : 0}
                workOrderId={wo.id}
                clientPO={wo.clientPO}
            />

            {/* Pallet Edit Modal (Content) */}
            <PalletEditModal
                isOpen={!!editingPallet}
                onClose={() => setEditingPallet(null)}
                pallet={editingPallet}
                workOrderId={wo.id}
                workOrderReference={wo.reference}
                quoteItems={wo.quote.items}
                producedMap={getProducedMap()}
                onSave={fetchWorkOrder}
            />

            {/* Status Change Confirmation Modal */}
            {
                statusChangePallet && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setStatusChangePallet(null)}></div>
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative z-[70]">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Changer le statut ?</h3>
                            <p className="text-gray-600 mb-6">
                                Voulez-vous passer la palette <span className="font-bold">{getPalletId(wo.pallets.findIndex(p => p.id === statusChangePallet.id), statusChangePallet.createdAt)}</span> au statut <span className="font-bold text-blue-600">{statusChangePallet.status === 'Open' || statusChangePallet.status === 'Ouvert' ? 'Fermé' : 'Validé'}</span> ?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setStatusChangePallet(null)}
                                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleConfirmStatusChange}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
