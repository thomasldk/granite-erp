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
    const [paymentTermsList, setPaymentTermsList] = useState<PaymentTerm[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
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
        internalNotes: '',
        // Address
        addressLine1: '',
        addressCity: '',
        addressState: '',
        addressZip: '',
        addressCountry: 'Canada'
    });

    const isClient = formData.type === 'Client';
    const singular = isClient ? 'Client' : 'Fournisseur';
    const basePath = isClient ? '/clients' : '/suppliers';

    useEffect(() => {
        const init = async () => {
            try {
                const [repsData, langsData, currsData, termsData] = await Promise.all([
                    getRepresentatives(),
                    getLanguages(),
                    getCurrencies(),
                    getPaymentTerms()
                ]);
                setReps(repsData);
                setLanguages(langsData);
                setCurrencies(currsData);
                setPaymentTermsList(termsData);

                if (id) {
                    setLoading(true);
                    const client = await getThirdPartyById(id);
                    const mainAddr = client.addresses?.find((a: any) => a.type === 'Main') || {};

                    setFormData({
                        name: client.name,
                        code: client.code || '',
                        phone: client.phone || '',
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
                        internalNotes: client.internalNotes || '',
                        addressLine1: mainAddr.line1 || '',
                        addressCity: mainAddr.city || '',
                        addressState: mainAddr.state || '',
                        addressZip: mainAddr.zipCode || '',
                        addressCountry: mainAddr.country || 'Canada'
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
            const selectedTerm = paymentTermsList.find(t => t.id === value);
            if (selectedTerm) {
                setFormData({
                    ...formData,
                    paymentTermId: value,
                    paymentDays: String(selectedTerm.days),
                    depositPercentage: String(selectedTerm.depositPercentage)
                    // Text will be updated by useEffect
                });
            } else {
                setFormData({ ...formData, [name]: value });
            }
        } else if (name === 'phone' || name === 'fax') {
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
                depositPercentage: formData.depositPercentage ? parseFloat(formData.depositPercentage) : 0
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
                    <div className="w-1/2">
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
                    <div className="w-1/2">
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
                                onChange={handleChange}
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

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="defaultCurrency">
                            Devise
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
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
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentTerms">
                            Conditions de Paiement
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="paymentTermId"
                            value={formData.paymentTermId}
                            onChange={handleChange}
                        >
                            <option value="">-- Sélectionner --</option>
                            {paymentTermsList.map(term => {
                                let label = `${term.code} - ${term.label_fr}`;
                                if (term.id === formData.paymentTermId) {
                                    // Calculate dynamic label for the selected term using form data
                                    const days = formData.paymentDays ? parseInt(formData.paymentDays) : 0;
                                    const deposit = formData.depositPercentage ? parseFloat(formData.depositPercentage) : 0;
                                    const dynamicLabel = generatePaymentTermLabel(term.code, days, deposit, formData.language);
                                    label = `${term.code} - ${dynamicLabel}`;
                                }
                                return (
                                    <option key={term.id} value={term.id}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="paymentDays">
                            Délai de paiement (Jours)
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="paymentDays"
                            type="number"
                            placeholder="ex: 30"
                            value={formData.paymentDays}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="depositPercentage">
                            Acompte / Dépôt (%)
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="depositPercentage"
                            type="number"
                            step="0.01"
                            placeholder="ex: 50"
                            value={formData.depositPercentage}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taxScheme">
                            Régime de Taxe
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="taxScheme"
                            value={formData.taxScheme}
                            onChange={handleChange}
                        >
                            <option value="TPS/TVQ">TPS/TVQ</option>
                            <option value="Exempt">Exonéré</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="creditLimit">
                            Limite de Crédit
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="creditLimit"
                            type="number"
                            placeholder="0.00"
                            value={formData.creditLimit}
                            onChange={handleChange}
                        />
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
                            Incoterm
                        </label>
                        <div className="flex gap-2">
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                value={['Ex Works', 'FOB jobsite'].includes(formData.incoterm) ? formData.incoterm : 'Other'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Other') {
                                        setFormData({ ...formData, incoterm: '' }); // Clear to let user type
                                    } else {
                                        setFormData({ ...formData, incoterm: val });
                                    }
                                }}
                            >
                                <option value="Ex Works">Ex Works (EXW)</option>
                                <option value="FOB jobsite">FOB jobsite</option>
                                <option value="Other">À déterminer / Autre</option>
                            </select>
                        </div>
                        {/* Show input if Custom/Other */}
                        {(!['Ex Works', 'FOB jobsite'].includes(formData.incoterm) || formData.incoterm === '') && (
                            <input
                                className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                type="text"
                                placeholder="Précisez l'incoterm..."
                                value={formData.incoterm}
                                onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                            />
                        )}
                    </div>
                </div>

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
