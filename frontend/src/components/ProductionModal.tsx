import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { getContactTypes } from '../services/thirdPartyService';
import { XMarkIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ProductionModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteId: string;
    reference: string;
    project: any;
    client: any;
    defaultWeeks: number;
    pdfUrl?: string; // Optional URL to the PDF
    onSuccess: (workOrderId: string) => void;
}

const ProductionModal: React.FC<ProductionModalProps> = ({ isOpen, onClose, quoteId, reference, project, client, defaultWeeks, pdfUrl, onSuccess }) => {
    const [clientPO, setClientPO] = useState('');
    const [productionWeeks, setProductionWeeks] = useState(defaultWeeks || 6);
    const [projectManagerId, setProjectManagerId] = useState('');

    const [accountingContactId, setAccountingContactId] = useState('');
    const [note, setNote] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextRef, setNextRef] = useState<string>(''); // Store next ref
    const [productionSites, setProductionSites] = useState<any[]>([]);
    const [productionSiteId, setProductionSiteId] = useState('');

    // Dynamic Additional Contacts
    const [contactTypes, setContactTypes] = useState<any[]>([]);
    const [additionalContacts, setAdditionalContacts] = useState<{ id: string, roleId: string, contactId: string }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Fetch next reference
            api.get('/work-orders/next-reference')
                .then(res => setNextRef(res.data.reference))
                .catch(err => console.error(err));

            // Fetch Sites
            api.get('/production-sites')
                .then(res => setProductionSites(res.data))
                .catch(console.error);

            // Fetch Contact Types for dynamic roles
            getContactTypes().then(setContactTypes).catch(console.error);
        }
    }, [isOpen]);


    const handleSubmit = async () => {
        // Validation: All fields required (clientPO, file, contacts, weeks) EXCEPT Note.
        if (!clientPO || !file || !projectManagerId || !accountingContactId || !productionWeeks) {
            setError("Tous les champs doivent être remplis, y compris le fichier PO (sauf la note de production).");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('quoteId', quoteId);
            formData.append('productionWeeks', productionWeeks.toString());
            if (clientPO) formData.append('clientPO', clientPO);
            if (projectManagerId) formData.append('projectManagerId', projectManagerId);
            if (productionSiteId) formData.append('productionSiteId', productionSiteId);

            // Append Dynamic Contacts
            const validContacts = additionalContacts.filter(c => c.roleId && c.contactId);
            if (validContacts.length > 0) {
                formData.append('additionalContacts', JSON.stringify(validContacts));
            }

            const response = await api.post('/work-orders', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            onSuccess(response.data.id);
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erreur lors de la mise en production');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPdf = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await api.get(`/quotes/${quoteId}/pdf-view`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            window.open(url, '_blank');
        } catch (err: any) {
            console.error('Error viewing PDF', err);
            // Try to read the blob as text to get the error message if it's JSON
            if (err.response?.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorObj = JSON.parse(reader.result as string);
                        window.alert(`Erreur: ${errorObj.error || "Fichier introuvable"}\n${errorObj.path ? "Chemin: " + errorObj.path : ""}`);
                    } catch {
                        window.alert("Erreur lors de l'ouverture du PDF (Format inconnu).");
                    }
                };
                reader.readAsText(err.response.data);
            } else {
                window.alert("Erreur technique lors de l'ouverture du PDF.");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Mise en Production</h2>
                    <div className="flex items-center gap-3">
                        {nextRef && (
                            <span className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm">
                                {nextRef}
                            </span>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="bg-gray-100 p-4 rounded mb-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Soumission</p>
                        <p className="font-medium flex items-center gap-2">
                            {reference}
                            {pdfUrl && (
                                <button
                                    onClick={handleViewPdf}
                                    className="text-xs text-blue-600 underline hover:text-blue-800 bg-transparent border-none cursor-pointer"
                                >
                                    (Voir PDF)
                                </button>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Client</p>
                        <p className="font-medium">{client?.name}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm text-gray-500">Projet</p>
                        <p className="font-medium">{project?.name}</p>
                    </div>
                </div>

                {error && <div className="mb-4 text-red-600 bg-red-50 p-2 rounded text-sm font-medium border border-red-200">{error}</div>}

                <div className="grid grid-cols-2 gap-6 mb-4">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Bon de Commande Client (PO) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full border rounded p-2"
                                placeholder="ex: PO-12345"
                                value={clientPO}
                                onChange={(e) => setClientPO(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Fichier PO (PDF/Image) <span className="text-red-500">*</span></label>
                            <input
                                type="file"
                                className="w-full text-sm"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Délai Production (Semaines) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                className="w-full border rounded p-2"
                                value={productionWeeks}
                                onChange={(e) => setProductionWeeks(parseInt(e.target.value))}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Date estimée : {new Date(Date.now() + (productionWeeks * 7 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Lieu de Production</label>
                            <select
                                className="w-full border rounded p-2"
                                value={productionSiteId}
                                onChange={(e) => setProductionSiteId(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {productionSites.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Responsable Projet (Client) <span className="text-red-500">*</span></label>
                            <select
                                className="w-full border rounded p-2"
                                value={projectManagerId}
                                onChange={(e) => setProjectManagerId(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {client?.contacts
                                    ?.sort((a: any, b: any) => (a.firstName || '').localeCompare(b.firstName || ''))
                                    .map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                    ))}
                            </select>
                        </div>



                        {/* Dynamic Additional Contacts */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium mb-1">Contacts Additionnels</label>
                            {additionalContacts.map((contact, index) => (
                                <div key={contact.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded border">
                                    <div className="flex-1">
                                        <select
                                            className="w-full border rounded p-1 text-sm"
                                            value={contact.roleId}
                                            onChange={(e) => {
                                                const newContacts = [...additionalContacts];
                                                newContacts[index].roleId = e.target.value;
                                                setAdditionalContacts(newContacts);
                                            }}
                                        >
                                            <option value="">Rôle...</option>
                                            {contactTypes
                                                .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                                .map(type => (
                                                    <option key={type.id} value={type.id}>
                                                        {client?.language === 'en' && type.nameEn ? type.nameEn : type.name}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <select
                                            className="w-full border rounded p-1 text-sm"
                                            value={contact.contactId}
                                            onChange={(e) => {
                                                const newContacts = [...additionalContacts];
                                                newContacts[index].contactId = e.target.value;
                                                setAdditionalContacts(newContacts);
                                            }}
                                        >
                                            <option value="">Personne...</option>
                                            {client?.contacts
                                                ?.sort((a: any, b: any) => (a.firstName || '').localeCompare(b.firstName || ''))
                                                .map((c: any) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.firstName} {c.lastName} {c.role ? `(${c.role})` : ''}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newContacts = additionalContacts.filter(c => c.id !== contact.id);
                                            setAdditionalContacts(newContacts);
                                        }}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Retirer"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => setAdditionalContacts([...additionalContacts, { id: Date.now().toString(), roleId: '', contactId: '' }])}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                                <PlusIcon className="w-4 h-4" /> Ajouter un contact
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Responsable Comptabilité (Client) <span className="text-red-500">*</span></label>
                            <select
                                className="w-full border rounded p-2"
                                value={accountingContactId}
                                onChange={(e) => setAccountingContactId(e.target.value)}
                            >
                                <option value="">-- Sélectionner --</option>
                                {client?.contacts
                                    // Filter for accounting-related roles (FR & EN keywords)
                                    ?.filter((c: any) => {
                                        const r = (c.role || '').toLowerCase();
                                        return r.includes('compt') ||
                                            r.includes('financ') ||
                                            r.includes('admin') ||
                                            r.includes('factur') ||
                                            r.includes('pay') ||
                                            r.includes('account') || // English
                                            r.includes('book') ||    // Bookkeeper
                                            r.includes('control') || // Controller/Contrôleur
                                            r.includes('cfo');
                                    })
                                    ?.sort((a: any, b: any) => (a.firstName || '').localeCompare(b.firstName || ''))
                                    .map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                    ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Note de Production</label>
                            <textarea
                                className="w-full border rounded p-2 text-sm"
                                rows={2}
                                placeholder="Note interne..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Création...' : 'Confirmer et Créer BT'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductionModal;
