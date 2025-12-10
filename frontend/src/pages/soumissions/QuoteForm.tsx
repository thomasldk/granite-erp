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
    const [downloading, setDownloading] = useState(false);


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
            const res = await api.get(`/quotes/${id}`);
            setFormData({
                reference: res.data.reference,
                thirdPartyId: res.data.thirdPartyId,
                projectId: res.data.projectId,
                status: res.data.status,
                dateIssued: res.data.dateIssued.split('T')[0],
                estimatedWeeks: res.data.estimatedWeeks || 0,
                // @ts-ignore
                materialId: res.data.materialId || '', // Fix: Restore materialId
                exchangeRate: res.data.exchangeRate || 1.0, // Fetch exchangeRate
                incoterm: res.data.incoterm || 'Ex Works',
                currency: res.data.currency || 'CAD',
                items: res.data.items || []
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

        setDownloading(true);
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

                alert(`Soumission ${res.data.reference} créée avec succès !`);
                // Redirect to edit mode to enable XML download
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

                alert(`Soumission ${formData.reference} mise à jour avec succès !`);
            }
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setDownloading(false);
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
                <div className="flex gap-2">
                    {!isReadOnly && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (!id) {
                                    alert("Veuillez d'abord créer la soumission (Bouton 'Créer la soumission') avant de générer le fichier Excel.");
                                    return;
                                }
                                try {
                                    setDownloading(true);
                                    // Call backend which handles RAK generation, Waiting, and Sync
                                    const res = await api.get(`/quotes/${id}/download-excel`, { timeout: 120000 }); // 2 minute timeout for sync wait

                                    alert(`Génération réussie et données synchronisées ! ${res.data.itemsCount} lignes mises à jour.`);
                                    fetchQuote();
                                } catch (error: any) {
                                    console.error('Erreur generation:', error);
                                    if (error.response && error.response.data && error.response.data.details) {
                                        alert(`Erreur (${error.response.status}): ${error.response.data.details}`);
                                    } else if (error.message) {
                                        alert(`Erreur technique : ${error.message}`);
                                    } else {
                                        alert("Erreur inconnue lors de la génération.");
                                    }
                                } finally {
                                    setDownloading(false);
                                }
                            }}
                            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ml-4 ${!id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500'
                                }`}
                        >
                            {downloading ? 'Génération en cours...' : 'Générer la Cotation (Excel)'}
                        </button>
                    )}
                    {!isNew && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm(`Voulez-vous créer une révision (Copies de R${formData.reference.split('R').pop()}) ?`)) {
                                    try {
                                        setDownloading(true);
                                        const res = await api.post(`/quotes/${id}/revise`);
                                        alert("Révision créée : " + res.data.reference);
                                        navigate(`/quotes/${res.data.id}`);
                                    } catch (e) {
                                        console.error(e);
                                        alert("Erreur lors de la révision");
                                    } finally {
                                        setDownloading(false);
                                    }
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4"
                        >
                            Créer Révision
                        </button>
                    )}

                    {!isNew && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Voulez-vous dupliquer cette soumission (Nouveau numéro de référence) ?")) {
                                    try {
                                        setDownloading(true);
                                        const res = await api.post(`/quotes/${id}/duplicate`);
                                        alert("Duplication réussie : " + res.data.reference);
                                        navigate(`/quotes/${res.data.id}`);
                                    } catch (e) {
                                        console.error(e);
                                        alert("Erreur lors de la duplication");
                                    } finally {
                                        setDownloading(false);
                                    }
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Dupliquer
                        </button>
                    )}
                    {!isNew && formData.status !== 'Accepted' && (
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm("Émettre la soumission ? (Le statut passera à 'Accepted')")) {
                                    try {
                                        setDownloading(true);
                                        await api.post(`/quotes/${id}/emit`);
                                        alert("Soumission émise et envoyée par courriel !");
                                        // Refresh
                                        await fetchQuote();
                                    } catch (e) {
                                        console.error(e);
                                        alert("Erreur lors de l'émission");
                                    } finally {
                                        setDownloading(false);
                                    }
                                }
                            }}
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Émettre
                        </button>
                    )}
                    {/* Header Action Buttons */}
                    {!isReadOnly && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${downloading || !formData.thirdPartyId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                            disabled={downloading || !formData.thirdPartyId}
                        >
                            {downloading ? 'Traitement...' : (id ? 'Enregistrer' : 'Créer la soumission')}
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

            <div className="flex flex-col mt-8 border-t pt-8">
                <p className="text-gray-600 mb-4 text-center max-w-md mx-auto">
                    Enregistrez la soumission pour activer le téléchargement XML.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                    {!isReadOnly && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${downloading || !formData.thirdPartyId ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                            disabled={downloading || !formData.thirdPartyId}
                        >
                            {downloading ? 'Traitement...' : (id ? 'Enregistrer' : 'Créer la soumission')}
                        </button>
                    )}

                    {!isNew && (
                        <>
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (confirm("Êtes-vous sûr de vouloir émettre cette soumission ? Elle ne sera plus modifiable.")) {
                                            try {
                                                setDownloading(true);
                                                await api.post(`/quotes/${id}/emit`);
                                                alert("Soumission émise avec succès !");
                                                fetchQuote();
                                            } catch (e) {
                                                console.error(e);
                                                alert("Erreur lors de l'émission");
                                            } finally {
                                                setDownloading(false);
                                            }
                                        }
                                    }}
                                    className="inline-flex items-center rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 ml-4"
                                >
                                    Émettre
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    if (!id) {
                                        alert("Veuillez d'abord créer la soumission.");
                                        return;
                                    }
                                    // Direct validation of backend URL to avoid proxy issues
                                    window.location.href = `/api/quotes/${id}/download-pdf`;
                                }}
                                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ml-4 ${!id
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-500'
                                    }`}
                            >
                                Télécharger PDF
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `${api.defaults.baseURL}/quotes/${id}/xml`;
                                    api.get(`/quotes/${id}/xml`, { responseType: 'blob' })
                                        .then(response => {
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            link.href = url;
                                            const contentDisposition = response.headers['content-disposition'];
                                            let fileName = `${formData.reference || 'Soumission'}.rak`;
                                            if (contentDisposition) {
                                                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                                                if (fileNameMatch && fileNameMatch.length === 2)
                                                    fileName = fileNameMatch[1];
                                            }
                                            link.setAttribute('download', fileName);
                                            document.body.appendChild(link);
                                            link.click();
                                            link.parentNode?.removeChild(link);
                                        })
                                        .catch(() => alert("Erreur XML"));
                                }}
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-400 ml-4"
                                disabled={!id || isNew}
                            >
                                <span className="mr-2 font-mono font-bold text-base">&lt;/&gt;</span>
                                Télécharger XML
                            </button>

                            {!isReadOnly && (
                                <>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".xml"
                                            id="xml-upload"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const data = new FormData();
                                                data.append('file', file);

                                                try {
                                                    await api.post(`/quotes/${id}/import-xml`, data, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    alert('Import réussi ! La soumission a été mise à jour.');
                                                    fetchQuote();
                                                } catch (error) {
                                                    console.error(error);
                                                    alert("Erreur lors de l'importation du XML.");
                                                }
                                            }}
                                            disabled={!id || isNew}
                                        />
                                        <input
                                            type="file"
                                            accept=".xlsx,.xlsm"
                                            id="excel-reintegrate"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // 1. Upload to backend for network save
                                                let networkPath = '';
                                                try {
                                                    setDownloading(true);
                                                    const formData = new FormData();
                                                    formData.append('file', file);

                                                    const res = await api.post(`/quotes/${id}/reintegrate-excel`, formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });

                                                    // Backend returns { path: 'H:\...' }
                                                    networkPath = res.data.path;
                                                    // Silent success - no alert
                                                    console.log(`Fichier sauvegardé sur le réseau : ${networkPath}`);

                                                } catch (err: any) {
                                                    console.error("Upload failed", err);
                                                    // Fallback if backend fails (e.g. locally on Mac without H drive)
                                                    // We'll just warn but allow XML gen with assumed path
                                                    const msg = err.response?.data?.error || "Erreur lors de la sauvegarde réseau";
                                                    alert(`${msg}. Le XML sera quand même généré avec le chemin théorique.`);

                                                    // Fallback path construction
                                                    const projectName = projects.find(p => p.id === formData.projectId)?.name || 'UnknownProject';
                                                    networkPath = `F:\\nxerp\\${projectName}\\${file.name}`;
                                                } finally {
                                                    setDownloading(false);
                                                }

                                                const dateNow = new Date();
                                                const dateStr = `${dateNow.getDate().toString().padStart(2, '0')}-${(dateNow.getMonth() + 1).toString().padStart(2, '0')}-${dateNow.getFullYear()} ${dateNow.getHours().toString().padStart(2, '0')}:${dateNow.getMinutes().toString().padStart(2, '0')}`;

                                                // Use the path from backend or fallback
                                                const filePath = networkPath || `F:\\nxerp\\${(projects.find(p => p.id === formData.projectId)?.name || 'Projet')}\\${file.name}`;

                                                const xmlContent = `<?xml version='1.0'?>
<!--Génération par DRC le ${dateStr}-->
<generation type='Soumission'><meta cible='${filePath}' Langue='fr' action='reintegrer' modele='${filePath}' appCode='03' journal='' socLangue='fr' codeModule='01' definition='C:\\Travail\\XML\\CLAUTOMATEREINTEGRER.xml' codeApplication='03'><resultat flag=''/></meta><devis><externe/></devis></generation>`;

                                                // Local download removed as requested

                                                // Generate incremental filename envoi000001.rak
                                                let counter = parseInt(localStorage.getItem('rak_counter') || '1', 10);
                                                if (isNaN(counter)) counter = 1;
                                                const filename = `envoi${counter.toString().padStart(6, '0')}.rak`;

                                                // Increment for next time
                                                localStorage.setItem('rak_counter', (counter + 1).toString());

                                                // 3. Send RAK to Network (/Volumes/demo/echange)
                                                try {
                                                    await api.post('/quotes/save-rak', {
                                                        xmlContent: xmlContent,
                                                        filename: filename
                                                    });
                                                    // Silent success - no alert
                                                    console.log(`Dossier réseau mis à jour : RAK envoyé vers /Volumes/demo/echange/\nFichier: ${filename}`);

                                                    // 4. Wait 7 seconds and Fetch Return XML (.xml)
                                                    console.log("Waiting 7 seconds for external Excel processing...");
                                                    setTimeout(async () => {
                                                        try {
                                                            const returnRes = await api.post(`/quotes/${id}/fetch-return-xml`, {
                                                                filename: filename // Backend will swap extension to .xml
                                                            });
                                                            console.log("Values updated from return XML", returnRes.data);
                                                            // Refresh valid quote data
                                                            fetchQuote();
                                                            // Subtle notification (optional) - User said "one shot" so maybe just refresh is enough.
                                                        } catch (fetchErr) {
                                                            console.error("Failed to fetch return XML after delay", fetchErr);
                                                            // Silent fail or minimal warning? 
                                                            // User expects it to update, so if it fails, maybe a warning is needed or just log.
                                                            // Given "one shot" preference, console log is safer unless critical.
                                                        }
                                                    }, 7000);

                                                } catch (e) {
                                                    console.error("Failed to save RAK to network", e);
                                                    alert("Attention: Le fichier .rak n'a pas pu être copié automatiquement dans le dossier d'échange (demo/echange). Vérifiez le montage réseau.");
                                                }

                                                // Reset input
                                                e.target.value = '';
                                            }}
                                        />
                                        <label
                                            htmlFor="excel-reintegrate"
                                            className="cursor-pointer inline-flex items-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 mr-4"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.657 48.657 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                                            </svg>
                                            Réintégrer Excel
                                        </label>

                                        <label
                                            htmlFor={isNew ? '' : "xml-upload"}
                                            className={`cursor-pointer inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm ${(!id || isNew) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                            </svg>
                                            Importer XML
                                        </label>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-4 flex justify-center w-full px-4">
                    <button
                        type="button"
                        onClick={async () => {
                            if (!id) return;
                            try {
                                const response = await api.get(`/quotes/${id}/download-result`, {
                                    responseType: 'blob',
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                const contentDisposition = response.headers['content-disposition'];
                                let fileName = 'soumission.xlsx';
                                if (contentDisposition) {
                                    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                                    if (fileNameMatch && fileNameMatch.length === 2)
                                        fileName = fileNameMatch[1];
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
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2 cursor-pointer text-lg font-semibold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {getExcelFilename()}
                    </button>
                </div>
            </div>
        </form >
    );
}
