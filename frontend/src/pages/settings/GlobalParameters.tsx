import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface SystemConfigData {
    defaultSemiStandardRate: number;
    defaultSalesCurrency: string;
    defaultPalletPrice: number;
    defaultPalletRequired: boolean;
    // V8
    defaultExchangeRate?: number;
    defaultPaymentDays?: number;
    defaultDepositPercentage?: number;
    defaultDiscountPercentage?: number;
    defaultDiscountDays?: number;
    defaultPaymentTermId?: string; // V8
    // V8 Tax Rates
    taxRateTPS?: number;
    taxRateTVQ?: number;
    taxRateTVH?: number;
    taxRateTVH_Maritimes?: number;
    defaultMeasureUnit?: string;
    defaultValidityDuration?: number;
    defaultBrokerFee?: number; // New
}

const GlobalParameters: React.FC = () => {
    const [config, setConfig] = useState<SystemConfigData>({
        defaultSemiStandardRate: 0.4,
        defaultSalesCurrency: 'CAD',
        defaultPalletPrice: 50.0,
        defaultPalletRequired: false,
        // V8 Defaults
        defaultExchangeRate: 1.0,
        defaultPaymentDays: 30,
        defaultDepositPercentage: 0,
        defaultDiscountPercentage: 0,
        defaultDiscountDays: 10,
        defaultPaymentTermId: '',
        // Taxes
        taxRateTPS: 5.0,
        taxRateTVQ: 9.975,
        taxRateTVH: 13.0,
        taxRateTVH_Maritimes: 15.0,
        defaultMeasureUnit: 'an',
        defaultValidityDuration: 30,
        defaultBrokerFee: 0
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [paymentTerms, setPaymentTerms] = useState<any[]>([]); // V8
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
        fetchPaymentTerms();
    }, []);

    const fetchPaymentTerms = async () => {
        try {
            const res = await api.get('/payment-terms');
            setPaymentTerms(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchConfig = async () => {
        try {
            const response = await api.get('/system-config');
            setConfig(response.data);
        } catch (error) {
            console.error('Error fetching system config:', error);
            setMessage('Erreur chargement configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setConfig(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await api.put('/system-config', config);
            setMessage('Configuration sauvegardée avec succès !');
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-slate-800">Paramètres Généraux Client</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-lg border ${message.includes('succès') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* CARD 1: Paramètres de Base */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">⚙️</span> Configuration de Base
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Taux Semi Standard */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Taux Semi-Standard (Défaut)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultSemiStandardRate"
                                    value={config.defaultSemiStandardRate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-slate-400 text-sm">ex: 0.4</span>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Surchargeable par client.</p>
                        </div>

                        {/* Devise de Vente */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Devise de Vente (Défaut)
                            </label>
                            <select
                                name="defaultSalesCurrency"
                                value={config.defaultSalesCurrency}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="CAD">CAD ($)</option>
                                <option value="USD">USD ($US)</option>
                            </select>
                        </div>

                        {/* Taux de Change */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Taux de Change (Défaut)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 font-bold">x</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.0001"
                                    name="defaultExchangeRate"
                                    value={config.defaultExchangeRate}
                                    onChange={handleChange}
                                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Unité de Mesure */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Unité de mesure (Défaut)
                            </label>
                            <select
                                name="defaultMeasureUnit"
                                value={config.defaultMeasureUnit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                            >
                                <option value="an">Impérial (pieds/pouces)</option>
                                <option value="m">Métrique (mètres/mm)</option>
                            </select>
                        </div>

                        {/* Durée Validité */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Validité Soumission (Jours)
                            </label>
                            <input
                                type="number"
                                name="defaultValidityDuration"
                                value={config.defaultValidityDuration}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                            <p className="text-xs text-slate-500 mt-1">Défaut: 30 jours</p>
                        </div>

                        {/* Frais Courtage */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Frais de courtage par défaut (Non-Canadien)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500">$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultBrokerFee"
                                    value={config.defaultBrokerFee || 0}
                                    onChange={handleChange}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 2: Palettes */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">📦</span> Configuration Palettes
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        {/* Prix Palette */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Prix Palette (Défaut)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500">$</span>
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultPalletPrice"
                                    value={config.defaultPalletPrice}
                                    onChange={handleChange}
                                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Palette Requise */}
                        <div className="flex items-center h-10 pb-1">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="defaultPalletRequired"
                                    checked={config.defaultPalletRequired}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-sm font-medium text-slate-700">Palette requise par défaut</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* CARD 3: Paiements */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">💳</span> Termes de Paiement (V8)
                    </h2>

                    {/* Default Term Selector */}
                    <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Terme de Paiement Principal (Défaut Système)
                        </label>
                        <select
                            name="defaultPaymentTermId"
                            value={config.defaultPaymentTermId || ''}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="">-- Sélectionner un terme par défaut --</option>
                            {paymentTerms.map(t => (
                                <option key={t.id} value={t.id}>{t.code} - {t.label_fr}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-2">Ce terme sera pré-sélectionné pour tous les nouveaux clients.</p>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Valeurs Manuelles (Fallback)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jours Net</label>
                                <input
                                    type="number"
                                    name="defaultPaymentDays"
                                    value={config.defaultPaymentDays}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Acompte %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultDepositPercentage"
                                    value={config.defaultDepositPercentage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Escompte %</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultDiscountPercentage"
                                    value={config.defaultDiscountPercentage}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jours Escompte</label>
                                <input
                                    type="number"
                                    name="defaultDiscountDays"
                                    value={config.defaultDiscountDays}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 4: Configuration Taxes (Canada) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-2xl">🏛️</span> Configuration Taxes (Canada)
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">TPS (Fédéral)</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.001" name="taxRateTPS"
                                    value={config.taxRateTPS} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-2 text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">TVQ (Québec)</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.001" name="taxRateTVQ"
                                    value={config.taxRateTVQ} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-2 text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">TVH (Ontario)</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.001" name="taxRateTVH"
                                    value={config.taxRateTVH} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-2 text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">TVH (Maritimes)</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.001" name="taxRateTVH_Maritimes"
                                    value={config.taxRateTVH_Maritimes} onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-blue-500"
                                />
                                <span className="absolute right-3 top-2 text-slate-400">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                    >
                        {saving ? 'Sauvegarde en cours...' : 'Enregistrer les Paramètres'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default GlobalParameters;
