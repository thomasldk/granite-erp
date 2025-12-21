import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMaterials, Material } from '../../services/catalogueService';
import { generatePaymentTermLabel } from '../../services/paymentTermService';
import { getCurrencies } from '../../services/thirdPartyService'; // Import
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { RevisionModal } from '../../components/RevisionModal';
import { useLocation } from 'react-router-dom';

export default function QuoteForm() {
    const { id, projectId } = useParams(); // Need to ensure route captures projectId
    const navigate = useNavigate();
    const isNew = !id;

    const [formData, setFormData] = useState({
        reference: '',
        thirdPartyId: '',
        projectId: projectId || '', // Pre-fill from URL
        status: 'Draft', // Default status for new quote is Draft (Active)
        dateIssued: new Date().toISOString().split('T')[0],
        estimatedWeeks: '' as any,
        exchangeRate: 1.0, // Taux de change default
        incoterm: '', // Incoterm default
        incotermId: '', // Added for dynamic incoterms
        incotermCustomText: '', // Added for custom incoterms
        currency: 'CAD', // Default currency
        items: [] as any[],
        materialId: '',
        representativeId: '',
        contactId: '',
        projectNumberOfLines: '' as any,
        tempMaterialName: '' as any,
        paymentTermId: '', // For payment snapshot
        paymentDays: '' as any,
        depositPercentage: '' as any,
        discountPercentage: '' as any,
        discountDays: '' as any,
        paymentCustomText: '',
        validityDuration: '' as any,
        // New V8 Fields
        semiStandardRate: '' as any,
        salesCurrency: 'CAD',
        palletPrice: '' as any,
        palletRequired: false,
        pdfPath: '',
        syncStatus: '', // For tracking agent status
        project: null as any // Fix: Allow access to nested project fields
    });

    // Status Logic: Active (Draft) -> Emise (Sent)
    // ReadOnly if not Draft
    // Note: formData.status gets updated by fetchQuote
    const isReadOnly = !isNew && formData.status !== 'Draft';

    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [incoterms, setIncoterms] = useState<any[]>([]); // New State
    const [representatives, setRepresentatives] = useState<any[]>([]);
    const [paymentTerms, setPaymentTerms] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]); // New State
    const [loading, setLoading] = useState(!isNew);
    const [activeAction, setActiveAction] = useState<string | null>(null);

    // Emit Modal State
    const [showEmitModal, setShowEmitModal] = useState(false);
    const [emailBody, setEmailBody] = useState('');
    const [emailSubject, setEmailSubject] = useState(''); // NEW: Subject State
    const [emailDetails, setEmailDetails] = useState({ to: '', cc: '' });

    // Duplicate Modal State
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateClientId, setDuplicateClientId] = useState('');
    const [duplicateContactId, setDuplicateContactId] = useState('');

    // Revision Modal State
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [pdfAvailable, setPdfAvailable] = useState(false);
    const [isDirty, setIsDirty] = useState(false); // Track unsaved changes

    // Helper to update form data and mark as dirty
    const updateFormData = (patch: Partial<typeof formData> | ((prev: typeof formData) => typeof formData)) => {
        setFormData(patch as any);
        setIsDirty(true);
    };

    // NEW: Check PDF Availability on Load
    useEffect(() => {
        if (id) {
            checkPdfAvailability();
        }
    }, [id]);

    const checkPdfAvailability = async () => {
        if (!id) return;
        try {
            // We use the download endpoint directly to check existence
            // HEAD request might be blocked by CORS if not configured, but let's try GET or HEAD via API proxy?
            // Actually, simply HEADing the URL via api instance (which adds auth headers if needed) is best.
            await api.head(`/quotes/${id}/download-pdf`);
            setPdfAvailable(true);
        } catch (e) {
            setPdfAvailable(false);
        }
    };

    const handlePdfGeneration = async () => {
        if (!id) return;
        setIsPdfGenerating(true);
        try {
            await api.post(`/quotes/${id}/generate-pdf`);
            // console.log("PDF request sent");

            // 2. Poll for Completion
            const pollInterval = setInterval(async () => {
                try {
                    const pollRes = await api.get(`/quotes/${id}?t=${Date.now()}`);
                    const updatedPdfPath = pollRes.data.pdfFilePath;

                    if (updatedPdfPath && updatedPdfPath.length > 5) {
                        clearInterval(pollInterval);
                        setIsPdfGenerating(false);
                        setFormData(prev => ({ ...prev, pdfPath: updatedPdfPath }));
                        setPdfAvailable(true);
                    }
                } catch (e) {
                    console.error("Polling Error", e);
                }
            }, 3000);

            // Timeout after 5 mins
            setTimeout(() => {
                if (isPdfGenerating) {
                    clearInterval(pollInterval);
                    setIsPdfGenerating(false);
                }
            }, 300000);

        } catch (error) {
            console.error("PDF Gen Error", error);
            setIsPdfGenerating(false);
            alert("Erreur lors de la demande PDF.");
        }
    };
    const location = useLocation();

    // Poll for Revision Completion
    useEffect(() => {
        if (location.state?.pollingFor === 'REVISION') {
            setActiveAction('REVISION_POLL');
            const pollInterval = setInterval(async () => {
                try {
                    const res = await api.get(`/quotes/${id}`);
                    const status = res.data.syncStatus;


                    // If Agent returned 'Calculated (Agent)' OR 'Synced', we are good.
                    if (status === 'Calculated (Agent)' || status === 'Synced' || status === 'SYNCED_PC') {
                        clearInterval(pollInterval);

                        // 1. Unblock UI immediately
                        setActiveAction(null);

                        // 2. Refresh Data
                        fetchQuote();

                        // 3. Clear location state to stop re-polling on refresh
                        window.history.replaceState({}, document.title);

                        // 4. Auto-Download the Result (Same as Generate)
                        try {
                            const response = await api.get(`/quotes/${id}/download-result?t=${Date.now()}`, { responseType: 'blob' });
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;

                            // Detect Filename from Header
                            const disposition = response.headers['content-disposition'];
                            let fileName = `revision_${id}.xlsx`;
                            if (disposition && disposition.indexOf('attachment') !== -1) {
                                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                const matches = filenameRegex.exec(disposition);
                                if (matches != null && matches[1]) {
                                    fileName = matches[1].replace(/['"]/g, '');
                                }
                            }

                            link.setAttribute('download', fileName);
                            document.body.appendChild(link);
                            link.click();
                            link.remove();
                        } catch (err) {
                            console.error("Auto-download for revision failed", err);
                            // Non-blocking error, user can still manually download if needed
                        }
                    } else if (status === 'ERROR_AGENT') {
                        clearInterval(pollInterval);
                        setActiveAction(null);
                        alert("Erreur Agent lors de la révision.");
                    }
                } catch (e) {
                    // console.error(e);
                }
            }, 2000);
            return () => clearInterval(pollInterval);
        }
    }, [location.state, id]);

    const handleRevisionConfirm = async (revValues: any) => {
        try {
            setActiveAction('REVISING');
            const res = await api.post(`/quotes/${id}/revise`, revValues);
            setShowRevisionModal(false);

            // Redirect to new quote with Auto-Poll flag
            navigate(`/quotes/${res.data.id}`, { state: { pollingFor: 'REVISION' } });

        } catch (error: any) {
            console.error("Revision Error", error);
            alert("Erreur lors de la révision: " + (error.response?.data?.error || error.message));
            setActiveAction(null);
        }
    };


    // Existing fetch effects
    useEffect(() => {
        fetchClients();
        fetchProjects();
        fetchMaterials();
        fetchIncoterms();
        fetchIncoterms();
        fetchRepresentatives();
        fetchPaymentTerms();
        fetchCurrencies();
        if (!isNew) {
            fetchQuote();
        } else {
            // Try to extract projectId from URL (e.g. /soumissions/123/new-quote)
            const pathParts = window.location.pathname.split('/');
            const potentialProjectId = pathParts[2];

            if (potentialProjectId && potentialProjectId !== 'new-quote') {
                api.get('/quotes/next-reference', { params: { projectId: potentialProjectId } })
                    .then(res => {
                        setFormData(prev => ({ ...prev, reference: res.data.reference }));
                    })
                    .catch(err => console.error("Error fetching next reference:", err));
            }
        }
    }, [id]);

    // NEW: Auto-Polling for "Live" updates (Every 5 seconds)
    // NEW: Auto-Polling for "Live" updates (Every 5 seconds) - SMART POLLING
    useEffect(() => {
        if (isNew) return; // Don't poll if creating

        const interval = setInterval(async () => {
            // Only poll if tab is visible to save resources
            if (!document.hidden) {
                try {
                    // Smart Poll: Only fetch status first to avoid overwriting user input
                    const res = await api.get(`/quotes/${id}?fields=syncStatus`);
                    // If status changed (e.g. from Sent -> Synced), THEN refresh full data
                    // Or if we are in a "waiting" state like REVISION_POLL
                    if (res.data.syncStatus !== formData.syncStatus) {
                        console.log("Status changed, refreshing quote...");
                        fetchQuote();
                    }
                } catch (e) { console.error("Poll Error", e); }
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isNew, id, formData.syncStatus]); // Re-run if ID or status changes

    // NEW: Auto-Populate Items based on Project Number of Lines (If New Quote)
    useEffect(() => {
        if (isNew && formData.projectId && projects.length > 0 && formData.items.length === 0) {
            const project = projects.find(p => p.id === formData.projectId);
            if (project && project.numberOfLines > 0) {
                const count = project.numberOfLines;
                const newItems = Array.from({ length: count }).map((_, i) => ({
                    lineNo: i + 1,
                    description: '', // Or default material name?
                    quantity: 0,
                    unit: 'm2',
                    length: 0,
                    width: 0,
                    thickness: 0,
                    material: '',
                    finish: ''
                }));
                // Preserve material choice if set
                if (formData.materialId) {
                    const mat = materials.find(m => m.id === formData.materialId);
                    if (mat) {
                        newItems.forEach(item => {
                            item.material = mat.name;
                            item.description = mat.name; // User likely wants this
                        });
                    }
                }
                setFormData(prev => ({
                    ...prev,
                    items: newItems,
                    projectNumberOfLines: project.numberOfLines // Pre-fill the input field
                }));
            }
        }
    }, [isNew, formData.projectId, projects, materials, formData.materialId]); // Added materials dependency to fill names if possible

    const fetchClients = async () => {
        try {
            const res = await api.get('/third-parties?type=Client');
            setClients(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchProjects = async () => {
        try {
            const res = await api.get('/soumissions');
            setProjects(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchMaterials = async () => {
        try {
            const data = await getMaterials();
            setMaterials(data);
        } catch (e) { console.error(e); }
    };

    const fetchIncoterms = async () => {
        try {
            const res = await api.get('/incoterms');
            setIncoterms(res.data);
        } catch (e) {
            console.error("Failed to fetch incoterms", e);
            setIncoterms([]);
        }
    };

    const fetchRepresentatives = async () => {
        try {
            const res = await api.get('/representatives');
            setRepresentatives(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchPaymentTerms = async () => {
        try {
            const res = await api.get('/payment-terms');
            setPaymentTerms(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchCurrencies = async () => {
        try {
            const data = await getCurrencies();
            setCurrencies(data);
        } catch (e) {
            console.error(e);
            // Fallback
            setCurrencies([{ id: 'CAD', code: 'CAD' }, { id: 'USD', code: 'USD' }, { id: 'EUR', code: 'EUR' }]);
        }
    };

    const fetchQuote = async () => {
        try {
            const { data } = await api.get(`/quotes/${id}?t=${Date.now()}`);
            setFormData({
                ...data,
                dateIssued: data.dateIssued ? data.dateIssued.split('T')[0] : new Date().toISOString().split('T')[0],
                validUntil: data.validUntil ? data.validUntil.split('T')[0] : '',
                project: {
                    ...data.project,
                    numberOfLines: data.project?.numberOfLines || 0
                },
                projectNumberOfLines: data.project?.numberOfLines || 0, // NEW: Bind to top level for editing
                representativeId: data.representativeId || '',
                pdfPath: data.pdfFilePath || '', // Map DB field to frontend state
                // Ensure estimatedWeeks gets loaded
                estimatedWeeks: data.estimatedWeeks || data.project?.estimatedWeeks || ''
            });
            setIsDirty(false); // Reset dirty flag on load
            // setItems(res.data.items || []); // Removed
        } catch (error) {
            console.error('Error fetching quote:', error);
        } finally {
            setLoading(false);
        }
    };

    // Unused state and functions removed for clarity

    const handleSubmit = async () => {
        if (!formData.projectId || !formData.thirdPartyId) {
            alert("Veuillez sélectionner un projet et un client.");
            return;
        }

        if (!formData.materialId) {
            if ((formData as any).tempMaterialName) {
                alert("Veuillez sélectionner la qualité de la pierre (dropdown à droite du nom).");
            } else {
                alert("Veuillez sélectionner un matériau (pierre) avant d'enregistrer.");
            }
            return;
        }

        setActiveAction('SAVE');
        try {
            const payload = {
                ...formData,
                materialId: formData.materialId || null,
                contactId: (formData as any).contactId || null,
                representativeId: formData.representativeId || null, // Sanitize
                incotermId: (formData as any).incotermId || null,   // Sanitize
                paymentTermId: formData.paymentTermId || null,       // Sanitize
                incotermCustomText: (formData as any).incotermCustomText || null,
                // Sanitize V8 Fields
                semiStandardRate: (formData as any).semiStandardRate ? parseFloat((formData as any).semiStandardRate) : null,
                palletPrice: (formData as any).palletPrice ? parseFloat((formData as any).palletPrice) : null,
                salesCurrency: (formData as any).salesCurrency || 'CAD',
                palletRequired: !!(formData as any).palletRequired,
                // Ensure proper number types for critical fields
                estimatedWeeks: (formData as any).estimatedWeeks ? parseInt((formData as any).estimatedWeeks) : null,
                validityDuration: (formData as any).validityDuration ? parseInt((formData as any).validityDuration) : null,
            };

            // Ensure reference exists if new
            if (isNew && !payload.reference) {
                try {
                    const refRes = await api.get('/quotes/next-reference', { params: { projectId: formData.projectId } });
                    if (refRes.data && refRes.data.reference) {
                        payload.reference = refRes.data.reference;
                        // Update state too so UI reflects it
                        setFormData(prev => ({ ...prev, reference: payload.reference }));
                    } else {
                        throw new Error("Impossible de générer une référence pour ce projet.");
                    }
                } catch (refError) {
                    console.error("Reference Generation Error", refError);
                    alert("Erreur: Impossible de générer la référence de la soumission via le backend.");
                    return;
                }
            }

            if (isNew) {
                const res = await api.post('/quotes', payload);

                // Update Project Number Of Lines if changed
                if (formData.projectId) {
                    await api.put(`/soumissions/${formData.projectId}`, {
                        numberOfLines: (formData as any).projectNumberOfLines
                    });
                }

                // Redirect to edit mode
                navigate(`/quotes/${res.data.id}`);
            } else {
                await api.put(`/quotes/${id}`, payload);

                // Update Project Number Of Lines if changed
                if (formData.projectId) {
                    await api.put(`/soumissions/${formData.projectId}`, {
                        numberOfLines: (formData as any).projectNumberOfLines
                    });
                }
                // Update Project Number Of Lines if changed
                if (formData.projectId) {
                    await api.put(`/soumissions/${formData.projectId}`, {
                        numberOfLines: (formData as any).projectNumberOfLines
                    });
                }
            }
            setIsDirty(false); // Reset dirty flag on save
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || error.response?.data?.details || error.message;
            alert(`Erreur lors de la sauvegarde : ${msg}`);
        } finally {
            setActiveAction(null);
        }
    };

    const getExcelFilename = () => {
        const client = clients.find(c => c.id === formData.thirdPartyId);
        const project = projects.find(p => p.id === formData.projectId);
        // @ts-ignore
        const material = materials.find(m => m.id === formData.materialId);

        const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');

        const parts = [
            formData.reference,
            safeName(client?.name),
            safeName(project?.name),
            safeName(material?.name)
        ].filter(p => p && p.trim() !== '');

        if (parts.length > 0) {
            return `Télécharger ${parts.join('_')}.xlsx`;
        }
        return "Télécharger le fichier Excel (depuis Réseau)";
    };

    // Removing old generateExcel handler as it's merged into Submit
    // Also remove addItem/removeItem/updateItem helpers as they are unused

    if (loading) return <div>Chargement...</div>;

    const selectedClient = clients.find(c => c.id === formData.thirdPartyId);
    const contacts = selectedClient?.contacts || []; // Derived contacts
    const clientAddress = selectedClient?.addresses?.find((a: any) => a.type === 'Main') || selectedClient?.addresses?.[0];
    const selectedContact = contacts.find((c: any) => c.id === (formData as any).contactId);
    const selectedRepresentative = representatives.find(r => r.id === (formData as any).representativeId);


    // Helper to determine if Locked Down (Sent)
    const isSent = formData.status === 'Sent';

    return (
        <div className="max-w-[1920px] mx-auto p-2 bg-slate-50 relative min-h-screen">
            {/* Loading Overlay */}
            {/* Loading Overlay */}
            {(activeAction === 'REVISING' || activeAction === 'SYNCING' || activeAction === 'REVISION_POLL' || activeAction === 'EMIT' || activeAction === 'EMIT_SUCCESS') && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                    {activeAction === 'EMIT_SUCCESS' ? (
                        <div className="text-4xl text-green-500 mb-4">✓</div>
                    ) : (
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"></div>
                    )}
                    <div className="text-2xl font-bold text-white shadow-sm">
                        {activeAction === 'REVISING' ? 'Création de la révision en cours...' :
                            activeAction === 'REVISION_POLL' ? 'L\'Agent finalise la révision (Excel)...' :
                                activeAction === 'EMIT' ? 'Envoi du courriel en cours...' :
                                    activeAction === 'EMIT_SUCCESS' ? 'Courriel envoyé avec succès !' :
                                        'Synchronisation...'}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b pb-4">
                    <div className="flex items-center min-w-0 pr-2">
                        <button type="button" onClick={() => formData.projectId ? navigate(`/soumissions/${formData.projectId}`) : navigate('/quotes')} className="mr-2 text-gray-500 hover:text-gray-700">
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 truncate">
                            {isNew ? 'Nouvelle Soumission' : `Soumission ${formData.reference} (vFix)`}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 flex-nowrap">
                        {/* 1. SAUVEGARDER (BLUE) - HIDDEN IF SENT */}
                        {(!id || (!isReadOnly && !isSent)) && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className={`inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm ${activeAction === 'SAVE' || !formData.thirdPartyId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                                disabled={!!activeAction || !formData.thirdPartyId}
                            >
                                {activeAction === 'SAVE' ? '...' : (id ? 'Enr.' : 'Créer')}
                            </button>
                        )}

                        {/* 2. GENERER EXCEL (GREEN) - HIDDEN IF SENT */}
                        {!isReadOnly && !isSent && id && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (isDirty) {
                                        alert("Vous avez des modifications non enregistrées. Veuillez enregistrer (bouton bleu 'Enr.') avant de générer.");
                                        return;
                                    }
                                    try {
                                        setActiveAction('GENERATE');
                                        await api.get(`/quotes/${id}/download-excel`);
                                        const pollInterval = setInterval(async () => {
                                            try {
                                                const pollRes = await api.get(`/quotes/${id}?t=${Date.now()}`);
                                                const status = pollRes.data.syncStatus;
                                                if (status === 'Calculated (Agent)' || status === 'Synced') {
                                                    clearInterval(pollInterval);
                                                    fetchQuote();
                                                    try {
                                                        const response = await api.get(`/quotes/${id}/download-result?t=${Date.now()}`, { responseType: 'blob' });
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement('a');
                                                        link.href = url;

                                                        // Detect Filename from Header
                                                        const disposition = response.headers['content-disposition'];
                                                        let fileName = `soumission_${id}.xlsx`;
                                                        if (disposition && disposition.indexOf('attachment') !== -1) {
                                                            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                                            const matches = filenameRegex.exec(disposition);
                                                            if (matches != null && matches[1]) {
                                                                fileName = matches[1].replace(/['"]/g, '');
                                                            }
                                                        }

                                                        link.setAttribute('download', fileName);
                                                        document.body.appendChild(link);
                                                        link.click();
                                                        link.remove();
                                                    } catch (err) { console.error("Auto-download failed", err); } finally { setActiveAction(null); }
                                                } else if (status === 'ERROR_AGENT') {
                                                    clearInterval(pollInterval);
                                                    setActiveAction(null);
                                                    alert("Erreur lors de la génération par l'agent.");
                                                }
                                            } catch (e) { }
                                        }, 2000);
                                        setTimeout(() => { if (activeAction === 'GENERATE') { clearInterval(pollInterval); setActiveAction(null); } }, 120000);
                                    } catch (e: any) {
                                        setActiveAction(null);
                                        const msg = e.response?.data?.details || e.response?.data?.error || e.message;
                                        alert(`ERREUR DÉTAILLÉE: ${msg}`);
                                    }
                                }}
                                className={`inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm ${activeAction === 'GENERATE' ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'}`}
                                disabled={!!activeAction}
                            >
                                {activeAction === 'GENERATE' ? 'Génération...' : 'Générer'}
                            </button>
                        )}

                        {/* 3. REINTEGRER EXCEL (PURPLE) - HIDDEN IF SENT */}
                        {!isNew && !isReadOnly && !isSent && (
                            <label className={`inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm ${activeAction === 'REINTEGRATE' ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 cursor-pointer'}`}>
                                {activeAction === 'REINTEGRATE' ? 'Réintégration...' : 'Réintégrer'}
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    className="hidden"
                                    disabled={!!activeAction}
                                    onChange={async (e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            setActiveAction('REINTEGRATE');
                                            try {
                                                const fd = new FormData();
                                                fd.append('file', file);
                                                await api.post(`/quotes/${id}/reintegrate-excel`, fd);
                                                const pollInterval = setInterval(async () => {
                                                    const res = await api.get(`/quotes/${id}`);
                                                    if (res.data.syncStatus === 'Synced') {
                                                        clearInterval(pollInterval);
                                                        setActiveAction(null);
                                                        fetchQuote();
                                                        alert("Réintégration réussie !");
                                                    }
                                                }, 2000);
                                            } catch (error) {
                                                console.error(error);
                                                setActiveAction(null);
                                                alert("Erreur upload");
                                            }
                                        }
                                    }}
                                />
                            </label>
                        )}

                        {/* 4. COPIER (ORANGE) - VISIBLE ALWAYS (except New) */}
                        {!isNew && (
                            <button
                                type="button"
                                onClick={() => setShowDuplicateModal(true)}
                                className="inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm bg-orange-600 hover:bg-orange-500"
                                disabled={!!activeAction}
                            >
                                Copier
                            </button>
                        )}

                        {/* 5. REVISER (YELLOW) - VISIBLE IF NOT NEW (Even if ReadOnly/Sent) */}
                        {!isNew && (
                            <button
                                type="button"
                                onClick={() => setShowRevisionModal(true)}
                                className="inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-black shadow-sm bg-yellow-400 hover:bg-yellow-300 ring-1 ring-yellow-500"
                                disabled={!!activeAction}
                            >
                                Réviser
                            </button>
                        )}

                        {/* 6. PDF (RED) - HIDDEN IF SENT */}
                        {!isNew && !isSent && (
                            <div className="relative flex flex-col items-center">
                                <button
                                    type="button"
                                    onClick={handlePdfGeneration}
                                    disabled={isPdfGenerating || !!activeAction}
                                    className={`inline-flex items-center justify-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm min-w-[110px] ${isPdfGenerating ? 'bg-gray-400 cursor-wait' : 'bg-red-600 hover:bg-red-500'}`}
                                >
                                    {isPdfGenerating ? '...' : 'Créer PDF'}
                                </button>
                                {pdfAvailable && (
                                    <a
                                        href="#"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            try {
                                                // Authenticatted Download via Blob
                                                const response = await api.get(`/quotes/${id}/download-pdf`, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                                window.open(url, '_blank');
                                            } catch (err: any) {
                                                console.error("PDF Download Error", err);
                                                alert("Erreur lors de l'ouverture du PDF (Authentification ou Fichier manquant).");
                                            }
                                        }}
                                        className="absolute top-full mt-1 text-[10px] text-blue-600 hover:text-blue-800 underline leading-none whitespace-nowrap"
                                    >
                                        lien pdf
                                    </a>
                                )}
                            </div>
                        )}

                        {/* 6. EMETTRE (RED DARK) - MOVED BEFORE PDF */}
                        {!isNew && formData.status !== 'Accepted' && (
                            <button
                                type="button"
                                onClick={async () => {
                                    // 1. Prepare Template
                                    // 1. Prepare Template
                                    const contactName = contacts.find((c: any) => c.id === (formData as any).contactId)?.firstName || 'Client';

                                    // Robust Project Lookup
                                    let projectName = '';
                                    if (formData.project && formData.project.name) {
                                        projectName = formData.project.name;
                                    } else {
                                        const p = projects.find(p => p.id === formData.projectId);
                                        projectName = p ? p.name : '(Projet Inconnu)';
                                    }

                                    const client = clients.find(c => c.id === formData.thirdPartyId);

                                    const rep = representatives.find(r => r.id === (formData as any).representativeId) ||
                                        (client?.representativeId ? representatives.find(r => r.id === client.representativeId) : null);

                                    const repName = rep ? `${rep.firstName} ${rep.lastName}` : (client?.language === 'en' ? 'Your Representative' : 'Votre Représentant');
                                    const repCell = rep?.mobile || rep?.phone || ''; // FIXED: Use 'mobile' (or phone fallback) from DB schema
                                    const repEmail = rep?.email || '';

                                    // Build contact details string cleanly to avoid double spaces
                                    const contactParts = [];
                                    const isEn = client?.language === 'en' || client?.language === 'EN';

                                    if (repCell) contactParts.push(isEn ? `at ${repCell}` : `au ${repCell}`);
                                    if (repEmail) contactParts.push(isEn ? `or by email at ${repEmail}` : `ou par email à ${repEmail}`);
                                    const contactDetails = contactParts.join(' ');

                                    let template = '';
                                    let subject = '';

                                    if (isEn) {
                                        subject = `Quote ${formData.reference} - ${projectName}`;
                                        template = `Hello ${contactName},

Please find attached your quote ${formData.reference} regarding project ${projectName}.

If you have any questions, please contact ${repName}${contactDetails ? ' ' + contactDetails : ''}.

Thank you for your trust.

Production Team.`;
                                    } else {
                                        subject = `Soumission ${formData.reference} - ${projectName}`;
                                        template = `Bonjour ${contactName},

Veuillez trouver ci-joint votre soumission ${formData.reference} concernant le projet ${projectName}.

Si vous avez des questions, contactez ${repName}${contactDetails ? ' ' + contactDetails : ''}.

Merci pour votre confiance.

L'équipe de Production.`;
                                    }

                                    const contactEmail = (contacts.find((c: any) => c.id === (formData as any).contactId)?.email) || 'N/A';
                                    setEmailDetails({
                                        to: contactEmail,
                                        cc: repEmail || 'N/A'
                                    });

                                    setEmailBody(template);
                                    setEmailSubject(subject);
                                    setShowEmitModal(true);
                                }}

                                className="inline-flex items-center rounded px-3 py-2 text-sm font-semibold text-white shadow-sm bg-red-900 hover:bg-red-800"
                                disabled={!!activeAction}
                            >
                                Émettre
                            </button>
                        )}


                    </div>
                </div>

                {/* --- NOUVELLE DISPOSITION "SYNTHÉTIQUE & CHALEUREUSE" --- */}

                {/* 1. TOP SELECTORS ROW (Client | Contact | Projet) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                    {/* Client Select */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Client</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white"
                            value={formData.thirdPartyId}
                            onChange={(e) => {
                                const val = e.target.value;
                                const selectedClient = clients.find(c => c.id === val);

                                // Attempt to resolve legacy 'repName' to an ID if needed
                                let repId = selectedClient?.representativeId || '';
                                if (!repId && selectedClient?.repName) {
                                    const foundRep = representatives.find(r => r.name === selectedClient.repName || `${r.firstName} ${r.lastName}` === selectedClient.repName);
                                    if (foundRep) repId = foundRep.id;
                                }
                                // Prepare base updates
                                let updates: any = {
                                    thirdPartyId: val,
                                    contactId: '',
                                    representativeId: repId,
                                    incorporation: selectedClient?.type || '',
                                    incotermId: selectedClient?.incotermId || '',
                                    incoterm: selectedClient?.incoterm || 'Ex Works',
                                    incotermCustomText: selectedClient?.incotermCustomText || '',

                                    // V8: Pull directly from Client Overrides (Source of Truth)
                                    semiStandardRate: selectedClient?.semiStandardRate ?? '',
                                    palletPrice: selectedClient?.palletPrice ?? '',
                                    palletRequired: !!selectedClient?.palletRequired,
                                    salesCurrency: selectedClient?.salesCurrency || 'CAD',
                                    exchangeRate: selectedClient?.exchangeRate ?? 1.0, // Also pull preferred exchange rate if set?
                                    validityDuration: selectedClient?.validityDuration ?? '',

                                    // Payment: Use Client's saved values (which already reflect term + manual overrides)
                                    paymentTermId: selectedClient?.paymentTermId || '',
                                    paymentDays: selectedClient?.paymentDays ?? 0,
                                    depositPercentage: selectedClient?.depositPercentage ?? 0,
                                    discountPercentage: selectedClient?.discountPercentage ?? 0,
                                    discountDays: selectedClient?.discountDays ?? 0,
                                    paymentCustomText: selectedClient?.paymentCustomText || ''
                                };
                                updateFormData(prev => ({
                                    ...prev,
                                    ...updates
                                }));
                            }}
                            disabled={isReadOnly}
                        >
                            <option value="">-- Sélectionner --</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Contact Select */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Contact</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white"
                            value={(formData as any).contactId || ''}
                            onChange={(e) => updateFormData({ ...formData, contactId: e.target.value } as any)}
                            disabled={!formData.thirdPartyId || isReadOnly}
                        >
                            <option value="">-- Sélectionner --</option>
                            {contacts.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.firstName} {c.lastName} ({c.role || 'Contact'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Projet */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Projet</label>
                        <div className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-900 shadow-sm sm:text-sm truncate">
                            {projects.find(p => p.id === formData.projectId)?.name || 'Chargement...'}
                        </div>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-6">Détails de la Soumission</h2>

                {/* 2. MAIN GRID (2 COLS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-8">

                    {/* LEFT COLUMN: INFO GÉNÉRALE (Recap) */}
                    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm self-start">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Information Générale</h3>
                        {/* Header / Actions Bar */}
                        <p className="text-sm text-gray-500 mb-4">
                            Détails de la soumission. Reference: <span className="font-mono text-gray-700">{formData.reference}</span>
                        </p>

                        <div className="mb-6">
                            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium border ${formData.status === 'Draft' ? 'bg-green-50 text-green-700 border-green-200' :
                                formData.status === 'Sent' ? 'bg-red-50 text-red-700 border-red-200' :
                                    formData.status === 'Accepted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        'bg-gray-50 text-gray-700 border-gray-200'
                                }`}>
                                Status: {formData.status === 'Draft' ? 'Active' : formData.status}
                            </span>
                        </div>

                        <div className="border-t border-gray-100 pt-4 space-y-6">
                            {/* Adresse Client */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Adresse Client</h4>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    {clientAddress ? (
                                        <>
                                            {clientAddress.line1}<br />
                                            {clientAddress.city}, {clientAddress.state} {clientAddress.zipCode}<br />
                                            {clientAddress.country || 'Canada'}
                                        </>
                                    ) : <span className="text-gray-400 italic">-- Aucune adresse principale --</span>}
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div>
                                {/* Header Removed as per user request */}
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    {selectedContact ? (
                                        <>
                                            <div className="font-medium text-gray-900 text-lg mb-1">{selectedContact.firstName} {selectedContact.lastName}</div>
                                            <div className="flex flex-col gap-1 text-gray-700">
                                                {selectedContact.email && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">✉️</span>
                                                        <a href={`mailto:${selectedContact.email}`} className="hover:text-blue-600 hover:underline">{selectedContact.email}</a>
                                                    </div>
                                                )}
                                                {selectedContact.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">📞</span> {selectedContact.phone}
                                                    </div>
                                                )}
                                                {selectedContact.mobile && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">📱</span> {selectedContact.mobile}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : <span className="text-gray-400 italic">-- Aucun contact sélectionné --</span>}
                                </div>
                            </div>

                            {/* Representative */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Représentant</h4>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 mb-2"
                                    value={(formData as any).representativeId || ''}
                                    onChange={e => updateFormData({ ...formData, representativeId: e.target.value })}
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {representatives.map(r => <option key={r.id} value={r.id}>{r.firstName} {r.lastName}</option>)}
                                </select>
                                {/* Representative Details */}
                                {selectedRepresentative && (
                                    <div className="text-sm text-gray-600 leading-relaxed mt-2">
                                        <div className="flex flex-col gap-1 text-gray-700">
                                            {selectedRepresentative.email && (
                                                <div className="flex items-center gap-2 overflow-hidden" title={selectedRepresentative.email}>
                                                    <span className="text-gray-400">✉️</span>
                                                    <a href={`mailto:${selectedRepresentative.email}`} className="hover:text-blue-600 hover:underline">{selectedRepresentative.email}</a>
                                                </div>
                                            )}
                                            {selectedRepresentative.phone && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">📞</span> {selectedRepresentative.phone}
                                                </div>
                                            )}
                                            {selectedRepresentative.mobile && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">📱</span> {selectedRepresentative.mobile}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: TECH & COMMERCIAL */}
                    <div className="space-y-6">

                        {/* Material Row */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Matériau (Intrant)</label>
                            <div className="flex gap-4">
                                {/* Material Name Selector */}
                                <div className="w-1/2">
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 font-semibold text-blue-700"
                                        value={(() => {
                                            const selectedMat = materials.find(m => m.id === (formData as any).materialId);
                                            return selectedMat ? selectedMat.name : (formData as any).tempMaterialName || '';
                                        })()}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            if (!name) { updateFormData(prev => ({ ...prev, materialId: '', tempMaterialName: '' } as any)); return; }
                                            const variants = materials.filter(m => m.name === name);
                                            // Auto-select if simple material
                                            if (variants.length === 1 && variants[0].category !== 'Stone') {
                                                updateFormData(prev => ({ ...prev, materialId: variants[0].id, tempMaterialName: name } as any));
                                            } else {
                                                updateFormData(prev => ({ ...prev, materialId: '', tempMaterialName: name } as any));
                                            }
                                        }}
                                    >
                                        <option value="">-- Choisir --</option>
                                        {Array.from(new Set(materials.map(m => m.name))).sort().map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quality/Price Selector */}
                                <div className="w-1/2">
                                    {(() => {
                                        const currentName = (formData as any).tempMaterialName || materials.find(m => m.id === (formData as any).materialId)?.name;
                                        const possibleVariants = materials.filter(m => m.name === currentName);

                                        if (possibleVariants.length > 0) {
                                            return (
                                                <select
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                                    value={materials.find(m => m.id === (formData as any).materialId)?.quality || ''}
                                                    onChange={(e) => {
                                                        const qual = e.target.value;
                                                        const correctMaterial = possibleVariants.find(m => m.quality === qual);
                                                        if (correctMaterial) updateFormData(prev => ({ ...prev, materialId: correctMaterial.id } as any));
                                                    }}
                                                >
                                                    <option value="">-- Qualité / Prix --</option>
                                                    {possibleVariants.sort((a, b) => (a.quality || '').localeCompare(b.quality || '')).map(v => (
                                                        <option key={v.id} value={v.quality}>
                                                            {v.quality} ({v.purchasePrice}$ / m2)
                                                        </option>
                                                    ))}
                                                </select>
                                            )
                                        }
                                        return <div className="text-gray-400 text-sm py-2 italic">Sélectionnez un matériau</div>;
                                    })()}
                                </div>
                            </div>
                            {/* Material Price Hint Text below */}
                            {(formData as any).materialId && (
                                <div className="mt-1 text-xs font-mono text-blue-600">
                                    Prix d'achat: {materials.find(m => m.id === (formData as any).materialId)?.purchasePrice} $ / m2
                                </div>
                            )}
                        </div>

                        {/* Exchange & Lines Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taux de Change</label>
                                <input
                                    type="number" step="0.01"
                                    className="block w-full rounded-md border-gray-300 bg-blue-50/50 text-blue-800 font-bold shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                    value={formData.exchangeRate}
                                    onChange={e => updateFormData({ ...formData, exchangeRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lignes à prévoir</label>
                                <input
                                    type="number"
                                    className="block w-full rounded-md border-gray-300 bg-white text-blue-800 font-bold shadow-sm focus:border-indigo-500 focus:border-blue-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                    value={formData.projectNumberOfLines || 0}
                                    onChange={(e) => updateFormData({ ...formData, projectNumberOfLines: parseInt(e.target.value) } as any)}
                                />
                            </div>
                        </div>

                        {/* Incoterm Row */}
                        {/* Incoterm & Validity Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Incoterm</label>
                                <select
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-bold"
                                    value={formData.incotermId || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const found = incoterms.find(i => i.id === val);
                                        updateFormData({
                                            ...formData,
                                            incotermId: val,
                                            incoterm: found ? found.name : 'Ex Works',
                                            incotermCustomText: (found?.requiresText) ? formData.incotermCustomText : ''
                                        });
                                    }}
                                    disabled={isReadOnly}
                                >
                                    <option value="">-- Sélectionner --</option>
                                    {incoterms.map(i => (
                                        <option key={i.id} value={i.id}>{i.xmlCode} - {i.name}</option>
                                    ))}
                                </select>

                                {/* Custom Text input if selected incoterm requires text */}
                                {(() => {
                                    const selected = incoterms.find(i => i.id === formData.incotermId);
                                    if ((selected && selected.requiresText) || formData.incotermCustomText) {
                                        return (
                                            <input
                                                type="text"
                                                placeholder="Précisez..."
                                                className="mt-2 block w-full rounded-md border-gray-300 text-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.incotermCustomText || ''}
                                                onChange={(e) => updateFormData({ ...formData, incotermCustomText: e.target.value })}
                                                disabled={isReadOnly}
                                            />
                                        )
                                    }
                                    return null;
                                })()}

                                {/* Incoterm RAK Preview */}
                                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600 border border-gray-200">
                                    <h6 className="font-bold text-gray-700 mb-1">Aperçu RAK :</h6>
                                    {(() => {
                                        const sel = incoterms.find(i => i.id === formData.incotermId);
                                        const name = sel ? sel.name : (formData.incoterm || 'Ex-Works');
                                        const code = sel ? sel.xmlCode : '1';

                                        let valIncotermS = ' ';
                                        if (code === '3' || name.toLowerCase().includes('saisie')) {
                                            valIncotermS = formData.incotermCustomText || '';
                                        } else if (code === '1' || code === '2') {
                                            valIncotermS = name;
                                        }

                                        return (
                                            <ul className="list-disc list-inside">
                                                <li>Incoterm: <span className="font-mono font-bold text-black">{name}</span></li>
                                                <li>IncotermInd: <span className="font-mono font-bold text-black">{code}</span></li>
                                                <li>IncotermS: <span className="font-mono font-bold text-black">{valIncotermS || ' '}</span></li>
                                            </ul>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Validité (Jours)</label>
                                <input
                                    type="number"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 font-bold"
                                    value={formData.validityDuration}
                                    onChange={e => updateFormData({ ...formData, validityDuration: parseInt(e.target.value) })}
                                    placeholder="30"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Production (Semaines)</label>
                                <input
                                    type="number"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 font-bold"
                                    value={formData.estimatedWeeks || ''}
                                    onChange={e => updateFormData({ ...formData, estimatedWeeks: parseInt(e.target.value) || 0 })}
                                    placeholder={formData.project?.estimatedWeeks ? `Défaut: ${formData.project.estimatedWeeks}` : "ex: 4"}
                                />
                            </div>
                        </div>

                        {/* Blue Card: Paramètres Calcul */}
                        <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-1">
                                <span>⚡</span> PARAMÈTRES CALCUL
                            </h4>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-blue-900 mb-1">Taux Semi-Std</label>
                                    <input
                                        type="number" step="0.1"
                                        className="block w-full rounded-md border-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 px-3"
                                        value={formData.semiStandardRate}
                                        onChange={e => updateFormData({ ...formData, semiStandardRate: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-900 mb-1">Devise Vente</label>
                                    <select
                                        className="block w-full rounded-md border-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 px-3 bg-white"
                                        value={formData.salesCurrency}
                                        onChange={e => updateFormData({ ...formData, salesCurrency: e.target.value })}
                                    >
                                        <option value="CAD">CAD</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-blue-900 mb-1">Prix Palette ($)</label>
                                    <input
                                        type="number"
                                        className="block w-full rounded-md border-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-1.5 px-3"
                                        value={formData.palletPrice}
                                        onChange={e => updateFormData({ ...formData, palletPrice: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-center mb-2">
                                    <input
                                        id="palletRequired"
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        checked={formData.palletRequired}
                                        onChange={e => updateFormData({ ...formData, palletRequired: e.target.checked })}
                                    />
                                    <label htmlFor="palletRequired" className="ml-2 block text-sm font-bold text-blue-900">
                                        Palette Requise
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border-2 border-orange-200 p-4 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                💳 CONDITIONS DE PAIEMENT
                            </h4>

                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Inputs Column */}
                                <div className="flex-grow space-y-4">
                                    {/* Modele Select */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">MODÈLE (BASE)</label>
                                        <select
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                            value={formData.paymentTermId || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const term = paymentTerms.find(t => t.id === val);
                                                updateFormData(prev => ({
                                                    ...prev,
                                                    paymentTermId: val,
                                                    paymentDays: term ? term.days : prev.paymentDays,
                                                    depositPercentage: term ? term.depositPercentage : prev.depositPercentage,
                                                    discountPercentage: term ? term.discountPercentage : prev.discountPercentage,
                                                    discountDays: term ? term.discountDays : prev.discountDays,
                                                    paymentCustomText: '' // Reset custom text on model change? Or keep? Reset is safer.
                                                } as any));
                                            }}
                                        >
                                            <option value="">-- Personnalisé --</option>
                                            {paymentTerms.map(t => <option key={t.id} value={t.id}>{t.code} - {t.label_fr}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DÉLAI (JOURS)</label>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                                value={(formData as any).paymentDays || 0}
                                                onChange={e => updateFormData({ ...formData, paymentDays: parseInt(e.target.value) } as any)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ACOMPTE (%)</label>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                                value={(formData as any).depositPercentage || 0}
                                                onChange={e => updateFormData({ ...formData, depositPercentage: parseFloat(e.target.value) } as any)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ESCOMPTE (%)</label>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                                value={(formData as any).discountPercentage || 0}
                                                onChange={e => updateFormData({ ...formData, discountPercentage: parseFloat(e.target.value) } as any)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">JOURS ESCOMPTE</label>
                                            <input
                                                type="number"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                                value={(formData as any).discountDays || 0}
                                                onChange={e => updateFormData({ ...formData, discountDays: parseInt(e.target.value) } as any)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TEXTE PERSONNALISÉ</label>
                                        <textarea
                                            rows={2}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-1.5 px-3"
                                            placeholder="Ex: Sur réception..."
                                            value={formData.paymentCustomText || ''}
                                            onChange={e => updateFormData({ ...formData, paymentCustomText: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Preview Column (Blue Box) */}
                                <div className="w-full lg:w-48 flex-shrink-0 bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center text-center border border-blue-100">
                                    <div className="text-blue-500 mb-2">👁️</div>
                                    <h5 className="text-xs font-bold text-blue-900 uppercase mb-2">APERÇU DU LIBELLÉ (CALCULÉ)</h5>
                                    <p className="text-sm text-blue-800 italic leading-snug">
                                        {formData.paymentCustomText ? formData.paymentCustomText : (() => {
                                            const term = paymentTerms.find(t => t.id === formData.paymentTermId);
                                            if (!term) return <span className="text-gray-400">Sélectionnez un modèle...</span>;

                                            const days = Number((formData as any).paymentDays || 0);
                                            const deposit = Number((formData as any).depositPercentage || 0);
                                            const discount = Number((formData as any).discountPercentage || 0);
                                            const dDays = Number((formData as any).discountDays || 0);

                                            // Determine language (Default FR, or Client's)
                                            const selectedClient = clients.find(c => c.id === formData.thirdPartyId);
                                            const lang = selectedClient?.language || 'fr';

                                            let label = generatePaymentTermLabel(term.code, days, deposit, lang, discount, dDays);

                                            if (discount > 0 && !label.includes('%')) {
                                                label += ` (avec ${discount}% d'escompte si payé sous ${dDays} jours)`;
                                            }
                                            return label;
                                        })()}
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div >
                </div >

                {/* Show items table only if editing (id exists) or items exist */}
                {
                    (id || (formData.items && formData.items.length > 0)) && (
                        <div className="md:col-span-2 border-t pt-4 mt-2">
                            <h3 className="text-md font-medium text-gray-900 mb-3">Lignes de la Soumission ({formData.items?.length || 0})</h3>

                            {formData.items && formData.items.length > 0 ? (
                                <div className="overflow-x-auto border rounded-md shadow-sm">
                                    <table className="min-w-[1500px] divide-y divide-gray-200 text-xs text-nowrap">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-2 py-3 text-left font-bold text-gray-900 uppercase tracking-wider">NL</th>
                                                <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                <th scope="col" className="px-2 py-3 text-left font-bold text-gray-900 uppercase tracking-wider">RÉF</th>
                                                <th scope="col" className="px-2 py-3 text-left font-bold text-gray-900 uppercase tracking-wider">TAG</th>
                                                <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">QTÉ</th>
                                                <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">PDT</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">LONG.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">LARG.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">EPAIS.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">TT LN.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">TT SN.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">TT VOLN.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">TT PDS.N</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-900 uppercase tracking-wider bg-yellow-50">PX UNIT INT.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-bold text-gray-900 uppercase tracking-wider bg-green-50">PX UNIT EXT.</th>
                                                <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">UN.VT</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-900 uppercase tracking-wider bg-yellow-50">PX TT LG INT</th>
                                                <th scope="col" className="px-2 py-3 text-right font-bold text-gray-900 uppercase tracking-wider bg-green-50">PX TT LG EXT</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">PX P Unit</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">ScPrim.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Sc Sec.</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Ct Prof</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Ct Fin</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Ct Anc</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">TT UN</th>
                                                <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Tp TT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {formData.items.map((item, index) => (
                                                <tr key={item.id || index}>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 font-bold">{(item as any).lineNo || ''}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-900">
                                                        <div className="font-medium truncate max-w-xs text-xs" title={item.material}>{item.material}</div>
                                                        <div className="text-gray-500 truncate max-w-xs text-xs" title={item.description}>{item.description}</div>
                                                    </td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-900">{(item as any).refReference || ''}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-900 font-bold">{item.tag || ''}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">{item.quantity}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">{(item as any).product || ''}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.length}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.width}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.thickness}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.netLength}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.netArea}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.netVolume}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{item.totalWeight}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-900 bg-yellow-50">{(item as any).unitPriceInternal ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format((item as any).unitPriceInternal) : '0.00 $'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right font-bold text-gray-900 bg-green-50">{item.unitPrice ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(item.unitPrice) : '0.00 $'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-gray-500">{item.unit || 'ea'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-900 bg-yellow-50">{(item as any).totalPriceInternal ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format((item as any).totalPriceInternal) : '0.00 $'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right font-bold text-gray-900 bg-green-50">{item.totalPrice ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(item.totalPrice) : '0.00 $'}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).stoneValue?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).primarySawingCost?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).secondarySawingCost?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).profilingCost?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).finishingCost?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).anchoringCost?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">{(item as any).unitTime?.toFixed(2)}</td>
                                                    <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">{(item as any).totalTime?.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 font-bold">
                                                <td colSpan={16} className="px-2 py-2 text-right text-gray-900">Total Interne</td>
                                                <td className="px-2 py-2 text-right text-gray-900 bg-yellow-100">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(formData.items.reduce((sum, i) => sum + (i.totalPriceInternal || 0), 0))}
                                                </td>
                                                <td className="px-2 py-2 text-right text-gray-900 bg-green-100">
                                                    {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(formData.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0))}
                                                </td>
                                                <td colSpan={8} className="px-2 py-2 text-left text-gray-900">Total Vente</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Aucune ligne importée via Excel/XML.</p>
                            )}
                        </div>
                    )
                }


                {
                    id && (
                        <div className="flex flex-col mt-8 border-t pt-4">
                            <div className="flex justify-center w-full px-4">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!id) return;
                                        try {
                                            const response = await api.get(`/quotes/${id}/download-result?t=${Date.now()}`, {
                                                responseType: 'blob',
                                            });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            const disposition = response.headers['content-disposition'];
                                            let fileName = 'soumission.xlsx';
                                            if (disposition && disposition.indexOf('attachment') !== -1) {
                                                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                                const matches = filenameRegex.exec(disposition);
                                                if (matches != null && matches[1]) {
                                                    fileName = matches[1].replace(/['"]/g, '');
                                                }
                                            }
                                            link.setAttribute('download', fileName);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                        } catch (error: any) {
                                            console.error("Download Error", error);
                                            if (error.response?.data instanceof Blob) {
                                                const text = await error.response.data.text();
                                                try {
                                                    const json = JSON.parse(text);
                                                    alert(`Erreur : ${json.details || json.error || "Fichier introuvable"}`);
                                                } catch (e) {
                                                    alert("Erreur inconnue lors du téléchargement.");
                                                }
                                            } else {
                                                alert("Erreur lors du téléchargement. Vérifiez que le fichier existe sur le réseau.");
                                            }
                                        }
                                    }}
                                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 cursor-pointer text-sm font-semibold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    {getExcelFilename()}
                                </button>
                            </div>
                        </div >
                    )
                }
                {/* DUPLICATE MODAL */}
                {
                    showDuplicateModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Dupliquer la Soumission</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nouveau Client</label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={duplicateClientId}
                                            onChange={e => {
                                                setDuplicateClientId(e.target.value);
                                                setDuplicateContactId(''); // Reset contact
                                            }}
                                        >
                                            <option value="">-- Sélectionner --</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact <span className="text-red-500">*</span></label>
                                        <select
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            value={duplicateContactId}
                                            onChange={e => setDuplicateContactId(e.target.value)}
                                            disabled={!duplicateClientId}
                                        >
                                            <option value="">-- Sélectionner --</option>
                                            {(clients.find(c => c.id === duplicateClientId)?.contacts || []).map((c: any) => (
                                                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {activeAction === 'DUPLICATE_WAIT' && (
                                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded text-sm animate-pulse">
                                            ⏳ Génération en cours par le PC Agent...<br />
                                            Veuillez patienter (Fichier Excel + XML en transit).
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                        onClick={() => setShowDuplicateModal(false)}
                                        disabled={activeAction === 'DUPLICATE_WAIT'}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
                                        disabled={!duplicateClientId || !duplicateContactId || activeAction === 'DUPLICATE_WAIT'}
                                        onClick={async () => {
                                            try {
                                                setActiveAction('DUPLICATE_WAIT');
                                                // 1. Trigger Duplicate
                                                const res = await api.post(`/quotes/${id}/duplicate`, {
                                                    newClientId: duplicateClientId,
                                                    newContactId: duplicateContactId
                                                });
                                                const newQuoteId = res.data.id;

                                                // 2. Poll for Completion (Draft Status)
                                                const poll = setInterval(async () => {
                                                    try {
                                                        const check = await api.get(`/quotes/${newQuoteId}`);
                                                        // Status Draft or Calculated(Agent) or Synced means success
                                                        if (check.data.status === 'Draft' || check.data.syncStatus === 'Calculated (Agent)' || check.data.syncStatus === 'Synced') {
                                                            clearInterval(poll);

                                                            // 3. Trigger Download (Restored)
                                                            try {
                                                                const response = await api.get(`/quotes/${newQuoteId}/download-result?t=${Date.now()}`, {
                                                                    responseType: 'blob',
                                                                });
                                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                                const link = document.createElement('a');
                                                                link.href = url;
                                                                const disposition = response.headers['content-disposition'];
                                                                let fileName = 'soumission.xlsx';
                                                                if (disposition && disposition.indexOf('attachment') !== -1) {
                                                                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                                                                    const matches = filenameRegex.exec(disposition);
                                                                    if (matches != null && matches[1]) {
                                                                        fileName = matches[1].replace(/['"]/g, '');
                                                                    }
                                                                }
                                                                link.setAttribute('download', fileName);
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                link.remove();
                                                            } catch (dlErr) {
                                                                console.error("Auto-Download failed", dlErr);
                                                            }

                                                            // 4. Navigate to new Quote
                                                            setTimeout(() => {
                                                                setActiveAction(null); // FIX: Enable buttons on new page
                                                                setShowDuplicateModal(false);
                                                                navigate(`/quotes/${newQuoteId}`);
                                                            }, 1000);

                                                        }
                                                    } catch (err) { console.error("Poll Error", err); }
                                                }, 2000); // Check every 2s

                                                // Safety timeout (e.g. 2 mins)
                                                setTimeout(() => {
                                                    if (activeAction === 'DUPLICATE_WAIT') {
                                                        clearInterval(poll);
                                                        alert("Délai d'attente dépassé. La soumission a peut-être été créée en arrière-plan.");
                                                        setActiveAction(null); // FIX: Enable buttons even on timeout
                                                        navigate(`/quotes/${newQuoteId}`);
                                                    }
                                                }, 120000);

                                            } catch (e) {
                                                console.error(e);
                                                alert("Erreur lors de la duplication");
                                                setActiveAction(null);
                                            }
                                        }}
                                    >
                                        {activeAction === 'DUPLICATE_WAIT' ? 'Patientez...' : 'Confirmer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
                {/* Modal de Révision */}
                {
                    showRevisionModal && (
                        <RevisionModal
                            isOpen={showRevisionModal}
                            onClose={() => setShowRevisionModal(false)}
                            onConfirm={handleRevisionConfirm}
                            originalQuote={{
                                ...formData,
                                material: materials.find(m => m.id === formData.materialId),
                                incotermRef: incoterms.find(i => i.id === formData.incotermId),
                                paymentTerm: paymentTerms.find(p => p.id === formData.paymentTermId)
                            }}
                            materials={materials}
                            incoterms={incoterms}
                            paymentTerms={paymentTerms}
                            currencies={currencies}
                            isSubmitting={activeAction === 'REVISING'}
                        />
                    )
                }


                {/* 
                  ------------------------------------
                   MODAL : CONFIRM EMISSION (EMAIL)
                  ------------------------------------
                */}
                {showEmitModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmer l'envoi du courriel</h3>

                            <div className="mb-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                                <p><span className="font-semibold">À : </span> {emailDetails.to}</p>
                                <p><span className="font-semibold">CC : </span> {emailDetails.cc}</p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">
                                    Vous pouvez modifier le sujet et le message ci-dessous avant de l'envoyer au client.
                                </p>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Objet</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                    />
                                </div>

                                <textarea
                                    className="w-full h-64 p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    value={emailBody}
                                    onChange={(e) => setEmailBody(e.target.value)}
                                />

                                {/* Link to open PDF */}
                                <div className="text-right">
                                    <button
                                        type="button"
                                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            try {
                                                const response = await api.get(`/quotes/${id}/download-pdf`, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                                                window.open(url, '_blank');
                                            } catch (err) {
                                                console.error("PDF Preview Error (Modal)", err);
                                                alert("Erreur: Impossible de prévisualiser le PDF (Non trouvé ou Auth).");
                                            }
                                        }}
                                    >
                                        Voir le PDF joint à ce courriel
                                    </button>
                                </div>

                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                                        onClick={() => setShowEmitModal(false)}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                                        onClick={async () => {
                                            setShowEmitModal(false);
                                            setActiveAction('EMIT');
                                            try {
                                                await api.post(`/quotes/${id}/emit`, { message: emailBody, subject: emailSubject });
                                                setActiveAction('EMIT_SUCCESS'); // Show success message
                                                fetchQuote();
                                                setTimeout(() => setActiveAction(null), 1500); // Auto-dismiss after 1.5s
                                            } catch (error: any) {
                                                setActiveAction(null); // UNBLOCK UI BEFORE ALERT
                                                console.error("Emit Error", error);
                                                // Show detailed error from backend
                                                const detail = error.response?.data?.details || error.response?.data?.error || error.message;
                                                alert("Erreur lors de l'envoi: " + (typeof detail === 'object' ? JSON.stringify(detail) : detail));
                                            }
                                        }}
                                    >
                                        Envoyer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </form >
        </div >
    );
}

