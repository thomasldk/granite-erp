
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DocumentTextIcon, PlusIcon, PencilSquareIcon, TrashIcon, PlusCircleIcon, MinusCircleIcon, ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
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
        status: '',
        freightCost: 0
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

    // Email State
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
    const [emailCc, setEmailCc] = useState<string[]>([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [expandedPalletId, setExpandedPalletId] = useState<string | null>(null);
    const [originalForm, setOriginalForm] = useState<any>(null);

    useEffect(() => {
        fetchNotes();
        fetchReadyPallets();
    }, []);

    // Reset when modal opens
    useEffect(() => {
        if (!isEmailModalOpen) {
            setEmailRecipients([]);
            setEmailCc([]);
            setEmailMessage('');
            setEmailSubject('');
        }
    }, [isEmailModalOpen]);

    const handleEmitBL = () => {
        if (!selectedNote) return;

        const toSet = new Set<string>();
        const ccSet = new Set<string>();

        // 1. TO: Project Manager (Chef de projet) from Work Orders
        // 2 TO: Also Site Contact? User usually puts site contact in TO if specific to delivery
        if (selectedNote.siteContactEmail) toSet.add(selectedNote.siteContactEmail);

        // Traverse Items -> Pallet -> WorkOrder
        selectedNote.items?.forEach((item: any) => {
            const wo = item.pallet?.workOrder;
            if (wo) {
                // Project Manager -> TO
                if (wo.projectManager?.email) toSet.add(wo.projectManager.email);

                // Accountant -> TO (User wants both recipients checked by default in the Destinataires list)
                if (wo.accountingContact?.email) toSet.add(wo.accountingContact.email);

                // Additional Contacts -> CC
                wo.additionalContacts?.forEach((ac: any) => {
                    if (ac.contact?.email) ccSet.add(ac.contact.email);
                });

                // Rep -> CC
                if (wo.quote?.representative?.email) ccSet.add(wo.quote.representative.email);
                // Fallbox: if Rep name matches a user? Hard to map perfectly without relation.
            }
        });

        // 3. User & Creator -> CC
        // Current User (todo: get from context if available, otherwise skip)
        // Creator
        if (selectedNote.createdBy?.email) ccSet.add(selectedNote.createdBy.email);

        // Set State
        setEmailRecipients(Array.from(toSet));
        setEmailCc(Array.from(ccSet));

        // Language Logic
        const isEnglish = selectedNote.client?.language === 'Anglais' || selectedNote.client?.language === 'English';

        // Extract Project & PO
        let projectName = '';
        let poNumber = '';
        for (const item of (selectedNote.items || [])) {
            const wo = item.pallet?.workOrder;
            if (wo) {
                if (wo.quote?.project?.name && !projectName) projectName = wo.quote.project.name;
                if (wo.clientPO && !poNumber) poNumber = wo.clientPO;
                if (projectName && poNumber) break;
            }
        }

        if (isEnglish) {
            const projectSubject = projectName ? ` / ${projectName}` : '';
            const projectBody = projectName ? ` regarding Project ${projectName}` : '';
            const poBody = poNumber ? ` related to your purchase order ${poNumber}` : ` related to your purchase order`;

            setEmailSubject(`${selectedNote.reference}${projectSubject}`);
            setEmailMessage(`Hello,\n\nPlease find attached the delivery note ${selectedNote.reference}${projectBody}${poBody}.\n\nBest regards,\nGranite DRC Team`);
        } else {
            const projectSubject = projectName ? ` / ${projectName}` : '';
            const projectBody = projectName ? ` concernant le Projet ${projectName}` : '';
            const poBody = poNumber ? ` en lien avec votre bon de commande ${poNumber}` : ` en lien avec votre bon de commande`;

            setEmailSubject(`${selectedNote.reference}${projectSubject}`);
            setEmailMessage(`Bonjour,\n\nVeuillez trouver ci-joint le bon de livraison ${selectedNote.reference}${projectBody}${poBody}.\n\nCordialement,\nL'équipe Granite DRC`);
        }

        setIsEmailModalOpen(true);
    };

    const handleSendEmail = async () => {
        if (!selectedNote || emailRecipients.length === 0) return;

        // Find Client PO Path if available (First one found)
        let clientPOFilePath: string | undefined;
        for (const item of (selectedNote.items || [])) {
            if (item.pallet?.workOrder?.clientPOFilePath) {
                clientPOFilePath = item.pallet.workOrder.clientPOFilePath;
                break;
            }
        }

        setIsSendingEmail(true);
        try {
            await api.post(`/delivery/notes/${selectedNote.id}/email`, {
                recipients: emailRecipients,
                cc: emailCc,
                message: emailMessage,
                subject: emailSubject,
                clientPOFilePath // Send path to backend
            });
            alert("Courriel envoyé avec succès !");
            setIsEmailModalOpen(false);
        } catch (error: any) {
            console.error("Email Error", error);
            const msg = error.response?.data?.details?.message || error.response?.data?.error || error.message || 'Erreur inconnue';
            alert(`Erreur lors de l'envoi du courriel: ${msg}`);
        } finally {
            setIsSendingEmail(false);
        }
    };

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

    // Helper to parse address string back to components
    const parseAddressString = (fullAddr: string) => {
        const lines = fullAddr.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        let line1 = lines[0] || '';
        let city = '';
        let state = '';
        let zip = '';
        let country = 'Canada';

        if (lines.length > 0) {
            const last = lines[lines.length - 1].toLowerCase();
            if (last.includes('usa') || last.includes('us') || last.includes('états')) country = 'États-Unis';
        }

        // Try to parse City, State Zip
        if (lines.length >= 3) {
            // Line 2 is likely City, State Zip
            const mid = lines[lines.length - 2];
            // Start simple
            const parts = mid.split(',');
            if (parts.length > 0) city = parts[0].trim();
            if (parts.length > 1) {
                // State Zip
                const sz = parts[1].trim();
                // try to split by space
                const lastSpace = sz.lastIndexOf(' ');
                if (lastSpace !== -1) {
                    state = sz.substring(0, lastSpace).trim();
                    zip = sz.substring(lastSpace + 1).trim();
                } else {
                    state = sz;
                }
            }
        } else if (lines.length === 2 && !lines[1].toLowerCase().includes('canada')) {
            // Maybe line 2 is city
            city = lines[1];
        }

        return { line1, city, state, zip, country };
    };

    // Auto-Fill Project Defaults
    useEffect(() => {
        if (selectedPalletIds.length > 0 && readyPallets.length > 0) {
            // Find unique project from selected pallets
            const selectedPallets = readyPallets.filter(p => selectedPalletIds.includes(p.id));
            const distinctProjects = new Set();
            let targetProject: any = null;

            selectedPallets.forEach(p => {
                // Access via pallet->item->quoteItem->quote->project
                // Backup path if structure differs: p.workOrder.quote.project ?
                // Checking usage in other parts: p.workOrder?.quote?.project
                const projFromWO = p.workOrder?.quote?.project;

                if (projFromWO) {
                    distinctProjects.add(projFromWO.id);
                    targetProject = projFromWO;
                }
            });

            // If exactly one project is involved and we haven't manually set address/contact yet
            if (distinctProjects.size === 1 && targetProject) {
                // Check if we have defaults
                if (targetProject.defaultDeliveryAddress || targetProject.siteContactName) {
                    console.log("Found Project Defaults:", targetProject);

                    // Only overwrite if form is "pristine" or we decide to force?
                    // Let's overwrite only if empty to be safe, OR just do it because user just selected pallets.
                    // User selection implies intent.

                    if (targetProject.siteContactName) {
                        const parts = (targetProject.siteContactName || '').split(' ');
                        setCreateContact({
                            firstName: parts[0] || '',
                            lastName: parts.slice(1).join(' ') || '',
                            phone: targetProject.siteContactPhone || '',
                            email: targetProject.siteContactEmail || '',
                            role: targetProject.siteContactRole || ''
                        });
                    }

                    if (targetProject.defaultDeliveryAddress) {
                        const parsed = parseAddressString(targetProject.defaultDeliveryAddress);
                        setCreateNewAddress({
                            line1: parsed.line1,
                            city: parsed.city,
                            state: parsed.state,
                            zip: parsed.zip,
                            country: parsed.country
                        });
                        setCreateAddressMode('new'); // Switch to "New Address" mode to show the pre-filled fields
                    }
                }
            }
        }
    }, [selectedPalletIds, readyPallets]);

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
        fetchReadyPallets(); // Refresh available pallets ensures we see recently released ones
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

        const newForm = {
            date: dateStr,
            addrLine1,
            addrCity,
            addrState,
            addrZip,
            addrCountry,
            siteContactName: note.siteContactName || '',
            siteContactPhone: formatPhoneNumber(note.siteContactPhone || ''),
            siteContactEmail: note.siteContactEmail || '',
            status: note.status || 'Draft',
            carrier: note.carrier || '', // Ensure carrier is tracked
            freightCost: note.freightCost || 0
        };

        setEditForm(newForm);
        setOriginalForm(newForm); // Snapshot for dirty check
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

    const handleSave = async (shouldClose = true) => {
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
                status: editForm.status,
                freightCost: editForm.freightCost
            };

            const response = await api.put(`/delivery/notes/${selectedNote.id}`, payload);
            const updatedNote = response.data;
            setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));

            // Fix: Update selectedNote so we don't have stale state, and optionally close
            // Fix: Update selectedNote so we don't have stale state, and optionally close
            setSelectedNote(updatedNote);
            setOriginalForm(editForm); // Update snapshot
            if (shouldClose) setSelectedNote(null);

            return true;

        } catch (error) {
            console.error("Failed to update delivery note", error);
            alert("Erreur lors de la mise à jour.");
            return false;
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
            await api.delete(`/delivery/notes/${id}`);
            setNotes(notes.filter(n => n.id !== id));
            fetchReadyPallets(); // Refresh available pallets
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

        // Reconstruct address for comparison
        let addressParts = [editForm.addrLine1];
        if (editForm.addrCity || editForm.addrState || editForm.addrZip) {
            let midLine = editForm.addrCity;
            if (editForm.addrState) midLine += `, ${editForm.addrState} `;
            if (editForm.addrZip) midLine += ` ${editForm.addrZip} `;
            addressParts.push(midLine);
        }
        addressParts.push(editForm.addrCountry || 'Canada');

        // Check for unsaved changes
        // Robust Dirty Check using JSON comparison
        // We need to ensure editForm has keys in same order or just compare values that matter
        // But JSON.stringify is usually good enough if we don't mutate object structure randomly
        const hasChanges = JSON.stringify(editForm) !== JSON.stringify(originalForm);

        if (hasChanges) {
            if (window.confirm("Des modifications non enregistrées ont été détectées. Voulez-vous les sauvegarder ?")) {
                await handleSave(false); // Save but DO NOT CLOSE
                return; // Stop here. User will click generate again.
            } else {
                return; // Cancel generation
            }
        }

        const selectedNoteId = selectedNote.id;

        setIsGenerating(true);
        try {
            // 1. Queue request
            await api.get(`/delivery/notes/${selectedNoteId}/rak`);
            // Non-blocking user feedback
            console.log("Demande envoyée à l'Agent. En attente de traitement...");
            pollStatus(selectedNoteId!); // Pass full note object/or fetch it
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.error || e.message || "Erreur inconnue";
            alert(`Erreur lors de la génération: ${msg}`);
            setIsGenerating(false);
        }
    };


    const pollStatus = async (id: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get(`/delivery/notes/${id}/status`);
                if (res.data.status === 'Visualiser' || res.data.status === 'Generated') {
                    clearInterval(interval);
                    // Do NOT clear isGenerating yet. 

                    fetchNotes();

                    // UPDATE MODAL STATE TO REFLECT NEW STATUS IMMEDIATELY
                    setSelectedNote((prev: any) => prev && prev.id === id ? { ...prev, status: res.data.status } : prev);

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
                                            (note.status === 'Livré' || note.status === 'Shipped') ? 'bg-gray-800 text-white' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {note.status === 'Draft' ? 'Brouillon' :
                                                (note.status === 'Livré' || note.status === 'Shipped') ? 'Émis' :
                                                    'Visualisé'}
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
                            <div className="flex items-center gap-4">
                                <img src="/logo.jpg" alt="Logo" className="h-14 w-auto object-contain" />
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Détails & Modification {selectedNote.reference}
                                    </h2>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="text-gray-500 text-sm">Statut:</span>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedNote.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                            (selectedNote.status === 'Livré' || selectedNote.status === 'Shipped') ? 'bg-gray-800 text-white' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {selectedNote.status === 'Draft' ? 'Brouillon' :
                                                (selectedNote.status === 'Livré' || selectedNote.status === 'Shipped') ? 'Émis' :
                                                    'Visualisé'}
                                        </span>
                                    </div>
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
                                            <div className="mt-1">
                                                <div className="font-medium text-blue-600">
                                                    {selectedNote.createdBy ? `${selectedNote.createdBy.firstName} ${selectedNote.createdBy.lastName}` : 'Système'}
                                                </div>
                                                {selectedNote.createdBy && (
                                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400 min-w-[30px]">Login</span>
                                                            <span className="font-mono text-gray-600">{selectedNote.createdBy.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-gray-400 min-w-[30px]">Rôle</span>
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide border border-gray-200">
                                                                {selectedNote.createdBy.role || 'USER'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
                                            {selectedNote.client?.customsBroker && (
                                                <div className="text-xs text-blue-600 mt-1">
                                                    <span className="font-semibold">Courtier:</span> {selectedNote.client.customsBroker.name}
                                                </div>
                                            )}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500 mb-1">Frais de transport ($)</dt>
                                        <dd className="text-sm font-medium text-gray-900">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editForm.freightCost}
                                                onChange={e => setEditForm({ ...editForm, freightCost: parseFloat(e.target.value) || 0 })}
                                                className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500 mb-1">Frais de courtage ($)</dt>
                                        <dd className="text-sm font-medium text-gray-900">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editForm.customsBrokerFee || 0}
                                                onChange={e => setEditForm({ ...editForm, customsBrokerFee: parseFloat(e.target.value) || 0 })}
                                                className="w-full rounded border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            {selectedNote.client?.customsBrokerFee ? (
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Défaut client: {selectedNote.client.customsBrokerFee} $
                                                </p>
                                            ) : null}
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
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {(() => {
                                                        // Find Office Address
                                                        const addr = selectedNote.client?.addresses?.find((a: any) => a.type === 'Office' || a.type === 'Bureau' || a.type === 'Main') || selectedNote.client?.addresses?.[0];
                                                        if (!addr) return <span className="text-red-500">Adresse introuvable</span>; // Debug fallback
                                                        return (
                                                            <>
                                                                <div>{addr.line1}</div>
                                                                <div>{addr.city}, {addr.state} {addr.zipCode}</div>
                                                                <div>{addr.country}</div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Contact Principal</label>
                                                <div className="text-sm">
                                                    {(() => {
                                                        const quoteContact = selectedNote.items?.[0]?.pallet?.workOrder?.quote?.contact;
                                                        if (quoteContact) return `${quoteContact.firstName} ${quoteContact.lastName}`;
                                                        return selectedNote.client?.contactName || '-';
                                                    })()}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Téléphone (Bureau)</label>
                                                <div className="text-sm">
                                                    {(() => {
                                                        const quoteContact = selectedNote.items?.[0]?.pallet?.workOrder?.quote?.contact;
                                                        const phone = quoteContact ? (quoteContact.phone || quoteContact.mobile) : selectedNote.client?.phone;
                                                        return formatPhoneNumber(phone || '') || '-';
                                                    })()}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 font-bold">Courriel</label>
                                                {(() => {
                                                    const quoteContact = selectedNote.items?.[0]?.pallet?.workOrder?.quote?.contact;
                                                    const email = quoteContact ? quoteContact.email : selectedNote.client?.email;
                                                    return (
                                                        <a href={`mailto:${email}`} className="text-sm text-blue-600 hover:underline">
                                                            {email || '-'}
                                                        </a>
                                                    );
                                                })()}
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
                                    Total: <span className="font-bold text-base">
                                        {selectedNote.items?.reduce((total: number, item: any) =>
                                            total + (item.pallet?.items?.reduce((pSum: number, pi: any) =>
                                                pSum + (((pi.quoteItem?.totalWeight || 0) / (pi.quoteItem?.quantity || 1)) * (pi.quantity || 0)), 0) || 0), 0
                                        ).toFixed(0)}
                                    </span> lbs
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
                                                        {selectedNote.status !== 'Livré' && selectedNote.status !== 'Shipped' && (
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

                        {/* Available Pallets Section (Editable if not Shipped) */}
                        {selectedNote.status !== 'Livré' && selectedNote.status !== 'Shipped' && (
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
                                type="button"
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
                                type="button"
                                onClick={handleEmitBL}
                                disabled={selectedNote.status !== 'Generated' || !selectedNote.pdfFilePath}
                                className={`px-4 py-2 rounded shadow-sm font-medium transition-colors ${selectedNote.status !== 'Generated' || !selectedNote.pdfFilePath
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                    }`}
                            >
                                Émettre BL
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSave(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EMAIL MODAL */}
            {isEmailModalOpen && selectedNote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-xl font-bold text-gray-800">Envoyer le Bon de Livraison par courriel</h2>
                            <button onClick={() => setIsEmailModalOpen(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                                Le fichier PDF <strong>BL-{selectedNote.reference}.pdf</strong> sera joint automatiquement.
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                                    {/* Client Contacts */}
                                    {selectedNote.client?.contacts && selectedNote.client.contacts.map((c: any) => (
                                        <label key={c.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={emailRecipients.includes(c.email)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setEmailRecipients([...emailRecipients, c.email]);
                                                    else setEmailRecipients(emailRecipients.filter(r => r !== c.email));
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{c.firstName} {c.lastName}</div>
                                                <div className="text-gray-500 text-xs">{c.role} - {c.email}</div>
                                            </div>
                                        </label>
                                    ))}

                                    {/* Site Contact (if explicitly on Note) */}
                                    {selectedNote.siteContactEmail && (
                                        <label className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded border-t mt-1 pt-1">
                                            <input
                                                type="checkbox"
                                                checked={emailRecipients.includes(selectedNote.siteContactEmail)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setEmailRecipients([...emailRecipients, selectedNote.siteContactEmail]);
                                                    else setEmailRecipients(emailRecipients.filter(r => r !== selectedNote.siteContactEmail));
                                                }}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{selectedNote.siteContactName || 'Contact Chantier'}</div>
                                                <div className="text-gray-500 text-xs">Site Contact - {selectedNote.siteContactEmail}</div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Manual Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter un email externe (CC)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="autrep@example.com"
                                        className="flex-1 rounded border-gray-300 text-sm"
                                        id="manualEmailInput"
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('manualEmailInput') as HTMLInputElement;
                                            if (input && input.value && input.value.includes('@')) {
                                                setEmailCc([...emailCc, input.value]);
                                                input.value = '';
                                            }
                                        }}
                                        className="bg-gray-100 border px-3 rounded text-xs hover:bg-gray-200"
                                    >
                                        Ajouter en CC
                                    </button>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                <input
                                    type="text"
                                    className="w-full rounded border-gray-300 text-sm font-bold"
                                    value={emailSubject}
                                    onChange={e => setEmailSubject(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea
                                    className="w-full rounded border-gray-300 text-sm"
                                    rows={5}
                                    value={emailMessage}
                                    onChange={e => setEmailMessage(e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="flex justify-end pt-4 border-t space-x-3 mt-4">
                            <button
                                onClick={() => setIsEmailModalOpen(false)}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded shadow-sm hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={(emailRecipients.length === 0 && emailCc.length === 0) || isSendingEmail}
                                className={`px-4 py-2 rounded shadow-sm text-white ${(emailRecipients.length === 0 && emailCc.length === 0) || isSendingEmail ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isSendingEmail ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeliveryNoteList;
