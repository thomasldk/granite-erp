import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThirdPartyById, addContact, updateContact, getContactTypes } from '../../services/thirdPartyService';
import { formatPhoneNumber } from '../../utils/formatters';
import { generatePaymentTermLabel } from '../../services/paymentTermService';

const ClientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [contactTypes, setContactTypes] = useState<any[]>([]);
    const [showContactForm, setShowContactForm] = useState(false);
    const [editingContactId, setEditingContactId] = useState<string | null>(null);
    const [contactForm, setContactForm] = useState({
        firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '', role: ''
    });

    useEffect(() => {
        if (id) loadClient();
    }, [id]);

    useEffect(() => {
        if (client) loadContactTypes();
    }, [client]);

    const loadClient = async () => {
        try {
            const data = await getThirdPartyById(id!);
            setClient(data);
        } catch (error) {
            console.error('Error loading client', error);
        }
    };

    const loadContactTypes = async () => {
        try {
            // Wait for client to be loaded to know the type
            if (!client) return;
            const types = await getContactTypes(client.type);
            setContactTypes(types);
        } catch (error) {
            console.error('Error loading contact types', error);
        }
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContactId) {
                await updateContact(editingContactId, contactForm);
            } else {
                await addContact(id!, contactForm);
            }

            setContactForm({ firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '', role: '' });
            setShowContactForm(false);
            setEditingContactId(null);
            loadClient(); // Reload to show updated contact
        } catch (error) {
            console.error('Error saving contact', error);
            alert('Erreur lors de la sauvegarde du contact');
        }
    };

    const startEditContact = (contact: any) => {
        setContactForm({
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email || '',
            phone: contact.phone || '',
            mobile: contact.mobile || '',
            fax: contact.fax || '',
            role: contact.role || ''
        });
        setEditingContactId(contact.id);
        setShowContactForm(true);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const formatted = formatPhoneNumber(value);
        setContactForm({ ...contactForm, [name]: formatted });
    };

    if (!client) return <div>Chargement...</div>;

    const mainAddress = client.addresses?.find((a: any) => a.type === 'Main') || {};
    const isClient = client.type === 'Client';
    const singular = isClient ? 'Client' : 'Fournisseur';
    const basePath = isClient ? '/clients' : '/suppliers';

    return (
        <div className="p-8">
            <div className="bg-white shadow rounded-lg p-6 mb-8 border-l-4 border-primary">
                {/* Header: Back & Actions & Title Compact */}
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <div>
                        <button onClick={() => navigate(basePath)} className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1 mb-2">
                            <span>&larr;</span> Retour
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{client.name}</h1>
                        <p className="text-gray-500 text-sm mt-1">{client.type} - {client.code}</p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    const code = window.prompt("Pour confirmer la suppression, entrez le code de suppression :");
                                    if (code === "1234") {
                                        try {
                                            const { deleteThirdParty } = await import('../../services/thirdPartyService');
                                            await deleteThirdParty(id!);
                                            navigate(basePath);
                                        } catch (error) {
                                            console.error('Failed to delete', error);
                                            alert('Erreur lors de la suppression');
                                        }
                                    } else if (code !== null) {
                                        alert("Code incorrect. Suppression annulée.");
                                    }
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200"
                            >
                                Supprimer
                            </button>
                            <button
                                onClick={() => navigate(`${basePath}/${id}/edit`)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200"
                            >
                                Modifier
                            </button>
                        </div>
                        {(client.paymentTerm || client.incoterm) && (
                            <div className={`px-4 py-2 rounded-lg text-sm border ${client.paymentTermId ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-100 border-gray-200 text-gray-800'}`}>
                                <div className="font-bold mb-1 flex items-center gap-2">
                                    <span>💳 Conditions & Incoterm</span>
                                    {client.limitReached && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">Limite Crédit Atteinte</span>}
                                </div>
                                {client.paymentTerm && (
                                    <p className="font-medium whitespace-pre-wrap mb-1">
                                        {generatePaymentTermLabel(
                                            client.paymentTerm.code,
                                            client.paymentDays || client.paymentTerm.days,
                                            client.depositPercentage || client.paymentTerm.depositPercentage,
                                            client.language,
                                            client.discountPercentage || 0,
                                            client.discountDays || 0
                                        )}
                                        {client.paymentCustomText && <span className="block mt-1 italic text-gray-600 font-normal">{client.paymentCustomText}</span>}
                                    </p>
                                )}
                                {client.incoterm && (
                                    <p className="font-bold border-t border-green-200 pt-1 mt-1">
                                        Incoterm: {client.incoterm}
                                        {client.incotermCustomText && <span className="block font-normal italic text-xs">{client.incotermCustomText}</span>}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6">
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Coordonnées</h3>
                        <p><strong>Email:</strong> {client.email || '-'}</p>
                        <p><strong>Tel:</strong> {client.phone || '-'}</p>
                        <p><strong>Fax:</strong> {client.fax || '-'}</p>
                        <p><strong>Site:</strong> {client.website || '-'}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Adresse Principale</h3>
                        <p>{mainAddress.line1}</p>
                        <p>{mainAddress.city} {mainAddress.state} {mainAddress.zipCode}</p>
                        <p>{mainAddress.country}</p>
                    </div>
                    {isClient && (
                        <div>
                            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Infos Financières</h3>
                            <p><strong>Devise:</strong> {client.defaultCurrency}</p>
                            <p><strong>Crédit:</strong> {client.creditLimit ? `$${client.creditLimit}` : 'Non défini'}</p>
                            <p><strong>Taxes:</strong> {client.taxScheme}</p>
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Commercial</h3>
                        {/* Show Rep for Clients */}
                        {isClient && (
                            <p><strong>Représentant:</strong> {client.repName || 'Aucun'}</p>
                        )}
                        {/* Show Supplier Type for Suppliers */}
                        {!isClient && client.supplierType && (
                            <>
                                <p><strong>Type:</strong> {client.supplierType}</p>
                                {client.supplierType === 'Fournisseur de pierre' && client.priceListUrl && (
                                    <p className="mt-2 text-green-700">
                                        <a href={`${client.priceListUrl}`} target="_blank" rel="noopener noreferrer" className="underline font-bold flex items-center gap-2">
                                            <span>📄 Liste de prix ({client.priceListDate || 'Année non spécifiée'})</span>
                                        </a>
                                    </p>
                                )}
                            </>
                        )}
                        <p><strong>Langue:</strong> {client.language === 'fr' ? 'Français' : 'Anglais'}</p>
                        <p><strong>Unité:</strong> {client.unitSystem === 'Metric' ? 'Métrique' : 'Impérial'}</p>
                    </div>
                    {/* General Parameters & Overrides Block - 2 Columns */}
                    {isClient && (
                        <div>
                            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Autres paramètres</h3>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                <p><strong className="text-gray-600">Semi-Std:</strong> {client.semiStandardRate ? client.semiStandardRate : <span className="text-gray-400 italic">Défaut</span>}</p>
                                <p><strong className="text-gray-600">Devise:</strong> {client.salesCurrency ? client.salesCurrency : <span className="text-gray-400 italic">Défaut</span>}</p>
                                <p><strong className="text-gray-600">Change:</strong> {client.exchangeRate ? client.exchangeRate : <span className="text-gray-400 italic">Défaut</span>}</p>
                                <p><strong className="text-gray-600">Palette:</strong> {client.palletPrice ? `$${client.palletPrice}` : <span className="text-gray-400 italic">Défaut</span>}</p>
                                <p><strong className="text-gray-600">Pal. Req:</strong> {client.palletRequired === null ? <span className="text-gray-400 italic">Défaut</span> : (client.palletRequired ? 'Oui' : 'Non')}</p>

                                <div>
                                    <p><strong className="text-gray-600">Incoterm:</strong> {client.incoterm || '-'}</p>
                                    {client.incotermCustomText && <p className="text-xs text-gray-500 italic mt-0.5">{client.incotermCustomText}</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
                <button
                    onClick={() => {
                        setShowContactForm(!showContactForm);
                        if (showContactForm) setEditingContactId(null);
                        if (!showContactForm) setContactForm({ firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '', role: '' });
                    }}
                    className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    {showContactForm ? 'Annuler' : '+ Ajouter un Contact'}
                </button>
            </div>

            {showContactForm && (
                <form onSubmit={handleSaveContact} className="bg-gray-50 p-6 rounded shadow mb-6 border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">{editingContactId ? 'Modifier Contact' : 'Nouveau Contact'}</h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <input
                            placeholder="Prénom"
                            className="border p-2 rounded w-full"
                            value={contactForm.firstName}
                            onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Nom"
                            className="border p-2 rounded w-full"
                            value={contactForm.lastName}
                            onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                            required
                        />
                        <select
                            className="border p-2 rounded w-full bg-white"
                            value={contactForm.role}
                            onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                        >
                            <option value="">-- Rôle --</option>
                            {contactTypes.map(type => (
                                <option key={type.id} value={type.name}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <input
                            placeholder="Email"
                            type="email"
                            className="border p-2 rounded w-full"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        />
                        <input
                            name="phone"
                            placeholder="Téléphone"
                            className="border p-2 rounded w-full"
                            value={contactForm.phone}
                            onChange={handlePhoneChange}
                        />
                        <input
                            name="mobile"
                            placeholder="Cellulaire"
                            className="border p-2 rounded w-full"
                            value={contactForm.mobile}
                            onChange={handlePhoneChange}
                        />
                        <input
                            name="fax"
                            placeholder="Fax"
                            className="border p-2 rounded w-full"
                            value={contactForm.fax}
                            onChange={handlePhoneChange}
                        />
                    </div>
                    <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded w-full hover:bg-blue-700">
                        {editingContactId ? 'Mettre à jour Contact' : 'Sauvegarder Contact'}
                    </button>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {client.contacts && client.contacts.length > 0 ? (
                    client.contacts.map((contact: any) => (
                        <div key={contact.id} className="bg-white border text-sm rounded-lg p-4 shadow-sm hover:shadow-md transition relative group">
                            <button
                                onClick={() => startEditContact(contact)}
                                className="absolute top-2 right-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition"
                            >
                                ✏️ Modifier
                            </button>
                            <h4 className="font-bold text-lg text-gray-800">{contact.firstName} {contact.lastName}</h4>
                            <p className="text-blue-600 font-medium mb-2">{contact.role}</p>
                            <p className="text-gray-600">{contact.email}</p>
                            <p className="text-gray-600">Tel: {contact.phone}</p>
                            {contact.fax && <p className="text-gray-600">Fax: {contact.fax}</p>}
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic col-span-3">Aucun contact enregistré pour ce {singular.toLowerCase()}.</p>
                )}
            </div>
        </div>
    );
};

export default ClientDetail;
