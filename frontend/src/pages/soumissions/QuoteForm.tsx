import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMaterials, Material } from '../../services/catalogueService';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
        currency: 'CAD', // Default currency
        items: [] as any[],
        materialId: '' // Fix type inference
    });

    // Status Logic: Active (Draft) -> Emise (Sent)
    // ReadOnly if not Draft
    // Note: formData.status gets updated by fetchQuote
    const isReadOnly = !isNew && formData.status !== 'Draft';

    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]); // New State
    const [loading, setLoading] = useState(!isNew);
    const [activeAction, setActiveAction] = useState<string | null>(null);


    useEffect(() => {
        fetchClients();
        fetchProjects();
        fetchMaterials(); // Fetch materials
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
                }
            });
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
            };

            if (isNew) {
                const res = await api.post('/quotes', payload);

                // Update Project Number Of Lines if changed
                const currentProj = projects.find(p => p.id === formData.projectId);
                if (currentProj) {
                    await api.put(`/soumissions/${formData.projectId}`, {
                        numberOfLines: currentProj.numberOfLines
                    });
                }

                // Redirect to edit mode
                navigate(`/quotes/${res.data.id}`);
            } else {
                await api.put(`/quotes/${id}`, payload);

                // Update Project Number Of Lines if changed
                const currentProj = projects.find(p => p.id === formData.projectId);
                if (currentProj) {
                    await api.put(`/soumissions/${formData.projectId}`, {
                        numberOfLines: currentProj.numberOfLines
                    });
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde.");
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

    return (
        <form onSubmit={handleSubmit} className="px-4 py-4 sm:px-6 lg:px-8 bg-white shadow sm:rounded-lg">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
                <div className="flex items-center">
                    <button type="button" onClick={() => formData.projectId ? navigate(`/soumissions/${formData.projectId}`) : navigate('/quotes')} className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isNew ? 'Nouvelle Soumission' : `Soumission ${formData.reference}`}
                    </h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. SAUVEGARDER (BLUE) */}
                    {!isReadOnly && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className={`inline-flex items-center rounded px-2 py-1 text-sm font-semibold text-white shadow-sm ${activeAction === 'SAVE' || !formData.thirdPartyId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                            disabled={!!activeAction || !formData.thirdPartyId}
                        >
                            {activeAction === 'SAVE' ? '...' : (id ? 'Enregistrer' : 'Créer')}
                        </button>
                    )}

                    {/* 2. GENERER EXCEL (GREEN) */}
                    {!isReadOnly && id && (
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setActiveAction('GENERATE');
                                    // 1. Trigger
                                    await api.get(`/quotes/${id}/download-excel`);

                                    // 2. Poll
                                    const pollInterval = setInterval(async () => {
                                        try {
                                            const pollRes = await api.get(`/quotes/${id}?t=${Date.now()}`);
                                            const status = pollRes.data.syncStatus;
                                            if (status === 'Calculated (Agent)') {
                                                clearInterval(pollInterval);
                                                fetchQuote();
                                                setTimeout(async () => {
                                                    try {
                                                        const response = await api.get(`/quotes/${id}/download-result?t=${Date.now()}`, { responseType: 'blob' });
                                                        const url = window.URL.createObjectURL(new Blob([response.data]));
                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        // Filename extraction
                                                        const disposition = response.headers['content-disposition'];
                                                        console.log("Download Header:", disposition);
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
                                                        setActiveAction(null);
                                                    } catch (e) { setActiveAction(null); }
                                                }, 1000);
                                            } else if (status === 'ERROR_AGENT') {
                                                clearInterval(pollInterval);
                                                setActiveAction(null);
                                                alert("Erreur Agent");
                                            }
                                        } catch (e) { }
                                    }, 2000);

                                    // Timeout
                                    setTimeout(() => { if (activeAction === 'GENERATE') { clearInterval(pollInterval); setActiveAction(null); } }, 120000);

                                } catch (e) { setActiveAction(null); alert("Erreur génération"); }
                            }}
                            className={`inline-flex items-center rounded px-2 py-1 text-sm font-semibold text-white shadow-sm ${activeAction === 'GENERATE' ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-500'}`}
                            disabled={!!activeAction}
                        >
                            {activeAction === 'GENERATE' ? 'Génération...' : 'Générer Excel'}
                        </button>
                    )}

                    {/* 3. REINTEGRER EXCEL (PURPLE) */}
                    {!isNew && (
                        <label className={`inline-flex items-center rounded px-2 py-1 text-sm font-semibold text-white shadow-sm ${activeAction === 'REINTEGRATE' ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 cursor-pointer'}`}>
                            {activeAction === 'REINTEGRATE' ? 'Réintégration...' : 'Réintégrer'}
                            <input
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                disabled={!!activeAction}
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        // NO CONFIRM ALERT
                                        setActiveAction('REINTEGRATE');
                                        try {
                                            const fd = new FormData();
                                            fd.append('file', file);
                                            await api.post(`/quotes/${id}/reintegrate-excel`, fd);

                                            // Poll
                                            const pollInterval = setInterval(async () => {
                                                try {
                                                    const res = await api.get(`/quotes/${id}?t=${Date.now()}`);
                                                    if (res.data.syncStatus === 'Calculated (Agent)') {
                                                        clearInterval(pollInterval);
                                                        fetchQuote();
                                                        setActiveAction(null);
                                                        // alert("Réintégration terminée !"); // Removed as requested
                                                    } else if (res.data.syncStatus === 'ERROR_AGENT') {
                                                        clearInterval(pollInterval);
                                                        setActiveAction(null);
                                                        alert("Erreur Agent");
                                                    }
                                                } catch (err) { }
                                            }, 2000);
                                            setTimeout(() => { if (activeAction === 'REINTEGRATE') { clearInterval(pollInterval); setActiveAction(null); } }, 120000);

                                        } catch (err) {
                                            console.error(err);
                                            setActiveAction(null);
                                            alert("Erreur envoi");
                                        } finally {
                                            e.target.value = '';
                                        }
                                    }
                                }}
                            />
                        </label>
                    )}

                    {/* 4. DUPLIQUER (ORANGE) */}
                    {!isNew && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Dupliquer ?")) {
                                    try {
                                        setActiveAction('DUPLICATE');
                                        const res = await api.post(`/quotes/${id}/duplicate`);
                                        navigate(`/quotes/${res.data.id}`);
                                    } catch (e) { alert("Erreur duplication"); }
                                    finally { setActiveAction(null); }
                                }
                            }}
                            className="inline-flex items-center rounded px-2 py-1 text-sm font-semibold text-white shadow-sm bg-orange-600 hover:bg-orange-500"
                            disabled={!!activeAction}
                        >
                            Dupliquer
                        </button>
                    )}

                    {/* 5. RECOPIER / REVISER (YELLOW) */}
                    {!isNew && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Créer une révision ?")) {
                                    try {
                                        setActiveAction('REVISE');
                                        const res = await api.post(`/quotes/${id}/revise`);
                                        navigate(`/quotes/${res.data.id}`);
                                    } catch (e) { alert("Erreur révision"); }
                                    finally { setActiveAction(null); }
                                }
                            }}
                            className="inline-flex items-center rounded px-2 py-1 text-sm font-semibold text-white shadow-sm bg-yellow-500 hover:bg-yellow-400"
                            disabled={!!activeAction}
                        >
                            Recopier/Rev
                        </button>
                    )}

                    {/* SPACER */}
                    <div className="flex-grow"></div>

                    {/* 6. EMETTRE (RIGHT - RED/DARK) */}
                    {!isNew && formData.status !== 'Accepted' && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Émettre la soumission ?")) {
                                    try {
                                        setActiveAction('EMIT');
                                        await api.post(`/quotes/${id}/emit`);
                                        fetchQuote();
                                    } catch (e) { alert("Erreur émission"); }
                                    finally { setActiveAction(null); }
                                }
                            }}
                            className="inline-flex items-center rounded px-2 py-1 text-sm font-bold text-white shadow-sm bg-red-600 hover:bg-red-500"
                            disabled={!!activeAction}
                        >
                            Émettre
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Project Selection (Read Only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Projet</label>
                    <div className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm py-2 px-3 bg-gray-50 text-gray-500">
                        {projects.find(p => p.id === formData.projectId)?.name || 'Chargement...'}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Référence Soumission (Auto)</label>
                    <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-gray-50 text-gray-500"
                        value={formData.reference}
                        readOnly
                    />
                </div>

                {/* Client Selection */}
                <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Détails de la Soumission</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client pour la facturation</label>
                            <select
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                value={formData.thirdPartyId}
                                onChange={(e) => {
                                    const selectedClient = clients.find(c => c.id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        thirdPartyId: e.target.value,
                                        incoterm: selectedClient?.incoterm || 'Ex Works'
                                    });
                                }}
                                required
                                disabled={isReadOnly}
                            >
                                <option value="">-- Sélectionner un client --</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                            <div className="md:grid md:grid-cols-3 md:gap-6 mb-8">
                                <div className="md:col-span-1">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Information Générale</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Détails de la soumission. Reference: {formData.reference || 'Auto'}
                                        <br />
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${formData.status === 'Draft' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                            formData.status === 'Sent' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                formData.status === 'Accepted' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                                                    'bg-gray-50 text-gray-600 ring-gray-500/10'
                                            }`}>
                                            Status: {formData.status === 'Draft' ? 'Active' : formData.status === 'Sent' ? 'Émise' : formData.status === 'Accepted' ? 'Acceptée' : formData.status}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Matériau (Intrant)</label>
                            <div className="flex gap-2">
                                <div className="w-2/3">
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                        value={(() => {
                                            // Derive selected name from materialId if set, otherwise from local state if I add one,
                                            // but checking directly from materials list is safer for synchronization.
                                            const selectedMat = materials.find(m => m.id === (formData as any).materialId);
                                            return selectedMat ? selectedMat.name : (formData as any).tempMaterialName || '';
                                        })()}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            if (!name) {
                                                setFormData(prev => ({ ...prev, materialId: '', tempMaterialName: '' } as any));
                                                return;
                                            }

                                            // Find all variants for this name
                                            const variants = materials.filter(m => m.name === name);
                                            // If only one variant (e.g. Standard) or specific type logic
                                            if (variants.length === 1 && variants[0].category !== 'Stone') {
                                                // Auto-select
                                                setFormData(prev => ({ ...prev, materialId: variants[0].id, tempMaterialName: name } as any));
                                            } else {
                                                // Wait for quality selection, but set temp name
                                                setFormData(prev => ({ ...prev, materialId: '', tempMaterialName: name } as any));
                                            }
                                        }}
                                    >
                                        <option value="">-- Sélectionner un matériau --</option>
                                        {/* Unique Names */}
                                        {Array.from(new Set(materials.map(m => m.name))).sort().map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-1/3">
                                    {/* Quality Selector - Show if tempName is selected and has variants */}
                                    {(() => {
                                        const currentName = (formData as any).tempMaterialName || materials.find(m => m.id === (formData as any).materialId)?.name;
                                        const possibleVariants = materials.filter(m => m.name === currentName);
                                        const isStone = possibleVariants.some(m => m.category === 'Stone');

                                        if (currentName && isStone) {
                                            const currentQuality = materials.find(m => m.id === (formData as any).materialId)?.quality || '';
                                            return (
                                                <select
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                                    value={currentQuality}
                                                    onChange={(e) => {
                                                        const qual = e.target.value;
                                                        const correctMaterial = possibleVariants.find(m => m.quality === qual);
                                                        if (correctMaterial) {
                                                            setFormData(prev => ({ ...prev, materialId: correctMaterial.id } as any));
                                                        }
                                                    }}
                                                >
                                                    <option value="">Qualité</option>
                                                    {possibleVariants.sort((a, b) => (a.quality || '').localeCompare(b.quality || '')).map(v => (
                                                        <option key={v.id} value={v.quality}>{v.quality} ({v.purchasePrice}$)</option>
                                                    ))}
                                                </select>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>

                            {(formData as any).materialId && (
                                <p className="text-xs text-blue-700 font-medium mt-1">
                                    Prix d'achat: {materials.find(m => m.id === (formData as any).materialId)?.purchasePrice} $ / {(() => {
                                        const m = materials.find(mat => mat.id === (formData as any).materialId);
                                        return (m?.unit === 'm2') ? 'm³' : (m?.unit === 'sqft' ? 'pi³' : m?.unit || 'unité');
                                    })()}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Taux de Change</label>
                            <input
                                type="number"
                                step="0.01"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-gray-50 text-blue-700 font-medium"
                                value={formData.exchangeRate}
                                onChange={({ target: { value } }) => setFormData({ ...formData, exchangeRate: parseFloat(value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incoterm</label>
                            <select
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                value={['Ex Works', 'FOB jobsite'].includes(formData.incoterm) ? formData.incoterm : 'Other'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'Other') {
                                        setFormData({ ...formData, incoterm: '' });
                                    } else {
                                        setFormData({ ...formData, incoterm: val });
                                    }
                                }}
                            >
                                <option value="Ex Works">Ex Works (EXW)</option>
                                <option value="FOB jobsite">FOB jobsite</option>
                                <option value="Other">À déterminer / Autre</option>
                            </select>
                            {(!['Ex Works', 'FOB jobsite'].includes(formData.incoterm) || formData.incoterm === '') && (
                                <input
                                    type="text"
                                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 bg-white text-blue-700 font-medium"
                                    placeholder="Précisez..."
                                    value={formData.incoterm}
                                    onChange={(e) => setFormData({ ...formData, incoterm: e.target.value })}
                                />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Termes de paiement</label>
                            <div className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm py-2 px-3 bg-gray-50 text-gray-500">
                                {clients.find(c => c.id === formData.thirdPartyId)?.paymentTerms || 'Standard'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu de projet</label>
                            <div className="block w-full rounded-md border border-gray-300 shadow-sm sm:text-sm py-2 px-3 bg-gray-50 text-gray-500">
                                {projects.find(p => p.id === formData.projectId)?.location?.name || 'Non défini'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lignes à prévoir</label>
                            <input
                                type="number"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 text-blue-700 font-medium"
                                value={(() => {
                                    const p = projects.find(pr => pr.id === formData.projectId);
                                    return p?.numberOfLines || '';
                                })()}
                                onChange={(e) => {
                                    const newVal = e.target.value;
                                    setProjects(prev => prev.map(p =>
                                        p.id === formData.projectId ? { ...p, numberOfLines: newVal } : p
                                    ));
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Lignes de la Soumission ({formData.items?.length || 0})</h3>

                    {formData.items && formData.items.length > 0 ? (
                        <div className="overflow-x-auto border rounded-md shadow-sm">
                            <table className="min-w-[1500px] divide-y divide-gray-200 text-xs text-nowrap">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">#</th>
                                        <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                                        <th scope="col" className="px-2 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Long.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Larg.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Epais.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Long. Net</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Surf. Net</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Vol. Tot</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Poids Tot</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Val. Pierre</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Sc. Prim</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Sc. Sec</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Prof.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Fin.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Ancr.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Tps U.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">Tps Tot.</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">Prix_Unit Int</th>
                                        <th scope="col" className="px-2 py-3 text-right font-medium text-gray-500 uppercase tracking-wider bg-yellow-50">TT Prix_Unit Int</th>
                                        <th scope="col" className="px-2 py-3 text-right font-bold text-gray-900 uppercase tracking-wider bg-green-50">Prix_Unit_externe</th>
                                        <th scope="col" className="px-2 py-3 text-right font-bold text-gray-900 uppercase tracking-wider bg-green-50">TT Prix_Unit_externe</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formData.items.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                                                {item.tag || (index + 1)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-900">
                                                <div className="font-medium truncate max-w-xs" title={item.material}>{item.material}</div>
                                                <div className="text-gray-500 truncate max-w-xs" title={item.description}>{item.description}</div>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                                                {item.quantity}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-gray-500">
                                                {item.unit || 'ea'}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.length?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.width?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.thickness?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.netLength?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.netArea?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.netVolume?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {item.totalWeight?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-500">
                                                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.stoneValue || 0)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).primarySawingCost?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).secondarySawingCost?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).profilingCost?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).finishingCost?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).anchoringCost?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).unitTime?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-400">
                                                {(item as any).totalTime?.toFixed(2)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-600 bg-yellow-50">
                                                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.unitPriceCad || 0)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right text-gray-600 bg-yellow-50">
                                                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(item.totalPriceCad || 0)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right font-medium text-gray-900 bg-green-50">
                                                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(item.unitPrice || 0)}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-right font-medium text-gray-900 bg-green-50">
                                                {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(item.totalPrice || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-100 font-bold">
                                        <td colSpan={10} className="px-2 py-2 text-right text-gray-900">Total Interne</td>
                                        <td className="px-2 py-2 text-right text-gray-900 bg-yellow-100">
                                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(formData.items.reduce((sum, i) => sum + (i.totalPriceCad || 0), 0))}
                                        </td>
                                        <td className="px-2 py-2 text-right text-gray-900 bg-green-100">Total Vente</td>
                                        <td className="px-2 py-2 text-right text-gray-900 bg-green-100">
                                            {new Intl.NumberFormat('fr-CA', { style: 'currency', currency: formData.currency || 'CAD' }).format(formData.items.reduce((sum, i) => sum + (i.totalPrice || 0), 0))}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Aucune ligne importée via Excel/XML.</p>
                    )}
                </div>
            </div>

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
        </form >
    );
}
