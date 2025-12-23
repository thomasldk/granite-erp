import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createMaterial, getMaterialById, updateMaterial, getMaterials } from '../../services/catalogueService';
import { getThirdParties, ThirdParty } from '../../services/thirdPartyService';

interface Variant {
    id?: string;
    quality: string;
    purchasePrice: string;
    sellingPrice: string;
    wasteFactor: number;
    checked: boolean;
}

const StoneForm: React.FC<{ defaultCategory?: string }> = ({ defaultCategory }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = !!id;

    const [suppliers, setSuppliers] = useState<ThirdParty[]>([]);
    const [variants, setVariants] = useState<Variant[]>([
        { quality: 'S', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: true },
        { quality: 'A', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
        { quality: 'B', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
        { quality: 'C', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
    ]);

    const [formData, setFormData] = useState({
        name: '',
        category: defaultCategory || 'Stone',
        type: defaultCategory === 'Standard' ? '' : 'Granite',
        density: '175',
        densityUnit: 'lb/ft3',
        purchasePrice: '', // Only used for Standard
        sellingPrice: '', // Only used for Standard
        unit: 'sqft',
        sellingUnit: 'sqft',
        imageUrl: '',
        supplierId: ''
    });

    useEffect(() => {
        if (isEditMode && id) {
            loadMaterial(id);
        }
    }, [isEditMode, id]);

    const loadMaterial = async (materialId: string) => {
        try {
            const material = await getMaterialById(materialId);

            // Set common form data
            setFormData({
                name: material.name,
                category: material.category || 'Stone',
                type: material.type,
                density: material.density ? material.density.toString() : '',
                densityUnit: material.densityUnit || 'lb/ft3',
                purchasePrice: material.purchasePrice.toString(),
                sellingPrice: material.sellingPrice ? material.sellingPrice.toString() : '',
                unit: material.unit || 'sqft',
                sellingUnit: material.sellingUnit || 'sqft',
                // @ts-ignore
                quality: material.quality || 'S',
                // @ts-ignore
                wasteFactor: material.wasteFactor || 4,
                imageUrl: material.imageUrl || '',
                supplierId: material.supplierId || ''
            });

            // If it's a stone, load siblings (Same Name) to populate variants
            if (material.category === 'Stone' || (!material.category)) {
                try {
                    const siblings = await getMaterials({ name: material.name });
                    // Map siblings to variants logic
                    const newVariants = [
                        { quality: 'S', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
                        { quality: 'A', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
                        { quality: 'B', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
                        { quality: 'C', purchasePrice: '', sellingPrice: '', wasteFactor: 4, checked: false },
                    ].map(v => {
                        // Find if this quality exists in siblings
                        const match = siblings.find(s => s.quality === v.quality);
                        if (match) {
                            return {
                                id: match.id,
                                quality: match.quality!,
                                purchasePrice: match.purchasePrice.toString(),
                                sellingPrice: match.sellingPrice?.toString() || '',
                                wasteFactor: match.wasteFactor || 4,
                                checked: true
                            };
                        }
                        // Default empty variant
                        return v;
                    });
                    setVariants(newVariants);
                } catch (e) {
                    console.error("Error loading siblings", e);
                }
            }

        } catch (error) {
            console.error('Error loading material', error);
            alert('Impossible de charger le matériau');
        }
    };

    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const data = await getThirdParties();
                // Relaxed filter: Validates "Fournisseur de pierre", "Fournisseur de Pierre", etc.
                const stoneSuppliers = data.filter(s =>
                    s.type === 'Supplier' &&
                    s.supplierType?.toLowerCase() === 'fournisseur de pierre'
                );
                setSuppliers(stoneSuppliers);
            } catch (error) {
                console.error('Error loading suppliers', error);
            }
        };
        if (defaultCategory === 'Stone' || !defaultCategory) {
            loadSuppliers();
        }
    }, [defaultCategory]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVariantChange = (index: number, field: string, value: any) => {
        const newVariants = [...variants];
        (newVariants[index] as any)[field] = value;
        setVariants(newVariants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const commonPayload = {
                name: formData.name,
                category: formData.category,
                type: formData.type,
                density: parseFloat(formData.density),
                densityUnit: formData.densityUnit,
                unit: formData.unit,
                sellingUnit: formData.sellingUnit,
                imageUrl: formData.imageUrl,
                supplierId: formData.supplierId || undefined
            };

            if (formData.category === 'Stone') {
                // Stone Logic (Create or Update Variants)
                const variantsToProcess = variants.filter(v => v.checked);
                if (variantsToProcess.length === 0) {
                    alert("Veuillez sélectionner au moins une qualité.");
                    return;
                }

                await Promise.all(variantsToProcess.map(async (v) => {
                    const payload = {
                        ...commonPayload,
                        purchasePrice: parseFloat(v.purchasePrice || '0'),
                        sellingPrice: v.sellingPrice ? parseFloat(v.sellingPrice) : undefined,
                        quality: v.quality,
                        wasteFactor: v.wasteFactor,
                    };

                    if (v.id) {
                        // Update existing variant
                        await updateMaterial(v.id, payload);
                    } else {
                        // Create new variant
                        await createMaterial(payload);
                    }
                }));

            } else {
                // Standard Product Logic (Single Item)
                if (isEditMode && id) {
                    const payload = {
                        ...commonPayload,
                        purchasePrice: parseFloat(formData.purchasePrice),
                        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
                        quality: 'S',
                        wasteFactor: 0,
                    };
                    await updateMaterial(id, payload);
                } else {
                    const payload = {
                        ...commonPayload,
                        purchasePrice: parseFloat(formData.purchasePrice),
                        sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : undefined,
                        quality: 'S',
                        wasteFactor: 0,
                    };
                    await createMaterial(payload);
                }
            }
            navigate(formData.category === 'Standard' ? '/catalogue/standard' : '/catalogue/stone');
        } catch (error) {
            console.error('Error saving material', error);
            alert('Erreur lors de la sauvegarde');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {isEditMode ? 'Modifier' : 'Ajouter'} {formData.category === 'Standard' ? 'un Produit Standard' : 'un Matériau (Pierre)'}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border border-gray-100">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                            Nom du Matériau
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Ex: Granite Noir St-Henry"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    {/* Supplier Dropdown - Only for Stone */}
                    {formData.category === 'Stone' && (
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplierId">
                                Fournisseur
                            </label>
                            <select
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                                id="supplierId"
                                name="supplierId"
                                value={formData.supplierId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Sélectionner un fournisseur --</option>
                                {suppliers.map(supplier => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Seuls les "Fournisseurs de pierre" sont listés.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                        Type / Catégorie
                    </label>
                    {formData.category === 'Standard' ? (
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            id="type"
                            name="type"
                            type="text"
                            placeholder="Ex: Évier, Outil, Consommable"
                            value={formData.type}
                            onChange={handleChange}
                        />
                    ) : (
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                            id="type"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                        >
                            <option value="Granite">Granite</option>
                            <option value="Calcaire">Calcaire</option>
                            <option value="Grès">Grès</option>
                        </select>
                    )}
                </div>


                <div className="flex gap-4 mb-4">
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="density">
                            Densité
                        </label>
                        <div className="flex">
                            <input
                                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                id="density"
                                name="density"
                                type="number"
                                step="0.1"
                                value={formData.density}
                                onChange={handleChange}
                            />
                            <select
                                className="shadow border rounded-r bg-gray-100 border-l-0 py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                                name="densityUnit"
                                value={formData.densityUnit}
                                onChange={handleChange}
                            >
                                <option value="lb/ft3">lb/ft³</option>
                                <option value="kg/m3">kg/m³</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sera identique pour tous les codes.</p>
                    </div>

                    {/* Common Units */}
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Unité Achat</label>
                        <select
                            className="shadow border rounded bg-gray-100 w-full py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                        >
                            <option value="sqft">/pi³</option>
                            <option value="m2">/m³</option>
                        </select>
                    </div>
                    <div className="w-1/3">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Unité Vente</label>
                        <select
                            className="shadow border rounded bg-gray-100 w-full py-2 px-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
                            name="sellingUnit"
                            value={formData.sellingUnit}
                            onChange={handleChange}
                        >
                            <option value="sqft">/pi³</option>
                            <option value="m2">/m³</option>
                        </select>
                    </div>
                </div>

                {/* Bulk Entry Table for New Stones OR Editing Stones */}
                {formData.category === 'Stone' ? (
                    <div className="mb-6 mt-6 border-t pt-4">
                        <label className="block text-lg font-bold text-gray-800 mb-4">Codes & Prix par Qualité</label>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qualité</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Prix Achat ($/{formData.unit === 'sqft' ? 'pi³' : 'm³'})</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Prix Vente ($/{formData.sellingUnit === 'sqft' ? 'pi³' : 'm³'})</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Perte (%)</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Créer/Edit</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {variants.map((variant, idx) => (
                                        <tr key={variant.quality} className={variant.checked ? 'bg-blue-50' : ''}>
                                            <td className="px-3 py-2">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${variant.quality === 'S' ? 'bg-gray-200 text-gray-800' :
                                                    variant.quality === 'A' ? 'bg-blue-100 text-blue-800' :
                                                        variant.quality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {variant.quality}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number" step="0.01" placeholder="0.00"
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    value={variant.purchasePrice}
                                                    onChange={(e) => handleVariantChange(idx, 'purchasePrice', e.target.value)}
                                                    disabled={!variant.checked}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number" step="0.01" placeholder="0.00"
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    value={variant.sellingPrice}
                                                    onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                                                    disabled={!variant.checked}
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number" step="0.1"
                                                    className="block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    value={variant.wasteFactor}
                                                    onChange={(e) => handleVariantChange(idx, 'wasteFactor', e.target.value)}
                                                    disabled={!variant.checked}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    checked={variant.checked}
                                                    onChange={(e) => handleVariantChange(idx, 'checked', e.target.checked)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    // Single Entry for Edit or Standard Product
                    <div className="flex gap-4 mb-4">
                        <div className="w-1/3">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="purchasePrice">
                                Px Achat
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                id="purchasePrice"
                                name="purchasePrice"
                                type="number"
                                step="0.01"
                                value={formData.purchasePrice}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="w-1/3">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sellingPrice">
                                Px Vente
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                                id="sellingPrice"
                                name="sellingPrice"
                                type="number"
                                step="0.01"
                                value={formData.sellingPrice}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {isEditMode && formData.category === 'Stone' && (
                            <>
                                <div className="w-1/6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Qualité</label>
                                    <select
                                        className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight"
                                        name="quality"
                                        value={(formData as any).quality}
                                        onChange={handleChange as any}
                                    >
                                        {['S', 'A', 'B', 'C'].map(q => <option key={q} value={q}>{q}</option>)}
                                    </select>
                                </div>
                                <div className="w-1/6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Perte</label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                        name="wasteFactor"
                                        type="number"
                                        step="0.1"
                                        value={(formData as any).wasteFactor}
                                        onChange={handleChange as any}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Image du Matériau
                    </label>
                    <div className="flex items-start gap-4">
                        <div className="w-full">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const formDataUpload = new FormData();
                                    formDataUpload.append('file', file);
                                    try {
                                        const response = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formDataUpload
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            setFormData(prev => ({ ...prev, imageUrl: data.url }));
                                        } else {
                                            alert('Erreur lors du téléversement.');
                                        }
                                    } catch (error) {
                                        console.error('Upload failed:', error);
                                        alert('Erreur réseau.');
                                    }
                                }}
                                className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Formats acceptés: JPG, PNG, WebP</p>
                            {/* Fallback URL input if needed, or just hidden/readonly if we want to show the path */}
                            <input
                                type="text"
                                className="mt-2 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary text-xs text-gray-400"
                                placeholder="Ou URL directe (https://...)"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                name="imageUrl"
                            />
                        </div>
                        {formData.imageUrl && (
                            <div className="w-32 h-32 flex-shrink-0 border rounded overflow-hidden bg-gray-100">
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        type="submit"
                    >
                        {isEditMode ? 'Mettre à jour' : (formData.category === 'Stone') ? `Créer/MAJ les pierres (${variants.filter(v => v.checked).length})` : 'Enregistrer'}
                    </button>
                    <button
                        className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800"
                        type="button"
                        onClick={() => navigate('/catalogue')}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StoneForm;
