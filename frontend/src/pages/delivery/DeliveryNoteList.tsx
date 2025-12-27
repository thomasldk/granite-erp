
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DocumentTextIcon, PlusIcon, PencilSquareIcon, TrashIcon, MapPinIcon, PlusCircleIcon, MinusCircleIcon, ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { formatPhoneNumber, formatPostalCode } from '../../utils/formatters';
import { lookupPostalCode } from '../../services/geoService';

// Geographic Constants
const CAN_PROVINCES = [
    { code: 'QC', name: 'Québec' },
    { code: 'ON', name: 'Ontario' },
    { code: 'BC', name: 'Colombie-Britannique' },
    { code: 'AB', name: 'Alberta' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'NB', name: 'Nouveau-Brunswick' },
    { code: 'NL', name: 'Terre-Neuve-et-Labrador' },
    { code: 'NS', name: 'Nouvelle-Écosse' },
    { code: 'PE', name: 'Île-du-Prince-Édouard' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'NT', name: 'Territoires du Nord-Ouest' },
    { code: 'NU', name: 'Nunavut' },
    { code: 'YT', name: 'Yukon' }
];

const USA_STATES = [
    { code: 'NY', name: 'New York' },
    { code: 'VT', name: 'Vermont' },
    { code: 'ME', name: 'Maine' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'FL', name: 'Florida' },
    { code: 'TX', name: 'Texas' },
    { code: 'CA', name: 'California' },
    { code: 'WA', name: 'Washington' }
];

const DeliveryNoteList: React.FC = () => {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/View State
    const [selectedNote, setSelectedNote] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({
        date: '',
        addrLine1: '',
        addrCity: '',
        addrState: '',
        addrZip: '',
        addrCountry: '',
        siteContactName: '',
        siteContactPhone: '',
        siteContactEmail: '',
        status: ''
    });

    // Creation State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [readyPallets, setReadyPallets] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [selectedPalletIds, setSelectedPalletIds] = useState<string[]>([]);
    const [createDate, setCreateDate] = useState(new Date().toISOString().split('T')[0]);
    // Enhanced State
    const [createCarrier, setCreateCarrier] = useState('Transport Granite DRC');
    const [createAddressMode, setCreateAddressMode] = useState<string>(''); // 'default', addressId, or 'new'
    const [createNewAddress, setCreateNewAddress] = useState({ line1: '', city: '', state: 'QC', zip: '', country: 'Canada' });
    const [createContact, setCreateContact] = useState({ firstName: '', lastName: '', role: '', phone: '', email: '' });

    const [expandedPalletId, setExpandedPalletId] = useState<string | null>(null);

    useEffect(() => {
        fetchNotes();
        fetchReadyPallets();
    }, []);

    const fetchReadyPallets = async () => {
        try {
            const response = await api.get('/delivery/pallets/ready');
            setReadyPallets(response.data);
        } catch (error) {
            console.error("Error fetching ready pallets", error);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await api.get('/delivery/notes');
            setNotes(response.data);
        } catch (error) {
            console.error("Error fetching delivery notes", error);
        } finally {
            setLoading(false);
        }
    };

    // --- CREATION LOGIC ---

    const handleOpenCreateModal = async () => {
        setIsCreateModalOpen(true);
        setSelectedClientId('');
        setSelectedPalletIds([]);
        setCreateDate(new Date().toISOString().split('T')[0]);
        // Reset Enhanced Fields
        setCreateCarrier('Transport Granite DRC');
        setCreateAddressMode('');
        setCreateNewAddress({ line1: '', city: '', state: 'QC', zip: '', country: 'Canada' });
        setCreateContact({ firstName: '', lastName: '', role: '', phone: '', email: '' });

        await fetchReadyPallets(); // Refresh on open
    };

    const getUniqueClients = () => {
        const clients = new Map();
        readyPallets.forEach(p => {
            // Traverse up to find client: Pallet -> WorkOrder -> Quote -> Client
            const client = p.workOrder?.quote?.client;
            if (client && !clients.has(client.id)) {
                clients.set(client.id, client);
            }
        });
        return Array.from(clients.values());
    };

    const getSelectedClientAddresses = () => {
        const client = getUniqueClients().find((c: any) => c.id === selectedClientId);
        return client?.addresses || [];
    };

    const handleCreateSubmit = async () => {
        if (!selectedClientId) return;

        try {
            const client = getUniqueClients().find((c: any) => c.id === selectedClientId);
            let finalAddressStr = '';
            let newAddressPayload = {};

            // Calculate Address
            if (createAddressMode === 'new') {
                finalAddressStr = `${createNewAddress.line1} \n${createNewAddress.city}, ${createNewAddress.state} ${createNewAddress.zip} \n${createNewAddress.country} `;
                // Prepare fields for backend auto-save
                newAddressPayload = {
                    addrLine1: createNewAddress.line1,
                    addrCity: createNewAddress.city,
                    addrState: createNewAddress.state,
                    addrZip: createNewAddress.zip,
                    addrCountry: createNewAddress.country
                };
            } else if (createAddressMode && createAddressMode !== 'default') {
                // Existing address ID selected
                const addr = client.addresses.find((a: any) => a.id === createAddressMode);
                if (addr) {
                    finalAddressStr = `${addr.line1} \n${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''} \n${addr.country} `;
                }
            } else {
                // Default fallback (First address)
                if (client?.addresses?.[0]) {
                    const addr = client.addresses[0];
                    finalAddressStr = `${addr.line1} \n${addr.city || ''}, ${addr.state || ''} ${addr.zipCode || ''} \n${addr.country} `;
                }
            }

            const fullName = `${createContact.firstName} ${createContact.lastName} `.trim();

            const payload = {
                clientId: selectedClientId,
                date: createDate,
                address: finalAddressStr,
                palletIds: selectedPalletIds, // Can be empty now
                carrier: createCarrier,
                siteContactName: fullName, // Concatenate for backend
                siteContactRole: createContact.role, // Send Role
                siteContactPhone: createContact.phone,
                siteContactEmail: createContact.email,
                addressId: (createAddressMode && createAddressMode !== 'new' && createAddressMode !== 'default') ? createAddressMode : (createAddressMode === 'default' && client?.addresses?.[0]?.id) ? client.addresses[0].id : undefined,
                ...newAddressPayload
            };

            await api.post('/delivery/notes', payload);

            // Success
            setIsCreateModalOpen(false);
            fetchNotes(); // Refresh list
        } catch (error) {
            console.error("Creation error", error);
            alert("Erreur lors de la création.");
        }
    };

    // --- EXISTING LOGIC ---

    const handleNoteClick = (note: any) => {
        let dateStr = '';
        try {
            if (note.date) {
                dateStr = new Date(note.date).toISOString().split('T')[0];
            }
        } catch (e) {
            console.error("Date parsing error", e);
        }

        // Parse Address
        const fullAddr = note.deliveryAddress || '';
        const lines = fullAddr.split('\n');
        const addrLine1 = lines[0] || '';
        let addrCity = '';
        let addrState = '';
        let addrZip = '';
        let addrCountry = 'Canada'; // Default

        // Heuristic Parsing
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1].trim();
            if (lastLine.toLowerCase() === 'canada' || lastLine.toLowerCase() === 'ca') addrCountry = 'Canada';
            else if (lastLine.toLowerCase() === 'états-unis' || lastLine.toLowerCase() === 'usa' || lastLine.toLowerCase() === 'us') addrCountry = 'États-Unis';
            else addrCountry = 'Canada'; // Fallback
        }

        if (lines.length > 2) {
            const midLine = lines[1];
            const parts = midLine.split(',');
            if (parts.length > 0) addrCity = parts[0].trim();
            if (parts.length > 1) {
                const stateZip = parts[1].trim().split(' ');
                if (stateZip.length > 0) addrState = stateZip[0];
                if (stateZip.length > 1) addrZip = stateZip.slice(1).join(' ');
            }
        } else if (lines.length === 2) {
            if (!lines[1].toLowerCase().includes('canada') && !lines[1].toLowerCase().includes('usa')) {
                addrCity = lines[1];
            }
        }

        setEditForm({
            date: dateStr,
            addrLine1,
            addrCity,
            addrState,
            addrZip,
            addrCountry,
            siteContactName: note.siteContactName || '',
            siteContactPhone: formatPhoneNumber(note.siteContactPhone || ''),
            siteContactEmail: note.siteContactEmail || '',
            status: note.status || 'Draft'
        });
        setSelectedNote(note);
    };

    const getFullAddress = () => {
        let address = editForm.addrLine1;
        if (editForm.addrCity) address += `, ${editForm.addrCity} `;
        if (editForm.addrState) address += `, ${editForm.addrState} `;
        if (editForm.addrZip) address += ` ${editForm.addrZip} `;
        if (editForm.addrCountry) address += `, ${editForm.addrCountry} `;
        return address;
    };

    const handleAutoZip = async () => {
        if (editForm.addrZip && editForm.addrZip.length > 3) return;
        const fullAddr = getFullAddress();
        if (!fullAddr || fullAddr.length < 10) return;
        const zip = await lookupPostalCode(fullAddr);
        if (zip) {
            setEditForm((prev: any) => ({ ...prev, addrZip: zip }));
        }
    };

    const handleSave = async () => {
        try {
            let addressParts = [editForm.addrLine1];
            if (editForm.addrCity || editForm.addrState || editForm.addrZip) {
                let midLine = editForm.addrCity;
                if (editForm.addrState) midLine += `, ${editForm.addrState} `;
                if (editForm.addrZip) midLine += ` ${editForm.addrZip} `;
                addressParts.push(midLine);
            }
            addressParts.push(editForm.addrCountry || 'Canada');
            const deliveryAddress = addressParts.join('\n');

            const payload = {
                date: editForm.date,
                deliveryAddress,
                siteContactName: editForm.siteContactName,
                siteContactPhone: editForm.siteContactPhone,
                siteContactEmail: editForm.siteContactEmail,
                status: editForm.status
            };

            const response = await api.put(`/ delivery / notes / ${selectedNote.id} `, payload);
            const updatedNote = response.data;
            setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
            setSelectedNote(null);
        } catch (error) {
            console.error("Failed to update delivery note", error);
            alert("Erreur lors de la mise à jour.");
        }
    };

    const getProjectName = (note: any) => {
        if (note.items && note.items.length > 0) {
            return note.items[0]?.pallet?.workOrder?.quote?.project?.name || '-';
        }
        return '-';
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const code = prompt("Veuillez entrer le code de sécurité pour supprimer :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }

        if (!confirm("Êtes-vous sûr de vouloir supprimer ce Bon de Livraison ? Cette action est irréversible.")) return;

        try {
            await api.delete(`/ delivery / notes / ${id} `);
            setNotes(notes.filter(n => n.id !== id));
        } catch (error) {
            console.error("Delete error", error);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleEditClickIcon = (e: React.MouseEvent, note: any) => {
        e.stopPropagation();
        handleNoteClick(note);
    };


    const [isGenerating, setIsGenerating] = useState(false);


    // Helper for robust downloads
    const downloadFile = (note: any, type: 'pdf' | 'excel') => {
        const token = localStorage.getItem('token');
        if (!token) { alert("Erreur: Token absent !"); return; }

        // Use relative path for maximum compatibility (Tunnel/Railway/Local)
        const apiUrl = '/api';
        const url = `${apiUrl}/delivery/notes/${note.id}/download?type=${type}&token=${token}`;

        console.log(`Downloading ${type}:`, url);

        // "Click" a hidden link - most reliable for multiple files
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleGenerateRak = async () => {
        if (!selectedNote) return;
        const selectedNoteId = selectedNote.id;

        setIsGenerating(true);
        try {
            // 1. Queue request
            await api.get(`/delivery/notes/${selectedNoteId}/rak`);
            // Non-blocking user feedback
            console.log("Demande envoyée à l'Agent. En attente de traitement...");
            pollStatus(selectedNoteId!, selectedNote); // Pass full note object/or fetch it
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.error || e.message || "Erreur inconnue";
            alert(`Erreur lors de la génération: ${msg}`);
            setIsGenerating(false);
        }
    };


    const pollStatus = async (id: string, noteContext: any) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/delivery/notes/${id}/status`);
                if (res.data.status === 'Visualiser' || res.data.status === 'Generated') {
                    clearInterval(interval);
                    // Do NOT clear isGenerating yet. Keep it true until files are downloading.

                    fetchNotes(); // Refresh list to update status in UI

                    // Trigger Downloads
                    const noteObj = { id: id };

                    // 1. Download PDF
                    downloadFile(noteObj, 'pdf');

                    // 2. Download Excel (delayed) & Release UI
                    setTimeout(() => {
                        downloadFile(noteObj, 'excel');
                        setIsGenerating(false); // Enable button only after everything is launched
                    }, 1500);
                }
            } catch (e) {
                console.error("Poll Error", e);
            }
        }, 2000);
    };





    const handleAddPallet = async (e: React.MouseEvent, palletId: string) => {
        e.stopPropagation();
        if (!selectedNote) return;
        try {
            await api.post(`/delivery/notes/${selectedNote.id}/items`, { palletId });
            fetchNotes();
            fetchReadyPallets();
            const updated = await api.get(`/delivery/notes/${selectedNote.id}`);
            setSelectedNote(updated.data);
        } catch (error) {
            console.error("Add Pallet Error", error);
            alert("Erreur lors de l'ajout de la palette.");
        }
    };

    const handleRemovePallet = async (e: React.MouseEvent, palletId: string) => {
        e.stopPropagation();
        if (!selectedNote) return;
        if (!window.confirm("Retirer cette palette du bon de livraison ?")) return;
        try {
            await api.delete(`/delivery/notes/${selectedNote.id}/items/${palletId}`);
            fetchNotes();
            fetchReadyPallets();
            const updated = await api.get(`/delivery/notes/${selectedNote.id}`);
            setSelectedNote(updated.data);
        } catch (error) {
            console.error("Remove Pallet Error", error);
            alert("Erreur lors du retrait de la palette.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-2" />
                    Liste des Bons de Livraison
                </h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
                >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Créer un Bon
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500">Chargement...</div>
            ) : notes.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    Aucun Bon de Livraison généré pour le moment.
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BL</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin Prod</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Livraison</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transport</th>
                                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Poids</th>
                                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pal</th>
                                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 shadow-l">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {notes.map((note) => (
                                <tr
                                    key={note.id}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                    onClick={() => handleNoteClick(note)}
                                >
                                    <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {note.reference}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px]">
                                        <div className="font-medium text-gray-900 truncate" title={note.client?.name || "Client Inconnu"}>
                                            {note.client?.name || "Client Inconnu"}
                                        </div>
                                        <div className="text-xs text-gray-400 capitalize truncate">
                                            {note.deliveryAddress ? "📍 Adresse définie" : "🏢 Adresse Client"}
                                        </div>
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-900 font-medium max-w-[120px] truncate" title={getProjectName(note)}>
                                        {getProjectName(note)}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {note.items?.[0]?.pallet?.workOrder?.deadlineDate ? new Date(note.items[0].pallet.workOrder.deadlineDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(note.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[120px] truncate" title={note.carrier || '-'}>
                                        {note.carrier || '-'}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-bold">
                                        {note.totalWeight.toFixed(0)}
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        {note._count?.items || 0}
                                    </td>

                                    <td className="px-2 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${note.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                            (note.status === 'Validé') ? 'bg-blue-100 text-blue-800' :
                                                (note.status === 'Generated' || note.status === 'Visualiser') ? 'bg-green-100 text-green-800' :
                                                    (note.status === 'Livré' || note.status === 'Shipped') ? 'bg-gray-800 text-white' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {note.status === 'Draft' ? 'En préparation' :
                                                note.status === 'Validé' ? 'Validé' :
                                                    (note.status === 'Livré' || note.status === 'Shipped') ? 'Livré' :
                                                        (note.status === 'Generated' || note.status === 'Visualiser') ? 'Prêt (Généré)' :
                                                            note.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-4 whitespace-nowrap text-right text-sm font-medium sticky right-0 bg-white shadow-l">

                                        <div className="flex justify-end space-x-2">

                                            {/* Manual Downloads (Visible if Generated) */}
                                            {(note.status === 'Generated' || note.status === 'Visualiser') && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(note, 'pdf');
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Télécharger PDF"
                                                    >
                                                        <ArrowDownTrayIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadFile(note, 'excel');
                                                        }}
                                                        className="text-green-600 hover:text-green-900"
                                                        title="Télécharger Excel"
                                                    >
                                                        <TableCellsIcon className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}


                                            <button
                                                onClick={(e) => handleEditClickIcon(e, note)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Modifier / Voir / Régénérer"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, note.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Supprimer (Code requis)"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>


                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATION MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold text-gray-800">Créer un Bon de Livraison</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="space-y-6">
                            {/* Step 1: Select Client */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">1. Choisir le Client</label>
                                <select
                                    className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">-- Sélectionner un client --</option>
                                    {getUniqueClients().map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Field - Move up */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Prévue de Livraison</label>
                                    <input
                                        type="date"
                                        className="rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                                        value={createDate}
                                        onChange={e => setCreateDate(e.target.value)}
                                    />
                                </div>
                                {/* Carrier Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Transporteur</label>
                                    <select
                                        className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={createCarrier}
                                        onChange={e => setCreateCarrier(e.target.value)}
                                    >
                                        <option value="Transport Granite DRC">Transport Granite DRC</option>
                                        <option value="Ramassage Client">Ramassage Client</option>
                                        <option value="Externe">Transporteur Externe</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address Selection */}
                            {selectedClientId && (
                                <div className="bg-gray-50 p-4 rounded border">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse de Livraison</label>
                                    <select
                                        className="w-full rounded border-gray-300 shadow-sm mb-3"
                                        value={createAddressMode}
                                        onChange={e => {
                                            const mode = e.target.value;
                                            setCreateAddressMode(mode);
                                            // Auto-fill contact if existing address
                                            if (mode && mode !== 'new' && mode !== 'default') {
                                                const addr = getSelectedClientAddresses().find((a: any) => a.id === mode);
                                                if (addr) {
                                                    // Attempt to split name
                                                    const parts = (addr.siteContactName || '').split(' ');
                                                    const first = parts[0] || '';
                                                    const last = parts.slice(1).join(' ') || '';

                                                    setCreateContact({
                                                        firstName: first,
                                                        lastName: last,
                                                        role: addr.siteContactRole || '',
                                                        phone: addr.siteContactPhone || '',
                                                        email: addr.siteContactEmail || ''
                                                    });
                                                }
                                            } else if (mode === 'default') {
                                                setCreateContact({ firstName: '', lastName: '', role: '', phone: '', email: '' });
                                            } else if (mode === 'new') {
                                                setCreateContact({ firstName: '', lastName: '', role: '', phone: '', email: '' });
                                            }
                                        }}
                                    >
                                        {/* Default option if exists */}
                                        {getSelectedClientAddresses().length > 0 && <option value="default">Adresse Principale ({getSelectedClientAddresses()[0].line1})</option>}

                                        {/* Other addresses */}
                                        {getSelectedClientAddresses().slice(1).map((a: any) => (
                                            <option key={a.id} value={a.id}>{a.line1}, {a.city}</option>
                                        ))}

                                        <option value="new">+ Nouvelle Adresse (Sauvegarder)</option>
                                    </select>

                                    {/* Display Selected Address Details */}
                                    {createAddressMode !== 'new' && (() => {
                                        const addresses = getSelectedClientAddresses();
                                        if (addresses.length === 0) return null;

                                        const addr = (!createAddressMode || createAddressMode === 'default')
                                            ? addresses[0]
                                            : addresses.find((a: any) => a.id === createAddressMode);

                                        if (addr) {
                                            return (
                                                <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm text-gray-600">
                                                    <p>{addr.line1}</p>
                                                    <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zipCode}</p>
                                                    <p>{addr.country}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* New Address Form */}
                                    {createAddressMode === 'new' && (
                                        <div className="space-y-3 pl-2 border-l-2 border-blue-500">
                                            <input
                                                placeholder="Adresse (Ligne 1)"
                                                className="w-full rounded border-gray-300 text-sm"
                                                value={createNewAddress.line1}
                                                onChange={e => setCreateNewAddress({ ...createNewAddress, line1: e.target.value })}
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    placeholder="Ville"
                                                    className="rounded border-gray-300 text-sm"
                                                    value={createNewAddress.city}
                                                    onChange={e => setCreateNewAddress({ ...createNewAddress, city: e.target.value })}
                                                />
                                                <input
                                                    placeholder="Code Postal"
                                                    className="rounded border-gray-300 text-sm"
                                                    value={createNewAddress.zip}
                                                    onChange={e => setCreateNewAddress({ ...createNewAddress, zip: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <select
                                                    className="rounded border-gray-300 text-sm"
                                                    value={createNewAddress.country}
                                                    onChange={e => setCreateNewAddress({ ...createNewAddress, country: e.target.value, state: '' })}
                                                >
                                                    <option value="Canada">Canada</option>
                                                    <option value="États-Unis">États-Unis</option>
                                                </select>

                                                {createNewAddress.country === 'Canada' ? (
                                                    <select
                                                        className="rounded border-gray-300 text-sm"
                                                        value={createNewAddress.state}
                                                        onChange={e => setCreateNewAddress({ ...createNewAddress, state: e.target.value })}
                                                    >
                                                        <option value="">Province</option>
                                                        {CAN_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <select
                                                        className="rounded border-gray-300 text-sm"
                                                        value={createNewAddress.state}
                                                        onChange={e => setCreateNewAddress({ ...createNewAddress, state: e.target.value })}
                                                    >
                                                        <option value="">État</option>
                                                        {USA_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Site Contact */}
                            {selectedClientId && (
                                <div className="bg-gray-50 p-4 rounded border">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact sur Place</label>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input
                                            placeholder="Prénom"
                                            className="rounded border-gray-300 text-sm"
                                            value={createContact.firstName}
                                            onChange={e => setCreateContact({ ...createContact, firstName: e.target.value })}
                                        />
                                        <input
                                            placeholder="Nom"
                                            className="rounded border-gray-300 text-sm"
                                            value={createContact.lastName}
                                            onChange={e => setCreateContact({ ...createContact, lastName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            placeholder="Fonction"
                                            className="rounded border-gray-300 text-sm"
                                            value={createContact.role}
                                            onChange={e => setCreateContact({ ...createContact, role: e.target.value })}
                                        />
                                        <input
                                            placeholder="Cellulaire"
                                            className="rounded border-gray-300 text-sm"
                                            value={createContact.phone}
                                            onChange={e => setCreateContact({ ...createContact, phone: formatPhoneNumber(e.target.value) })}
                                        />
                                        <input
                                            placeholder="Courriel"
                                            className="rounded border-gray-300 text-sm"
                                            value={createContact.email}
                                            onChange={e => setCreateContact({ ...createContact, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}



                            <div className="flex justify-end pt-4 border-t space-x-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateSubmit}
                                    disabled={!selectedClientId}
                                    className={`px-4 py-2 rounded shadow-sm text-white ${(!selectedClientId) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    Générer le Bon
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT/VIEW MODAL (Existing) */}
            {selectedNote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden" onClick={() => setSelectedNote(null)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto p-6 relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedNote(null)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-1 shadow-sm hover:shadow-md z-10"
                            title="Fermer"
                        >
                            <span className="text-2xl font-bold leading-none">&times;</span>
                        </button>
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Détails & Modification {selectedNote.reference}
                                </h2>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-gray-500 text-sm">Statut:</span>
                                    <select
                                        value={editForm.status}
                                        onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        className="text-sm border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                                    >
                                        <option value="Draft">En préparation</option>
                                        <option value="Validé">Validé</option>
                                        <option value="Livré">Livré</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Informations Générales</h3>
                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-xs text-gray-500">Créé Le / Par</dt>
                                        <dd className="text-sm font-medium text-gray-900">
                                            {new Date(selectedNote.createdAt).toLocaleDateString()}
                                            <br />
                                            <span className="text-blue-600">
                                                {selectedNote.createdBy ? `${selectedNote.createdBy.firstName} ${selectedNote.createdBy.lastName}` : 'Système'}
                                            </span>
                                        </dd>
                                    </div>

                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                        <dt className="text-xs text-gray-500 mb-1">Date Prévue de Livraison</dt>
                                        <dd className="text-sm font-medium text-gray-900">
                                            <input
                                                type="date"
                                                value={editForm.date}
                                                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Projet / Client</dt>
                                        <dd className="text-sm font-medium text-gray-900">
                                            {getProjectName(selectedNote)}
                                            <div className="text-gray-500 font-normal">{selectedNote.client?.name}</div>
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Carte Google Maps</h3>
                                    <div className="rounded border overflow-hidden shadow-sm h-48 bg-gray-100 flex items-center justify-center">
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            style={{ border: 0 }}
                                            src={`https://maps.google.com/maps?q=${encodeURIComponent(getFullAddress())}&t=&z=15&ie=UTF8&iwloc=A&output=embed`}
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getFullAddress())}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center justify-end"
                                        >
                                            <span className="mr-1">🗺️</span> Vérifier sur Google Maps
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Info Client (Bureau)</h3>
                                    <div className="bg-white p-3 rounded border">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Client</label>
                                                <div className="text-sm font-medium">{selectedNote.client?.name}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Contact Principal</label>
                                                <div className="text-sm">{selectedNote.client?.contactName || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Téléphone (Bureau)</label>
                                                <div className="text-sm">{formatPhoneNumber(selectedNote.client?.phone || '') || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Courriel</label>
                                                <a href={`mailto:${selectedNote.client?.email}`} className="text-sm text-blue-600 hover:underline">
                                                    {selectedNote.client?.email || '-'}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Logistique et Contact Chantier</h3>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 p-3 rounded border">
                                            <label className="block text-xs text-gray-500 mb-2 font-bold">Adresse de Livraison</label>
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={editForm.addrLine1}
                                                    onChange={e => setEditForm({ ...editForm, addrLine1: e.target.value })}
                                                    placeholder="Adresse (Ligne 1)"
                                                    className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        type="text"
                                                        value={editForm.addrCity}
                                                        onChange={e => setEditForm({ ...editForm, addrCity: e.target.value })}
                                                        placeholder="Ville"
                                                        className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                    />
                                                    {/* CONDITIONAL PROVINCE SELECT */}
                                                    {editForm.addrCountry === 'Canada' || editForm.addrCountry === 'États-Unis' ? (
                                                        <select
                                                            value={editForm.addrState}
                                                            onChange={e => setEditForm({ ...editForm, addrState: e.target.value })}
                                                            className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                                        >
                                                            <option value="">-- Prov/État --</option>
                                                            {editForm.addrCountry === 'Canada' ? (
                                                                CAN_PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)
                                                            ) : (
                                                                USA_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)
                                                            )}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={editForm.addrState}
                                                            onChange={e => setEditForm({ ...editForm, addrState: e.target.value })}
                                                            placeholder="Prov/État"
                                                            className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={editForm.addrZip}
                                                            onChange={e => setEditForm({ ...editForm, addrZip: formatPostalCode(e.target.value) })}
                                                            placeholder="Code Postal"
                                                            className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const fullAddr = getFullAddress();
                                                                if (!fullAddr) return alert("Adresse vide");
                                                                const zip = await lookupPostalCode(fullAddr);
                                                                if (zip) setEditForm((prev: any) => ({ ...prev, addrZip: zip }));
                                                                else alert("Code postal introuvable pour cette adresse.");
                                                            }}
                                                            className="absolute right-1 top-1 text-gray-400 hover:text-blue-600 p-1"
                                                            title="Trouver le code postal via OpenStreetMap"
                                                        >
                                                            🔍
                                                        </button>
                                                    </div>
                                                    <select
                                                        value={editForm.addrCountry}
                                                        onChange={e => setEditForm({ ...editForm, addrCountry: e.target.value, addrState: '' })}
                                                        onBlur={handleAutoZip}
                                                        className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                                    >
                                                        <option value="Canada">Canada</option>
                                                        <option value="États-Unis">États-Unis</option>
                                                        <option value="Autre">Autre</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Contact Chantier</label>
                                                <input
                                                    type="text"
                                                    value={editForm.siteContactName}
                                                    onChange={e => setEditForm({ ...editForm, siteContactName: e.target.value })}
                                                    placeholder="Nom du contact"
                                                    className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Cellulaire</label>
                                                <input
                                                    type="text"
                                                    value={editForm.siteContactPhone}
                                                    onChange={e => setEditForm({ ...editForm, siteContactPhone: formatPhoneNumber(e.target.value) })}
                                                    placeholder="+1 (xxx) xxx-xxxx"
                                                    className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">Courriel</label>
                                                <input
                                                    type="email"
                                                    value={editForm.siteContactEmail}
                                                    onChange={e => setEditForm({ ...editForm, siteContactEmail: e.target.value })}
                                                    placeholder="Courriel"
                                                    className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pallet Details Section */}
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                                <span>Détails du Chargement</span>
                                <span className="text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
                                    Total: <span className="font-bold text-base">{selectedNote.totalWeight?.toFixed(0)}</span> lbs
                                </span>
                            </h3>
                            <div className="bg-gray-50 rounded border overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Palette #</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Commande / Projet</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contenu</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Poids (lbs)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {selectedNote.items && selectedNote.items.map((item: any) => (
                                            <React.Fragment key={item.id}>
                                                <tr
                                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                                    onClick={() => setExpandedPalletId(expandedPalletId === item.palletId ? null : item.palletId)}
                                                >
                                                    <td className="px-4 py-2">
                                                        {selectedNote.status === 'Draft' && (
                                                            <button
                                                                onClick={(e) => handleRemovePallet(e, item.palletId)}
                                                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                                title="Retirer du bon"
                                                            >
                                                                <MinusCircleIcon className="h-6 w-6" />
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                                        P#{item.pallet?.number?.toString().padStart(2, '0') || '??'}
                                                        <span className="text-gray-400 text-xs ml-1">({item.pallet?.barcode})</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">
                                                        {item.pallet?.workOrder?.orderNumber} <br />
                                                        <span className="text-xs text-gray-400">{item.pallet?.workOrder?.quote?.project?.name}</span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-500">
                                                        {item.pallet?.items?.length || 0} morceaux
                                                        <span className="text-xs text-blue-600 block">
                                                            {expandedPalletId === item.palletId ? 'Masquer détails' : 'Voir détails'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium whitespace-nowrap">
                                                        {item.pallet?.items?.reduce((sum: number, pi: any) => sum + (((pi.quoteItem?.totalWeight || 0) / (pi.quoteItem?.quantity || 1)) * (pi.quantity || 0)), 0).toLocaleString('fr-CA', { maximumFractionDigits: 1 })} lbs
                                                    </td>
                                                </tr>
                                                {expandedPalletId === item.palletId && (
                                                    <tr>
                                                        <td colSpan={5} className="bg-gray-50 px-4 py-3 border-t border-b">
                                                            <div className="grid grid-cols-1 gap-1 pl-4 border-l-4 border-blue-200">
                                                                {item.pallet?.items?.map((pi: any, idx: number) => (
                                                                    <div key={idx} className="text-sm text-gray-700 flex items-center">
                                                                        <span className="font-mono font-bold text-gray-600 mr-2 w-8">#{pi.quoteItem?.lineNo || '-'}</span>
                                                                        <span className="text-blue-800 font-semibold mr-2 w-12">[{pi.quoteItem?.tag || '-'}]</span>
                                                                        <span className="text-gray-500 mr-2 w-20">{pi.quoteItem?.refReference || '-'}</span>
                                                                        <span className="font-bold text-black mr-2">x{pi.quantity}</span>
                                                                        <span>{pi.quoteItem?.description || pi.quoteItem?.product}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Available Pallets Section (For Draft Notes) */}
                        {selectedNote.status === 'Draft' && (
                            <div className="mb-6 opacity-75 hover:opacity-100 transition-opacity">
                                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <span>📥 Palettes Validées Disponibles</span>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                        {readyPallets.filter(p => p.workOrder?.quote?.client?.id === selectedNote.clientId).length}
                                    </span>
                                </h3>
                                <div className="bg-green-50 rounded border border-green-200 overflow-hidden">
                                    {readyPallets.filter(p => p.workOrder?.quote?.client?.id === selectedNote.clientId).length > 0 ? (
                                        <table className="min-w-full divide-y divide-green-200">
                                            <thead className="bg-green-100/50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase w-10"></th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase">Palette #</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase">Commande / Projet</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-green-800 uppercase">Contenu</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-green-800 uppercase">Poids</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-green-200">
                                                {readyPallets
                                                    .filter(p => p.workOrder?.quote?.client?.id === selectedNote.clientId)
                                                    .map((pallet: any) => (
                                                        <tr key={pallet.id} className="hover:bg-green-100 cursor-pointer">
                                                            <td className="px-4 py-2">
                                                                <button
                                                                    onClick={(e) => handleAddPallet(e, pallet.id)}
                                                                    className="text-green-600 hover:text-green-800 transition-colors"
                                                                    title="Ajouter au Bon"
                                                                >
                                                                    <PlusCircleIcon className="h-6 w-6" />
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm font-bold text-gray-900">

                                                                P#{pallet.number?.toString().padStart(2, '0')}
                                                                <span className="text-gray-400 text-xs ml-1 font-normal">({pallet.barcode})</span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pallet.workOrder?.orderNumber}
                                                                <br />
                                                                <span className="text-xs text-gray-500">{pallet.workOrder?.quote?.project?.name}</span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-700">
                                                                {pallet.items?.length || 0} morceaux
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                {pallet.items?.reduce((sum: number, i: any) => sum + (i.quoteItem?.totalWeight || 0), 0).toFixed(1)} lbs
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-4 text-sm text-green-800 italic text-center">Aucune autre palette validée disponible pour ce client.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t space-x-3">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50"
                            >
                                Fermer
                            </button>
                            <button
                                onClick={handleGenerateRak}
                                disabled={isGenerating}
                                className={`px-4 py-2 rounded shadow-sm font-medium transition-colors ${isGenerating
                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                            >
                                {isGenerating ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Patientez...
                                    </span>
                                ) : "Générer un BL"}
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryNoteList;
