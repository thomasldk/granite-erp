import React, { useEffect, useState } from 'react';
import { getMaterials, deleteMaterial, Material } from '../../services/catalogueService'; // Added deleteMaterial
import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; // Added DocumentTextIcon

// ... existing code ...



const CatalogueList: React.FC<{ category?: string }> = ({ category }) => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMaterials();
    }, [category]);

    const loadMaterials = async () => {
        setLoading(true);
        try {
            const data = await getMaterials();
            if (category) {
                setMaterials(data.filter(m => m.category === category));
            } else {
                setMaterials(data);
            }
        } catch (error) {
            console.error('Failed to load catalogue', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card navigation

        const code = window.prompt("Pour confirmer la suppression, entrez le code de suppression :");
        if (code === "1234") {
            try {
                await deleteMaterial(id);
                loadMaterials(); // Refresh list
            } catch (error) {
                console.error('Failed to delete material', error);
                alert('Erreur lors de la suppression');
            }
        } else if (code !== null) {
            alert("Code incorrect.");
        }
    };

    const handleDeleteGroup = async (e: React.MouseEvent, groupName: string, variants: Material[]) => {
        e.stopPropagation();

        const code = window.prompt(`Pour supprimer TOUTES les variantes de "${groupName}", entrez le code de suppression :`);
        if (code === "1234") {
            try {
                // Delete all variants in parallel
                await Promise.all(variants.map(v => deleteMaterial(v.id)));
                loadMaterials();
            } catch (error) {
                console.error('Failed to delete group', error);
                alert('Erreur lors de la suppression du groupe');
            }
        } else if (code !== null) {
            alert("Code incorrect.");
        }
    };

    // Grouping Logic for Stones
    const groupedStones = React.useMemo(() => {
        if (!materials) return [];
        const groups: { [name: string]: Material[] } = {};

        materials.forEach(m => {
            if (m.category === 'Stone' || (!m.category && category === 'Stone')) {
                if (!groups[m.name]) groups[m.name] = [];
                groups[m.name].push(m);
            }
        });

        return Object.values(groups);
    }, [materials, category]);

    const otherMaterials = materials.filter(m => m.category !== 'Stone' && (m.category || category !== 'Stone'));

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    {category === 'Stone' ? 'Catalogue Pierre' : category === 'Standard' ? 'Produits Standards' : 'Catalogue Général'}
                </h1>
                <Link
                    to={category ? `/catalogue/${category === 'Stone' ? 'stone' : 'standard'}/new` : "/catalogue/new"}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-200"
                >
                    + {category === 'Stone' ? 'Nouvelle Pierre' : category === 'Standard' ? 'Nouveau Produit' : 'Nouveau Matériau'}
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p>Chargement du catalogue...</p>
                ) : materials.length === 0 ? (
                    <div className="col-span-3 text-center py-10 bg-white rounded-lg border border-gray-200">
                        <p className="text-gray-500">Le catalogue est vide.</p>
                    </div>
                ) : (
                    <>
                        {/* Display Grouped Stones */}
                        {groupedStones.map((group) => {
                            const main = group[0]; // Use first item for display info
                            // Sort variants: S, A, B, C
                            const order = ['S', 'A', 'B', 'C'];
                            const sortedVariants = [...group].sort((a, b) => {
                                return order.indexOf(a.quality || 'S') - order.indexOf(b.quality || 'S');
                            });

                            return (
                                <div
                                    key={main.name}
                                    onClick={() => navigate(`/catalogue/edit/${main.id}`)}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200 border border-gray-100 cursor-pointer group"
                                >
                                    <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                                        {main.imageUrl ? (
                                            <img src={main.imageUrl} alt={main.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400 text-4xl">🪨</span>
                                        )}

                                        {/* Delete Group Button - Top Right */}
                                        <div className="absolute top-2 right-2 z-10">
                                            <button
                                                onClick={(e) => handleDeleteGroup(e, main.name, group)}
                                                className="bg-white p-2 rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                title="Supprimer toute la pierre"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                            <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-auto">
                                                Modifier
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{main.name}</h3>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{main.type}</span>
                                        </div>
                                        {main.supplier && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-sm text-primary font-semibold">{main.supplier.name}</p>
                                                {main.supplier.priceListUrl && (
                                                    <a
                                                        href={`${main.supplier.priceListUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title={`Liste de prix ${main.supplier.priceListDate || ''}`}
                                                        className="text-blue-500 hover:text-blue-700"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DocumentTextIcon className="h-5 w-5" />
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-500 mb-3 border-b pb-2">
                                            Densité: {main.density} {main.densityUnit}
                                        </div>

                                        {/* Variants Table */}
                                        <table className="w-full text-xs text-left">
                                            <thead>
                                                <tr className="text-gray-500 border-b">
                                                    <th className="pb-1 font-normal">Qualité</th>
                                                    <th className="pb-1 font-normal text-right">Achat</th>
                                                    <th className="pb-1 font-normal text-right">Vente</th>
                                                    <th className="pb-1 font-normal"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedVariants.map(v => (
                                                    <tr key={v.id} className="border-b last:border-0 border-gray-50 text-gray-700 hover:bg-gray-50">
                                                        <td className="py-1">
                                                            <span className={`inline-block w-4 h-4 text-center rounded font-bold ${v.quality === 'S' ? 'bg-gray-200 text-gray-800' :
                                                                v.quality === 'A' ? 'bg-blue-100 text-blue-800' :
                                                                    v.quality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                }`}>
                                                                {v.quality}
                                                            </span>
                                                        </td>
                                                        <td className="py-1 text-right">
                                                            {v.purchasePrice}$ / {v.unit === 'm2' ? 'm³' : 'pi³'}
                                                        </td>
                                                        <td className="py-1 text-right">
                                                            {v.sellingPrice ? `${v.sellingPrice}$` : '-'}
                                                        </td>
                                                        <td className="py-1 text-right">
                                                            <button
                                                                onClick={(e) => handleDelete(e, v.id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Display Other Materials (Standard) */}
                        {otherMaterials.map((mat) => (
                            <div
                                key={mat.id}
                                onClick={() => navigate(`/catalogue/edit/${mat.id}`)}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-200 border border-gray-100 cursor-pointer group"
                            >
                                <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                                    {mat.imageUrl ? (
                                        <img src={mat.imageUrl} alt={mat.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-4xl">📦</span>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <button
                                            onClick={(e) => handleDelete(e, mat.id)}
                                            className="bg-white p-2 rounded-full shadow hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                        {/* Modifier label centered */}
                                        <span className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded-full font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 pointer-events-auto">
                                            Modifier
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{mat.name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">{mat.type}</p>
                                    <div className="flex justify-between text-sm text-gray-600 border-t pt-2 mt-2">
                                        <span>Achat:</span>
                                        <span className="font-bold">{mat.purchasePrice}$ / {mat.unit === 'm2' ? 'm³' : 'pi³'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 border-t pt-2 mt-1">
                                        <span>Vente:</span>
                                        <span className="font-bold">{mat.sellingPrice}$</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div >
    );
};

export default CatalogueList;
