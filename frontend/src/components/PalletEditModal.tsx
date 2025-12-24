import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

interface PalletEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    pallet: any | null; // The pallet object being edited
    workOrderId: string;
    workOrderReference: string;
    quoteItems: any[]; // List of all WO items to display
    producedMap: Record<string, number>; // Map { quoteItemId: totalProduced } (Includes CURRENT pallet)
    onSave: () => void;
}

export default function PalletEditModal({
    isOpen,
    onClose,
    pallet,
    workOrderId,
    workOrderReference,
    quoteItems,
    producedMap,
    onSave
}: PalletEditModalProps) {
    const [status, setStatus] = useState('Open');
    // Map { quoteItemId: quantity } for the pallet
    const [palletInputs, setPalletInputs] = useState<Record<string, number>>({});
    const [initialPalletInputs, setInitialPalletInputs] = useState<Record<string, number>>({});

    // Manual Status Change State
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [targetStatus, setTargetStatus] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen && pallet) {
            setStatus(pallet.status === 'Open' ? 'Ouvert' : pallet.status); // Handle legacy 'Open'

            // Build current composition map
            const currentMap: Record<string, number> = {};
            pallet.items.forEach((pi: any) => {
                currentMap[pi.quoteItemId] = pi.quantity;
            });
            setPalletInputs(currentMap);
            setInitialPalletInputs(currentMap); // Keep track of original values
        }
    }, [isOpen, pallet]);

    const handleSave = async () => {
        try {
            // Prepare items array
            const itemsToSave = Object.entries(palletInputs)
                .filter(([_, qty]) => qty > 0)
                .map(([quoteItemId, quantity]) => ({ quoteItemId, quantity }));

            // Allow empty items if user wants to clear pallet? Sure.

            await api.patch(`/work-orders/${workOrderId}/pallets/${pallet.id}`, {
                status: status === 'Ouvert' ? 'Open' : status, // Map back to Open if needed, or keep unified
                items: itemsToSave
            });

            onSave();
            onClose();
        } catch (error) {
            console.error("Failed to update pallet", error);
            alert("Erreur lors de la mise à jour de la palette");
        }
    };

    const handleManualStatusChange = () => {
        if (password !== '1234') {
            alert("Mot de passe incorrect.");
            return;
        }
        setStatus(targetStatus);
        setShowStatusModal(false);
        setPassword('');
    };

    if (!isOpen || !pallet) return null;

    // Helper: Pallet ID display
    const getPalletTitle = () => {
        const date = new Date(pallet.createdAt);
        const year = date.getFullYear().toString().slice(-2);
        const num = (pallet.number).toString().padStart(2, '0');
        const parts = workOrderReference.split('-');
        const btSuffix = parts.length > 1 ? parts[parts.length - 1] : workOrderReference;
        return `P#${num}-${year}-${btSuffix}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Modifier {getPalletTitle()}</h2>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Statut actuel:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${status === 'Ouvert' ? 'bg-green-100 text-green-800 border-green-200' :
                                status === 'Fermé' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                                    'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                {status}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setTargetStatus(status);
                                    setShowStatusModal(true);
                                }}
                                className="ml-2 text-xs bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-2 py-1 rounded shadow-sm font-semibold transition-colors"
                            >
                                Modifier
                            </button>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Content - Scrollable Table */}
                <div className="flex-1 overflow-y-auto p-4">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2 text-left w-16 text-gray-600 font-semibold">Ligne</th>
                                <th className="px-3 py-2 text-left w-32 text-gray-600 font-semibold">Ref</th>
                                <th className="px-3 py-2 text-left w-32 text-gray-600 font-semibold">Tag</th>
                                <th className="px-3 py-2 text-left text-gray-600 font-semibold">Item</th>
                                <th className="px-3 py-2 text-center w-24 text-gray-600 font-semibold">Total Req</th>
                                <th className="px-3 py-2 text-center w-32 bg-gray-50 border-x border-gray-200 text-gray-600 font-semibold">Déjà saisi</th>
                                <th className="px-3 py-2 text-center w-32 bg-blue-50 text-blue-800 font-semibold">Nouvelle Valeur</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quoteItems.map((item) => {
                                // Logic:
                                // "Déjà saisi" (Gray) = The quantity currently ON THIS PALLET (before edits).
                                //      If user changes it, they change "Nouvelle Valeur".
                                //      This mimics the behavior: "Here is what you had (Gray), enter what you want (Input)".
                                //      Wait, usually "Already entered" implies read-only existing. But here we are EDITING.
                                //      Maybe "Already entered" means "Quantity on OTHER pallets"?
                                //      User request: "une colone avec la quantité deja saisi en grise et une colonne ou on peut mettre une nouvelle valeur"
                                //      "Quantité deja saisi" usually means what is CURRENTLY SAVED for this pallet.

                                const currentPalletQty = initialPalletInputs[item.id] || 0;
                                const totalProducedIncludingThis = producedMap[item.id] || 0;
                                const otherPalletsQty = totalProducedIncludingThis - currentPalletQty;
                                const remainingGlobal = item.quantity - otherPalletsQty; // Max valid value for this pallet

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-500">{item.lineNo}</td>
                                        <td className="px-3 py-2 font-medium">{item.refReference || '-'}</td>
                                        <td className="px-3 py-2 font-bold">{item.tag || '-'}</td>
                                        <td className="px-3 py-2">
                                            <div className="font-medium text-gray-900">{item.product || item.description}</div>
                                            <div className="text-xs text-gray-500">{item.material} - {item.finish}</div>
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold">{item.quantity}</td>

                                        {/* Gray Column: Current Saved Value */}
                                        <td className="px-3 py-2 text-center bg-gray-50 border-x border-gray-200 text-gray-500 font-bold">
                                            {currentPalletQty > 0 ? currentPalletQty : '-'}
                                        </td>

                                        {/* Input Column: New Value */}
                                        <td className="px-3 py-2 text-center bg-blue-50">
                                            <input
                                                type="number"
                                                min="0"
                                                max={remainingGlobal} // Cannot exceed total required minus what's on other pallets
                                                className={`w-20 border-gray-300 rounded text-center text-sm focus:ring-blue-500 focus:border-blue-500 p-1 ${status === 'Fermé' || status === 'Validé' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                                                value={palletInputs[item.id] ?? ''} // Empty string if undefined to show placeholder? Or 0?
                                                placeholder={currentPalletQty > 0 ? currentPalletQty.toString() : '0'}
                                                onChange={(e) => {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    if (!isNaN(val)) {
                                                        const cleanVal = Math.min(val, remainingGlobal); // Clamp
                                                        setPalletInputs(prev => ({ ...prev, [item.id]: cleanVal }));
                                                    }
                                                }}
                                                disabled={status === 'Fermé' || status === 'Validé'}
                                            />
                                            {/* Show diff if changed? Optional */}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center p-4 border-t border-gray-200 gap-3 bg-gray-50 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold shadow-sm"
                    >
                        Valider
                    </button>
                </div>

            </div>

            {/* Status Change Sub-Modal */}
            {
                showStatusModal && (
                    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-20 backdrop-blur-sm rounded-lg">
                        <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-300 w-80">
                            <h4 className="font-bold text-gray-900 mb-4">Changer le statut</h4>

                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nouveau Statut</label>
                                <select
                                    className="w-full border rounded p-2 text-sm"
                                    value={targetStatus}
                                    onChange={e => setTargetStatus(e.target.value)}
                                >
                                    <option value="Ouvert">Ouvert</option>
                                    <option value="Fermé">Fermé</option>
                                    <option value="Validé">Validé</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de Passe Admin</label>
                                <input
                                    type="password"
                                    className="w-full border rounded p-2 text-sm"
                                    placeholder="Code..."
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowStatusModal(false); setPassword(''); }}
                                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleManualStatusChange}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                                >
                                    Appliquer
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
