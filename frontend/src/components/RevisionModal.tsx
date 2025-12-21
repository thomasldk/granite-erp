import React, { useState, useEffect } from 'react';
import { PaymentConditionsWidget } from './PaymentConditionsWidget';
import { PaymentTerm } from '../services/paymentTermService';

// Define Minimal Interfaces based on what we need (or import if available)
interface Quote {
    material?: { id: string; name: string };
    incotermRef?: { id: string; name: string; requiresText: boolean };
    paymentTerm?: { id: string; code: number; label_fr: string };
    incoterm?: string; // Legacy string fallback

    // Values
    materialId?: string;
    incotermId?: string;
    // ...
    incotermCustomText?: string;
    paymentTermId?: string;
    paymentDays?: number;
    depositPercentage?: number;
    discountPercentage?: number;
    discountDays?: number;
    paymentCustomText?: string;
    loadingPlace?: string; // If we add it later
    // Commercial V8
    salesCurrency?: string;
    validityDuration?: number;
    exchangeRate?: number;
    estimatedWeeks?: number;
    palletRequired?: boolean;
    semiStandardRate?: number;
}

interface RevisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newValues: any) => void;
    originalQuote: Quote;
    materials: any[];
    incoterms: any[];
    paymentTerms: PaymentTerm[];
    currencies: any[];
    isSubmitting?: boolean; // New Prop
}

export const RevisionModal: React.FC<RevisionModalProps> = ({
    isOpen, onClose, onConfirm, originalQuote, materials, incoterms, paymentTerms, currencies, isSubmitting
}) => {
    // State for New Values
    const [newValues, setNewValues] = useState<any>({});

    // Initialize state when modal opens
    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen && originalQuote) {
            // Only set initial values if not already set or we want to force reset on open.
            // CAUTION: originalQuote might update from polling in background.
            // We should only initialize ONCE when opening.
            setNewValues(() => { // Removed 'prev' as it's not used and causes lint warning
                // Heuristic: if we already have values, don't overwrite them just because originalQuote ref changed
                // But we DO want to set them on first open.
                // Better approach: Depend only on isOpen change?
                // Or check if modal was previously closed.
                return {
                    materialId: originalQuote.materialId || '',
                    incotermId: originalQuote.incotermId || '',
                    incotermCustomText: originalQuote.incotermCustomText || '',

                    paymentTermId: originalQuote.paymentTermId || '',
                    paymentDays: originalQuote.paymentDays ?? '',
                    depositPercentage: originalQuote.depositPercentage ?? '',
                    discountPercentage: originalQuote.discountPercentage ?? '',
                    discountDays: originalQuote.discountDays ?? '',
                    paymentCustomText: originalQuote.paymentCustomText || '',

                    // Commercial Defaults
                    salesCurrency: originalQuote.salesCurrency || 'CAD',
                    validityDuration: originalQuote.validityDuration || 30,
                    exchangeRate: originalQuote.exchangeRate ?? '',
                    estimatedWeeks: originalQuote.estimatedWeeks ?? '',
                    palletRequired: originalQuote.palletRequired || false
                };
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // REMOVED originalQuote from dependency to prevent overwrite during polling

    if (!isOpen) return null;

    // Derived state for Material Logic
    const [selectedMatName, setSelectedMatName] = useState<string>('');

    // Update selectedMatName when materialId changes (e.g. initial load)
    useEffect(() => {
        if (newValues.materialId && materials.length > 0) {
            const currentMat = materials.find((m: any) => m.id === newValues.materialId);
            if (currentMat) {
                setSelectedMatName(currentMat.name);
            }
        }
    }, [newValues.materialId, materials]);

    // Group Materials by Name
    const uniqueMaterialNames = Array.from(new Set((materials || []).map((m: any) => m?.name || 'Unknown'))).sort();

    // Get Variants for selected Name
    const availableVariants = (materials || [])
        .filter((m: any) => m?.name === selectedMatName)
        .sort((a: any, b: any) => (a?.quality || '').localeCompare(b?.quality || ''));

    const handleMaterialNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newName = e.target.value;
        setSelectedMatName(newName);

        // Auto-select first variant's ID when name changes
        const variants = materials.filter((m: any) => m.name === newName);
        if (variants.length > 0) {
            const defaultVariant = variants[0];
            setNewValues((prev: any) => ({
                ...prev,
                materialId: defaultVariant.id,
                quality: defaultVariant.quality,
                unitPrice: defaultVariant.sellingPrice
            }));
        } else {
            setNewValues((prev: any) => ({ ...prev, materialId: '' }));
        }
    };

    const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const variantId = e.target.value;
        const variant = materials.find((m: any) => m.id === variantId);

        if (variant) {
            setNewValues((prev: any) => ({
                ...prev,
                materialId: variant.id,
                quality: variant.quality,
                unitPrice: variant.sellingPrice
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewValues((prev: any) => {
            const updates = { ...prev, [name]: value };

            // Auto-fill defaults if Material changes
            if (name === 'materialId' && value) {
                const mat = materials.find(m => m.id === value);
                if (mat) {
                    // Pre-fill Quality and Price from Material
                    updates.quality = mat.quality || '';
                    updates.unitPrice = mat.sellingPrice || '';
                }
            }
            return updates;
        });
    };

    const handleConfirm = () => {
        onConfirm(newValues);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-10 pb-10">
            <div className="relative mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
                {/* Close Button (Absolute Top-Right) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 focus:outline-none transition-colors p-1 rounded-full hover:bg-gray-100 z-10"
                    title="Fermer"
                    disabled={!!isSubmitting}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mt-3">
                    <div className="mb-4 border-b pb-2">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 pr-8">
                            Créer une Révision
                        </h3>
                    </div>

                    {/* NEW LAYOUT: Full Width with Sections */}
                    <div className="space-y-2">

                        {/* SECTION 1: MATIÈRE & INCOTERM (Comparatif Ligne par Ligne) */}
                        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <h4 className="text-xs uppercase font-bold text-gray-500 mb-3 border-b pb-1">Identification & Incoterm</h4>
                            <div className="grid grid-cols-12 gap-4">
                                {/* SECTION 1: IDENTIFICATION (col-span-7) */}
                                <div className="col-span-7">
                                    <label className="block text-xs text-gray-400 mb-1">Matière</label>
                                    <div className="flex items-center gap-2">
                                        {/* OLD VALUE (Shrunk to give space) */}
                                        <div className="w-5/12 h-9 flex items-center px-2 bg-white border border-gray-300 rounded text-gray-700 text-sm opacity-80 truncate" title="Actuel">
                                            {originalQuote.material?.name || '-'}
                                        </div>
                                        <span className="text-gray-400">➔</span>
                                        {/* NEW VALUES */}
                                        {/* Material Name Select (Widened) */}
                                        <select
                                            className="w-32 h-9 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm text-ellipsis overflow-hidden"
                                            value={selectedMatName}
                                            onChange={handleMaterialNameChange}
                                            disabled={!!isSubmitting}
                                        >
                                            <option value="">-- Matière --</option>
                                            {(uniqueMaterialNames || []).map((name: string) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>

                                        {/* Variant Select (Compact) */}
                                        <select
                                            className="w-16 h-9 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-1"
                                            value={newValues.materialId || ''}
                                            onChange={handleVariantChange}
                                            disabled={!selectedMatName || !!isSubmitting}
                                        >
                                            <option value="">-</option>
                                            {(availableVariants || []).map((v: any) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.quality}
                                                </option>
                                            ))}
                                        </select>
                                        {/* Price Input (Widened) */}
                                        <div className="relative w-28 h-9">
                                            <input
                                                type="number"
                                                name="unitPrice"
                                                placeholder="Prix"
                                                step="0.01"
                                                className="w-full h-9 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm pr-5"
                                                value={newValues.unitPrice || ''}
                                                onChange={handleChange}
                                                disabled={!!isSubmitting}
                                            />
                                            <span className="absolute right-1 top-2 text-gray-500 text-sm">$</span>
                                        </div>
                                        {/* Purchase Price Display */}
                                        {newValues.materialId && (
                                            <div className="flex items-center text-xs text-gray-500 italic">
                                                (Achat: {materials.find(m => m.id === newValues.materialId)?.purchasePrice || 0} $)
                                            </div>
                                        )}
                                    </div>
                                </div>


                                {/* SECTION 1B: INCOTERM (col-span-5) */}
                                <div className="col-span-5">
                                    <label className="block text-xs text-gray-400 mb-1">Incoterm</label>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1/3 h-9 flex items-center px-2 bg-white border border-gray-300 rounded text-gray-700 text-sm opacity-80 truncate" title="Actuel">
                                            {originalQuote.incotermRef?.name || originalQuote.incoterm || '-'}
                                        </div>
                                        <span className="text-gray-400">➔</span>
                                        <div className="flex-1 flex gap-1">
                                            <select
                                                className="w-1/2 h-9 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                                name="incotermId"
                                                value={newValues.incotermId || ''}
                                                onChange={handleChange}
                                                disabled={!!isSubmitting}
                                            >
                                                <option value="">-- Choix --</option>
                                                {(incoterms || []).map((i: any) => (
                                                    <option key={i.id} value={i.id}>{i.name} ({i.xmlCode})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                name="incotermCustomText"
                                                placeholder="Lieu (Saisir)"
                                                className="w-1/2 h-9 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                                                value={newValues.incotermCustomText || ''}
                                                onChange={handleChange}
                                                disabled={!!isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: PARAMÈTRES COMMERCIAUX (Grid 4 cols) */}
                        <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
                            <h4 className="text-xs uppercase font-bold text-blue-800 mb-3 border-b border-blue-200 pb-1">Paramètres Commerciaux</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Devise</label>
                                    <select
                                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                        name="salesCurrency"
                                        value={newValues.salesCurrency || 'CAD'}
                                        onChange={handleChange}
                                        disabled={!!isSubmitting}
                                    >
                                        {(currencies || []).map((c: any) => (
                                            <option key={c.id} value={c.code}>{c.code}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Taux Change</label>
                                    <input
                                        type="number" step="0.01"
                                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                        name="exchangeRate"
                                        value={newValues.exchangeRate || ''}
                                        onChange={handleChange}
                                        disabled={!!isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Validité (Jours)</label>
                                    <input
                                        type="number"
                                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                        name="validityDuration"
                                        value={newValues.validityDuration || ''}
                                        onChange={handleChange}
                                        disabled={!!isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Sem. Est.</label>
                                    <input
                                        type="number"
                                        className="w-full text-sm border-gray-300 rounded shadow-sm focus:ring-indigo-500"
                                        name="estimatedWeeks"
                                        value={newValues.estimatedWeeks || ''}
                                        onChange={handleChange}
                                        disabled={!!isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: PAIEMENT (Full Width) */}
                        <div className="border rounded-md p-3 bg-white shadow-sm border-orange-100">
                            <div className="flex items-center gap-4 mb-3">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                                    <span>💳</span> Conditions de Paiement
                                </h3>
                                <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-2">
                                    <span className="font-bold uppercase text-[10px] text-blue-500">Actuel:</span>
                                    <span>{originalQuote.paymentDays || 30} Jours Net</span>
                                    <span className="text-blue-300">|</span>
                                    <span>{originalQuote.depositPercentage || 0}% Acompte</span>
                                </div>
                            </div>

                            <PaymentConditionsWidget
                                data={newValues}
                                onChange={handleChange}
                                paymentTerms={paymentTerms}
                                compact={true}
                                disabled={!!isSubmitting}
                                readOnly={!!isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="items-center px-4 py-3">
                        <button
                            className={`px-4 py-2 text-white text-base font-medium rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            onClick={handleConfirm}
                            disabled={!!isSubmitting}
                        >
                            {isSubmitting ? 'Création...' : 'Confirmer la Révision'}
                        </button>
                        <button
                            className="mt-3 px-4 py-2 bg-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            onClick={onClose}
                            disabled={!!isSubmitting}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};
