import React, { useState, useEffect } from 'react';
import { createThirdParty, getThirdPartyById, updateThirdParty, getLanguages, getCurrencies } from '../../services/thirdPartyService';
import { getRepresentatives, Representative } from '../../services/representativeService';
import { getPaymentTerms, PaymentTerm, generatePaymentTermLabel } from '../../services/paymentTermService';
import { formatPhoneNumber } from '../../utils/formatters';
import { useNavigate, useParams } from 'react-router-dom';

interface ClientFormProps {
    defaultType?: 'Client' | 'Supplier';
}

const ClientForm: React.FC<ClientFormProps> = ({ defaultType = 'Client' }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Check if in edit mode
    const [reps, setReps] = useState<Representative[]>([]);
    const [languages, setLanguages] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [incoterms, setIncoterms] = useState<any[]>([]); // New
    const [paymentTermsList, setPaymentTermsList] = useState<PaymentTerm[]>([]);
    const [systemDefaults, setSystemDefaults] = useState<any>({}); // New v8
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
        mobile: '',
        fax: '',
        website: '',
        type: defaultType,
        defaultCurrency: 'CAD',
        supplierType: '',
        priceListUrl: '', // Added
        priceListDate: '', // Added
        paymentTerms: '', // Legacy
        paymentTermId: '', // New relation
        paymentDays: '',
        depositPercentage: '',
        taxScheme: 'TPS/TVQ',
        creditLimit: '',
        repName: '',
        language: 'fr',
        unitSystem: 'Imperial',
        incoterm: '',
        incotermId: '', // New
        incotermCustomText: '', // New
        internalNotes: '',
        // Address
        addressLine1: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
        addressCountry: 'Canada',
        // V8 Overrides
        semiStandardRate: '',
        salesCurrency: '',
        palletPrice: '',
        palletRequired: '', // 'true', 'false', or '' (default)
        exchangeRate: '',
        discountPercentage: '',
        discountDays: '',
        paymentCustomText: '',
        validityDuration: ''
    });

    const isClient = formData.type === 'Client';
    const singular = isClient ? 'Client' : 'Fournisseur';
    const basePath = isClient ? '/clients' : '/suppliers';

    useEffect(() => {
        const init = async () => {
            try {
                const [repsData, langsData, currsData, termsData, fetchedIncoterms, sysData] = await Promise.all([
                    getRepresentatives(),
                    getLanguages(),
                    getCurrencies(),
                    getPaymentTerms(),
                    fetch('/api/incoterms').then(r => r.json()).catch(() => []),
                    fetch('/api/system-config').then(r => r.json()).catch(() => ({}))
                ]);
                setReps(repsData);
                setLanguages(langsData);
                setCurrencies(currsData);
                setPaymentTermsList(termsData);
                setIncoterms(fetchedIncoterms); // Fetch Properly
                setSystemDefaults(sysData);

                // V8: Pre-fill defaults only for New Clients
                if (!id && sysData) {
                    setFormData(prev => ({
                        ...prev,
                        semiStandardRate: sysData.defaultSemiStandardRate !== undefined ? String(sysData.defaultSemiStandardRate) : '',
                        salesCurrency: sysData.defaultSalesCurrency || 'CAD',
                        palletPrice: sysData.defaultPalletPrice !== undefined ? String(sysData.defaultPalletPrice) : '',
                        palletRequired: sysData.defaultPalletRequired !== undefined ? String(sysData.defaultPalletRequired) : 'false',
                        exchangeRate: sysData.defaultExchangeRate !== undefined ? String(sysData.defaultExchangeRate) : '',

                        // V8 Payment Defaults
                        paymentTermId: sysData.defaultPaymentTermId || '',
                        paymentDays: sysData.defaultPaymentDays !== undefined ? String(sysData.defaultPaymentDays) : '30',
                        depositPercentage: sysData.defaultDepositPercentage !== undefined ? String(sysData.defaultDepositPercentage) : '0',
                        discountPercentage: sysData.defaultDiscountPercentage !== undefined ? String(sysData.defaultDiscountPercentage) : '0',
                        discountDays: sysData.defaultDiscountDays !== undefined ? String(sysData.defaultDiscountDays) : '10',

                        validityDuration: sysData.defaultValidityDuration !== undefined ? String(sysData.defaultValidityDuration) : '30',

                        // V8 Measure Unit Default
                        unitSystem: (sysData.defaultMeasureUnit === 'm') ? 'Metric' : 'Imperial'
                    }));
                }

                if (id) {
                    setLoading(true);
                    const client = await getThirdPartyById(id);
                    const mainAddr = client.addresses?.find((a: any) => a.type === 'Main') || {};

                    setFormData({
                        name: client.name,
                        code: client.code || '',
                        phone: client.phone || '',
                        mobile: (client as any).mobile || '',
                        fax: client.fax || '',
                        website: client.website || '',
                        type: (client.type as 'Client' | 'Supplier') || 'Client',
                        defaultCurrency: client.defaultCurrency || 'CAD',
                        supplierType: client.supplierType || '',
                        priceListUrl: client.priceListUrl || '',
                        priceListDate: client.priceListDate || '',
                        paymentTerms: client.paymentTerms || '',
                        paymentTermId: client.paymentTermId || '',
                        paymentDays: client.paymentDays !== undefined ? String(client.paymentDays) : '0',
                        depositPercentage: client.depositPercentage !== undefined ? String(client.depositPercentage) : '0',
                        taxScheme: client.taxScheme || 'TPS/TVQ',
                        creditLimit: client.creditLimit ? String(client.creditLimit) : '',
                        repName: client.repName || '',
                        language: client.language || 'fr',
                        unitSystem: (client as any).unitSystem || 'Imperial',
                        incoterm: (client as any).incoterm || '',
                        incotermId: (client as any).incotermId || '',
                        incotermCustomText: (client as any).incotermCustomText || '',
                        internalNotes: client.internalNotes || '',
                        addressLine1: mainAddr.line1 || '',
                        addressCity: mainAddr.city || '',
                        addressState: mainAddr.state || '',
                        addressZip: mainAddr.zipCode || '',
                        addressCountry: mainAddr.country || 'Canada',
                        semiStandardRate: (client as any).semiStandardRate !== null ? String((client as any).semiStandardRate || '') : '',
                        salesCurrency: (client as any).salesCurrency || '',
                        palletPrice: (client as any).palletPrice !== null ? String((client as any).palletPrice || '') : '',
                        palletRequired: (client as any).palletRequired === null ? '' : String((client as any).palletRequired),
                        exchangeRate: (client as any).exchangeRate !== null ? String((client as any).exchangeRate || '') : '',
                        discountPercentage: (client as any).discountPercentage !== undefined ? String((client as any).discountPercentage) : '',
                        discountDays: (client as any).discountDays !== undefined ? String((client as any).discountDays) : '',
                        paymentCustomText: (client as any).paymentCustomText || '',
                        validityDuration: (client as any).validityDuration !== undefined && (client as any).validityDuration !== null ? String((client as any).validityDuration) : ''
                    });
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error initializing form", error);
                setLoading(false);
            }
        };
        init();
    }, [id]);

    // Effect to keep payment terms text in sync with values
    useEffect(() => {
        if (formData.paymentTermId && paymentTermsList.length > 0) {
            const term = paymentTermsList.find(t => t.id === formData.paymentTermId);
            if (term) {
                const days = formData.paymentDays ? parseInt(String(formData.paymentDays)) : 0;
                const deposit = formData.depositPercentage ? parseFloat(String(formData.depositPercentage)) : 0;
                const newLabel = generatePaymentTermLabel(term.code, days, deposit, formData.language);

                // Only update if different to avoid infinite loops (though safe with primitives)
                if (newLabel !== formData.paymentTerms) {
                    setFormData(prev => ({ ...prev, paymentTerms: newLabel }));
                }
            }
        }
    }, [formData.paymentTermId, formData.paymentDays, formData.depositPercentage, formData.language, paymentTermsList]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const response = await fetch('/api/upload', { // Use relative path to use Vite proxy
                method: 'POST',
                body: formDataUpload
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({ ...formData, priceListUrl: data.url });
            } else {
                alert('Erreur lors du téléversement du fichier.');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Erreur réseau lors du téléversement.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'paymentTermId') {
            // User Workflow Fix:
            // When selecting a Payment Term, we typically just set the ID (Code).
            // The user may have ALREADY entered specific days/discounts manually.
            // We should NOT overwrite them with the generic term defaults (which are often 0/empty).
            // We ONLY update the ID.
            setFormData({
                ...formData,
                paymentTermId: value
                // Do NOT overwrite existing values
            });
        } else if (name === 'phone' || name === 'mobile' || name === 'fax') {
            setFormData({ ...formData, [name]: formatPhoneNumber(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                priceListUrl: formData.priceListUrl || undefined, // explicit inclusion
                priceListDate: formData.priceListDate || undefined, // explicit inclusion
                creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
                paymentDays: formData.paymentDays ? parseInt(formData.paymentDays) : 0,
                depositPercentage: formData.depositPercentage ? parseFloat(formData.depositPercentage) : 0,
                // V8 Overrides
                semiStandardRate: formData.semiStandardRate ? parseFloat(formData.semiStandardRate) : null,
                salesCurrency: formData.salesCurrency || null,
                palletPrice: formData.palletPrice ? parseFloat(formData.palletPrice) : null,
                palletRequired: formData.palletRequired === '' ? null : (formData.palletRequired === 'true'),
                exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
                discountPercentage: formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0,
                discountDays: formData.discountDays ? parseInt(formData.discountDays) : 0,
                paymentCustomText: formData.paymentCustomText || null,
                validityDuration: formData.validityDuration ? parseInt(formData.validityDuration) : null
            };

            if (id) {
                await updateThirdParty(id, payload);
                alert(`${singular} mis à jour avec succès`);
            } else {
                await createThirdParty(payload);
                alert(`${singular} créé avec succès`);
            }

            navigate(basePath);
        } catch (error) {
            console.error('Error saving:', error);
            alert(`Erreur lors de la sauvegarde du ${singular.toLowerCase()}`);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {id ? `Modifier le ${singular}` : `Nouveau ${singular}`}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border border-gray-100">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Nom de la Société
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Ex: Construction XYZ"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
                        Code comptable interne (Facultatif)
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        id="code"
                        name="code"
                        type="text"
                        placeholder="Ex: C-XYZ"
                        value={formData.code}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex gap-4 mb-4">
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                            Téléphone
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="mobile">
                            Cellulaire
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            id="mobile"
                            name="mobile"
                            type="tel"
                            value={formData.mobile}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fax">
                            Fax
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            id="fax"
                            name="fax"
                            type="tel"
                            value={formData.fax}
                            onChange={handleChange}
                        />
                    </div>
                </div>


                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="website">
                        Site Web
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                        id="website"
                        name="website"
                        type="text"
                        placeholder="Ex: www.example.com"
                        value={formData.website}
                        onChange={handleChange}
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Adresse Principale</label>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="addressLine1"
                            type="text"
                            placeholder="Adresse (Rue, Numéro)"
                            value={formData.addressLine1}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="addressCity"
                            type="text"
                            placeholder="Ville"
                            value={formData.addressCity}
                            onChange={handleChange}
                        />
                        {formData.addressCountry === 'Canada' || formData.addressCountry === 'États-Unis' ? (
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                name="addressState"
                                value={formData.addressState}
                                onChange={(e) => {
                                    handleChange(e);
                                    // Auto-detect Tax Scheme based on Province
                                    if (formData.addressCountry === 'Canada') {
                                        const prov = e.target.value;
                                        let scheme = 'TPS/TVQ'; // Fallback
                                        if (prov === 'QC') scheme = 'TPS/TVQ';
                                        else if (['ON', 'NB', 'NS', 'NL', 'PE'].includes(prov)) scheme = 'TVH';
                                        else scheme = 'TPS'; // AB, BC, MB, SK, Territories

                                        // Use specific setter to ensure update
                                        setFormData(prev => ({ ...prev, taxScheme: scheme }));
                                    }
                                }}
                            >
                                <option value="">-- Province / État --</option>
                                {formData.addressCountry === 'Canada' ? (
                                    <>
                                        <option value="QC">Québec</option>
                                        <option value="ON">Ontario</option>
                                        <option value="BC">Colombie-Britannique</option>
                                        <option value="AB">Alberta</option>
                                        <option value="MB">Manitoba</option>
                                        <option value="NB">Nouveau-Brunswick</option>
                                        <option value="NL">Terre-Neuve-et-Labrador</option>
                                        <option value="NS">Nouvelle-Écosse</option>
                                        <option value="PE">Île-du-Prince-Édouard</option>
                                        <option value="SK">Saskatchewan</option>
                                        <option value="NT">Territoires du Nord-Ouest</option>
                                        <option value="NU">Nunavut</option>
                                        <option value="YT">Yukon</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="NY">New York</option>
                                        <option value="VT">Vermont</option>
                                        <option value="ME">Maine</option>
                                        <option value="NH">New Hampshire</option>
                                        <option value="MA">Massachusetts</option>
                                        <option value="CT">Connecticut</option>
                                        <option value="NJ">New Jersey</option>
                                        <option value="PA">Pennsylvania</option>
                                        <option value="FL">Florida</option>
                                        <option value="TX">Texas</option>
                                        <option value="CA">California</option>
                                        <option value="WA">Washington</option>
                                        {/* Add more as needed */}
                                    </>
                                )}
                            </select>
                        ) : (
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                name="addressState"
                                type="text"
                                placeholder="Province / État"
                                value={formData.addressState}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="addressZip"
                            type="text"
                            placeholder="Code Postal"
                            value={formData.addressZip}
                            onChange={handleChange}
                        />
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="addressCountry"
                            value={formData.addressCountry}
                            onChange={(e) => {
                                handleChange(e);
                                setFormData(prev => ({ ...prev, addressState: '' })); // Reset state on country change
                            }}
                        >
                            <option value="Canada">Canada</option>
                            <option value="États-Unis">États-Unis</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Unité de mesure (Préférence)
                        </label>
                        <div className="flex gap-4 mt-2">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="unitSystem"
                                    value="Imperial"
                                    checked={formData.unitSystem === 'Imperial'}
                                    onChange={handleChange}
                                    className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                />
                                <span className="ml-2 text-gray-700">Impérial (Pieds/Pouces)</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    name="unitSystem"
                                    value="Metric"
                                    checked={formData.unitSystem === 'Metric'}
                                    onChange={handleChange}
                                    className="form-radio h-4 w-4 text-primary focus:ring-primary"
                                />
                                <span className="ml-2 text-gray-700">Métrique (Mètres/mm)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* FINANCIAL CONDITIONS - CLIENTS ONLY */}

                <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="text-xl">💰</span> Conditions Financières
                    </h2>

                    {/* ROW 1: General Financial Info */}
                    <div className={`grid grid-cols-1 md:grid-cols-${formData.type === 'Client' ? '3' : '2'} gap-6 mb-8`}>
                        <div>
                            <label className="block text-slate-700 text-sm font-bold mb-2">
                                Devise (Défaut)
                            </label>
                            <select
                                className="w-full shadow-sm border-slate-300 rounded-lg py-2 px-3 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500"
                                name="defaultCurrency"
                                value={formData.defaultCurrency}
                                onChange={handleChange}
                            >
                                {currencies.map(curr => (
                                    <option key={curr.id} value={curr.code}>{curr.code} - {curr.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-slate-700 text-sm font-bold mb-2">
                                Régime de Taxe
                            </label>
                            <select
                                className="w-full shadow-sm border-slate-300 rounded-lg py-2 px-3 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500"
                                name="taxScheme"
                                value={formData.taxScheme}
                                onChange={handleChange}
                            >
                                <option value="TPS/TVQ">TPS/TVQ (Québec)</option>
                                <option value="TPS">TPS (Alberta, etc)</option>
                                <option value="TVH">TVH (Ontario, Atlantique)</option>
                                <option value="Exempt">Exonéré</option>
                            </select>
                        </div>

                        {formData.type === 'Client' && (
                            <div>
                                <label className="block text-slate-700 text-sm font-bold mb-2">
                                    Limite de Crédit
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">$</span>
                                    <input
                                        className="w-full pl-8 shadow-sm border-slate-300 rounded-lg py-2 px-3 text-slate-700 focus:ring-2 focus:ring-blue-500"
                                        name="creditLimit"
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.creditLimit}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ROW 2: Payment Terms (Full Width Card) */}
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="w-full md:w-1/2">
                                <label className="block text-slate-700 text-sm font-bold mb-2">
                                    Conditions de Paiement (Base)
                                </label>
                                <select
                                    className="w-full shadow-sm border-slate-300 rounded-lg py-2 px-3 text-slate-700 bg-white focus:ring-2 focus:ring-blue-500"
                                    name="paymentTermId"
                                    value={formData.paymentTermId}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Sélectionner le code terme --</option>
                                    {paymentTermsList.map(term => (
                                        <option key={term.id} value={term.id}>
                                            {term.code} - {term.label_fr}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* DYNAMIC TERM PREVIEW */}
                            <div className="w-full md:w-1/2">
                                {formData.paymentTermId ? (
                                    <div className="h-full p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 flex items-start gap-2">
                                        <span className="text-lg">👁️</span>
                                        <div>
                                            <p className="font-bold text-xs uppercase tracking-wider mb-1 text-blue-600">Aperçu du libellé (Calculé)</p>
                                            <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap">
                                                {(() => {
                                                    const term = paymentTermsList.find(t => t.id === formData.paymentTermId);
                                                    if (!term) return '...';

                                                    const days = formData.paymentDays ? parseInt(formData.paymentDays) : 0;
                                                    const deposit = formData.depositPercentage ? parseFloat(formData.depositPercentage) : 0;
                                                    const discount = formData.discountPercentage ? parseFloat(formData.discountPercentage) : 0;
                                                    const dDays = formData.discountDays ? parseInt(formData.discountDays) : 0;

                                                    // Generate Dynamic Label with Overrides included
                                                    let label = generatePaymentTermLabel(term.code, days, deposit, formData.language, discount, dDays);

                                                    // If there's a discount, append it to visual preview if not already handled by standard generator
                                                    if (discount > 0 && !label.includes('%')) {
                                                        label += ` (avec ${discount}% d'escompte si payé sous ${dDays} jours)`;
                                                    }
                                                    return label;
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm border border-dashed border-slate-300 rounded bg-slate-50">
                                        Sélectionnez un terme pour voir l'aperçu
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Overrides Grid - 4 Columns */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Délai (Jours)</label>
                                <input
                                    className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    name="paymentDays"
                                    type="number"
                                    value={formData.paymentDays}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Acompte (%)</label>
                                <input
                                    className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    name="depositPercentage"
                                    type="number"
                                    step="0.01"
                                    value={formData.depositPercentage}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Escompte (%)</label>
                                <input
                                    className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    name="discountPercentage"
                                    type="number"
                                    step="0.01"
                                    value={formData.discountPercentage}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Jours Escompte</label>
                                <input
                                    className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    name="discountDays"
                                    type="number"
                                    value={formData.discountDays}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Validité Soumission (Jours)</label>
                                <input
                                    className="w-full shadow-sm border-slate-300 rounded py-1 px-2 text-sm focus:ring-2 focus:ring-blue-500"
                                    name="validityDuration"
                                    type="number"
                                    value={formData.validityDuration}
                                    onChange={handleChange}
                                    placeholder="Défaut: 30"
                                />
                            </div>
                        </div>

                        {/* Custom Text Row */}
                        <div className="mb-4">
                            <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Texte Personnalisé</label>
                            <input
                                className="w-full shadow-sm border-slate-300 rounded py-2 px-3 text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                                name="paymentCustomText"
                                type="text"
                                placeholder="Si requis..."
                                value={formData.paymentCustomText || ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={!isClient ? "hidden" : ""}>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="repName">
                            Représentant
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="repName"
                            value={formData.repName}
                            onChange={handleChange}
                        >
                            <option value="">-- Sélectionner --</option>
                            {reps.map(rep => (
                                <option key={rep.id} value={`${rep.firstName} ${rep.lastName}`}>
                                    {rep.firstName} {rep.lastName}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Supplier Type Dropdown (Only for Suppliers) */}
                    <div className={isClient ? "hidden" : ""}>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplierType">
                            Type de Fournisseur
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="supplierType"
                            value={formData.supplierType}
                            onChange={handleChange}
                            required={!isClient}
                        >
                            <option value="">-- Sélectionner --</option>
                            <option value="Fournisseur de pierre">Fournisseur de pierre</option>
                            <option value="Fournisseurs de pièce">Fournisseurs de pièce</option>
                            <option value="Transporteur">Transporteur</option>
                            <option value="Courtier">Courtier</option>
                            <option value="Autres">Autres</option>
                            <option value="Autres">Autres</option>
                        </select>
                    </div>
                    {/* Price List Upload - Only for Stone Supplier */}
                    {!isClient && formData.supplierType === 'Fournisseur de pierre' && (
                        <div className="col-span-2 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Liste de prix (PDF)
                                </label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                                />
                                {formData.priceListUrl && (
                                    <p className="mt-2 text-sm text-green-600">
                                        <a href={`${formData.priceListUrl}`} target="_blank" rel="noopener noreferrer" className="underline">
                                            Voir la liste actuelle ({formData.priceListDate || 'Année non spécifiée'})
                                        </a>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Version de la liste de prix
                                </label>
                                <select
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="priceListDate"
                                    value={formData.priceListDate || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Sélectionner l'année --</option>
                                    <option value="Prix 2023">Prix 2023</option>
                                    <option value="Prix 2024">Prix 2024</option>
                                    <option value="Prix 2025">Prix 2025</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
                <div className={!isClient ? "grid grid-cols-2 gap-4 mb-4" : "grid grid-cols-2 gap-4 mb-4"}>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="language">
                            Langue
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="language"
                            value={formData.language}
                            onChange={handleChange}
                        >
                            {languages.map(lang => (
                                <option key={lang.id} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="incoterm">
                            Incoterm (Défaut)
                        </label>
                        <div className="flex gap-2">
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.incotermId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const obj = incoterms.find((i: any) => i.id === val);
                                    setFormData(prev => ({
                                        ...prev,
                                        incotermId: val,
                                        incoterm: obj ? obj.name : '',
                                        incotermCustomText: (obj?.requiresText) ? prev.incotermCustomText : ''
                                    }));
                                }}
                            >
                                <option value="">-- Sélectionner --</option>
                                {incoterms.map((i: any) => (
                                    <option key={i.id} value={i.id}>{i.name} ({i.xmlCode})</option>
                                ))}
                            </select>
                        </div>
                        {/* Show input if Custom/Other */}
                        {(() => {
                            const selected = incoterms.find((i: any) => i.id === formData.incotermId);
                            if (selected && selected.requiresText) {
                                return (
                                    <input
                                        className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                        type="text"
                                        placeholder="Précisez..."
                                        value={formData.incotermCustomText || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, incotermCustomText: e.target.value }))}
                                    />
                                );
                            }
                            return null;
                        })()}
                    </div>
                </div>

                {/* V8 GLOBAL PARAMS OVERRIDES - CLIENTS ONLY */}
                {formData.type === 'Client' && (
                    <div className="mb-6 border-t border-gray-100 pt-4">
                        <h3 className="text-gray-800 font-semibold mb-4 flex items-center">
                            <span className="mr-2">⚡</span> Paramètres Généraux (Surcharge)
                            <span className="ml-2 text-xs font-normal text-gray-400">Si vide, la valeur par défaut du système sera utilisée.</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Taux Semi-Standard
                                </label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="semiStandardRate"
                                    type="number"
                                    step="0.01"
                                    placeholder={`Défaut: ${systemDefaults.defaultSemiStandardRate ?? '...'}`}
                                    value={formData.semiStandardRate}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Devise de Vente
                                </label>
                                <select
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="salesCurrency"
                                    value={formData.salesCurrency}
                                    onChange={handleChange}
                                >
                                    <option value="">Défaut ({systemDefaults.defaultSalesCurrency ?? 'CAD'})</option>
                                    <option value="CAD">CAD</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Taux de Change (Fixe/Override)
                                </label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="exchangeRate"
                                    type="number"
                                    step="0.0001"
                                    placeholder={`Défaut: ${systemDefaults.defaultExchangeRate ?? '...'}`}
                                    value={formData.exchangeRate}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-gray-400 mt-1">Laissez vide pour utiliser le taux du système ({systemDefaults.defaultExchangeRate}).</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Prix Palette ($)
                                </label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="palletPrice"
                                    type="number"
                                    step="0.01"
                                    placeholder={`Défaut: ${systemDefaults.defaultPalletPrice ?? '...'}`}
                                    value={formData.palletPrice}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Palette Requise ?
                                </label>
                                <select
                                    className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                    name="palletRequired"
                                    value={formData.palletRequired}
                                    onChange={handleChange}
                                >
                                    <option value="">Défaut ({systemDefaults.defaultPalletRequired !== undefined ? (systemDefaults.defaultPalletRequired ? 'Oui' : 'Non') : '...'})</option>
                                    <option value="true">Oui</option>
                                    <option value="false">Non</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="internalNotes">
                        Notes Internes
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary h-24"
                        name="internalNotes"
                        placeholder="Informations supplémentaires..."
                        value={formData.internalNotes}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        type="submit"
                    >
                        {id ? 'Mettre à jour' : `Créer le ${singular}`}
                    </button>
                    <button
                        className="inline-block align-baseline font-bold text-sm text-primary hover:text-blue-800"
                        type="button"
                        onClick={() => navigate(basePath)}
                    >
                        Annuler
                    </button>
                </div>
            </form >
        </div >
    );
};

export default ClientForm;
