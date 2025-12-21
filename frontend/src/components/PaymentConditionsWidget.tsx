import React from 'react';
import { PaymentTerm, generatePaymentTermLabel } from '../services/paymentTermService';

interface PaymentConditionsProps {
    data: {
        paymentTermId: string;
        paymentDays?: number | string;
        depositPercentage?: number | string;
        discountPercentage?: number | string;
        discountDays?: number | string;
        paymentCustomText?: string;
        language?: string; // For label generation
    };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    paymentTerms: PaymentTerm[];
    readOnly?: boolean;
    compact?: boolean;
    disabled?: boolean; // Added disabled prop
}

export const PaymentConditionsWidget: React.FC<PaymentConditionsProps> = ({ data, onChange, paymentTerms, readOnly = false, compact = false }) => {

    // Preview Generation Logic
    const renderPreview = () => {
        const term = paymentTerms.find(t => t.id === data.paymentTermId);
        if (!term) return '...';

        const days = data.paymentDays ? Number(data.paymentDays) : 0;
        const deposit = data.depositPercentage ? Number(data.depositPercentage) : 0;
        const discount = data.discountPercentage ? Number(data.discountPercentage) : 0;
        const dDays = data.discountDays ? Number(data.discountDays) : 0;

        let label = generatePaymentTermLabel(term.code, days, deposit, data.language || 'fr', discount, dDays);

        if (discount > 0 && !label.includes('%')) {
            label += ` (avec ${discount}% d'escompte si payé sous ${dDays} jours)`;
        }
        return label;
    };

    return (
        <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${compact ? 'p-2' : 'p-4'}`}>
            {!compact && (
                <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center">
                    💳 Conditions de Paiement
                </h3>
            )}

            <div className={`flex flex-col md:flex-row gap-4 ${compact ? 'mb-2' : 'mb-6'}`}>
                {/* Selector */}
                <div className="w-full md:w-1/2">
                    <label className="block text-slate-700 text-xs font-bold mb-2">
                        Modèle (Base)
                    </label>
                    <select
                        className="w-full shadow-sm border-slate-300 rounded py-2 px-3 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500"
                        name="paymentTermId"
                        value={data.paymentTermId || ''}
                        onChange={onChange}
                        disabled={readOnly}
                    >
                        <option value="">-- Sélectionner --</option>
                        {paymentTerms.map(term => (
                            <option key={term.id} value={term.id}>
                                {term.code} - {term.label_fr}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Preview Box */}
                <div className="w-full md:w-1/2">
                    {data.paymentTermId ? (
                        <div className="h-full p-3 bg-blue-50 text-blue-900 text-sm rounded border border-blue-100 flex items-start gap-2">
                            <span className="text-lg">👁️</span>
                            <div>
                                <p className="font-bold text-[10px] uppercase tracking-wider mb-1 text-blue-600">Aperçu du libellé</p>
                                <p className="text-sm font-medium whitespace-pre-wrap leading-tight">
                                    {renderPreview()}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs border border-dashed border-slate-300 rounded bg-slate-50 p-2">
                            Sélectionnez un terme
                        </div>
                    )}
                </div>
            </div>

            {/* Overrides Grid - Compact: 4 cols, Normal: 2x2 */}
            <div className={`grid ${compact ? 'grid-cols-4 gap-2 mb-2' : 'grid-cols-2 gap-4 mb-4'}`}>
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Délai</label>
                    <input
                        className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                        name="paymentDays"
                        type="number"
                        value={data.paymentDays ?? ''}
                        onChange={onChange}
                        disabled={readOnly}
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Acompte</label>
                    <input
                        className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                        name="depositPercentage"
                        type="number"
                        step="0.01"
                        value={data.depositPercentage ?? ''}
                        onChange={onChange}
                        disabled={readOnly}
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Escompte</label>
                    <input
                        className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                        name="discountPercentage"
                        type="number"
                        step="0.01"
                        value={data.discountPercentage ?? ''}
                        onChange={onChange}
                        disabled={readOnly}
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Jours Esc.</label>
                    <input
                        className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                        name="discountDays"
                        type="number"
                        value={data.discountDays ?? ''}
                        onChange={onChange}
                        disabled={readOnly}
                    />
                </div>
            </div>

            {/* Custom Text */}
            <div>
                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Texte Personnalisé</label>
                <textarea
                    className="w-full shadow-sm border-slate-300 rounded py-2 px-3 text-sm text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    name="paymentCustomText"
                    rows={compact ? 1 : 2}
                    placeholder="Si requis..."
                    value={data.paymentCustomText || ''}
                    onChange={onChange}
                    disabled={readOnly}
                />
            </div>
        </div>
    );
};
