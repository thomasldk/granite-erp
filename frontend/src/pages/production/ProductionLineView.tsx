
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ChevronDownIcon, Square3Stack3DIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProductionItemModal from '../../components/ProductionItemModal';

// Define strict types matching the backend response
interface QuoteItem {
    id: string;
    lineNo?: string;
    tag?: string;
    description: string;
    quantity: number;
    length?: number;
    width?: number;
    thickness?: number;
    unit?: string;
    material?: string; // Color/Material
    finish?: string;
    refReference?: string; // REF
    product?: string;      // Producto
    netArea?: number;
    netVolume?: number;
    totalWeight?: number;
    unitPrice?: number;
    totalPrice?: number;
    productionStatus?: string;
}

interface WorkOrder {
    id: string;
    reference: string;
    mepDate: string;
    deadlineDate: string;
    deliveryDate: string;
    productionSite?: { name: string };
    clientPO?: string;
    productionWeeks?: number;
    quote: {
        client: { name: string };
        project: { name: string; measureSystem?: string };
        items: QuoteItem[];
    };
    pallets: { items: { quoteItemId: string; quantity: number }[] }[];
}

interface ProductionLineViewProps {
    workOrders: WorkOrder[];
}

export default function ProductionLineView({ workOrders }: ProductionLineViewProps) {
    console.log("ProductionLineView WorkOrders:", workOrders);
    // State for collapsed/expanded groups
    // Key format: "SiteName|ClientName"
    // State for collapsed/expanded groups
    // Key format: "SiteName|ClientName"
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    // State for inline date editing
    const [editingDateId, setEditingDateId] = useState<string | null>(null);

    // State for interactive wide view (scroll mode)
    // State for interactive wide view (scroll mode)
    const [wideViewGroups, setWideViewGroups] = useState<Record<string, boolean>>({});

    // Modal State
    const [selectedItem, setSelectedItem] = useState<{ item: QuoteItem, wo: WorkOrder } | null>(null);

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Toggle wide view for a specific group
    const toggleWideView = (key: string) => {
        setWideViewGroups(prev => ({ ...prev, [key]: !true })); // Toggle merely switches valid/invalid, forcing true is safer if "click to expand". User said "passe en mode scroll". Let's toggle.
        setWideViewGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Helper to calculate Produced Qty per Item across all pallets of a WO
    const getProducedQty = (wo: WorkOrder, quoteItemId: string) => {
        let total = 0;
        if (wo.pallets) {
            wo.pallets.forEach(pallet => {
                pallet.items.forEach(pItem => {
                    if (pItem.quoteItemId === quoteItemId) {
                        total += pItem.quantity;
                    }
                });
            });
        }
        return total;
    };

    const handleDateUpdate = async (wo: WorkOrder, newDateString: string) => {
        if (!newDateString) return; // Ignore empty

        try {
            await api.patch(`/work-orders/${wo.id}`, { deliveryDate: new Date(newDateString) });
            // Optimistic update or reload
            setEditingDateId(null);
            window.location.reload();
        } catch (e) {
            console.error("Failed to update date", e);
            alert("Erreur lors de la sauvegarde de la date.");
        }
    };

    // 1. Group Data: Site -> Client -> WorkOrders
    const groupedData = useMemo(() => {
        const groups: Record<string, Record<string, WorkOrder[]>> = {};

        workOrders.forEach(wo => {
            const site = wo.productionSite?.name || 'Sans Site';
            const client = wo.quote?.client?.name || 'Client Inconnu';

            if (!groups[site]) groups[site] = {};
            if (!groups[site][client]) groups[site][client] = [];

            groups[site][client].push(wo);
        });

        return groups;
    }, [workOrders]);

    // Helper for formatting numbers
    const fmt = (n?: number, decimals = 2) => (n || 0).toLocaleString('fr-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

    return (
        <div className="overflow-x-auto">
            {Object.entries(groupedData).map(([siteName, clients]) => (
                <div key={siteName} className="mb-8">
                    {/* Site Header */}
                    <div className="bg-gray-800 text-white px-4 py-2 font-bold text-lg uppercase flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="mr-2">🏭</span> {siteName}
                        </div>
                        {/* Calculated Site Totals */}
                        {(() => {
                            const allSiteWos = Object.values(clients).flat();
                            const siteTotalArea = allSiteWos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.netArea || 0), 0), 0);
                            const siteTotalVolume = allSiteWos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.netVolume || 0), 0), 0);
                            const siteTotalWeight = allSiteWos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.totalWeight || 0), 0), 0);
                            const siteTotalPrice = allSiteWos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.totalPrice || 0), 0), 0);

                            return (
                                <div className="flex gap-6 text-sm font-normal normal-case text-gray-300">
                                    <div><span className="text-gray-500 text-xs uppercase mr-1">Surface:</span>{fmt(siteTotalArea)} pi²</div>
                                    <div><span className="text-gray-500 text-xs uppercase mr-1">Vol:</span>{fmt(siteTotalVolume)} pi³</div>
                                    <div><span className="text-gray-500 text-xs uppercase mr-1">Poids:</span>{fmt(siteTotalWeight)} lbs</div>
                                    <div><span className="text-gray-500 text-xs uppercase mr-1">Total:</span>{fmt(siteTotalPrice)} $</div>
                                </div>
                            );
                        })()}
                    </div>

                    {Object.entries(clients).map(([clientName, wos]) => {
                        const groupKey = `${siteName}| ${clientName} `;
                        // const isExpanded = expandedGroups[groupKey] !== false; 
                        // Let's assume default CLOSED to save space? Or OPEN? Screenshot shows expanded.
                        // Let's default to TRUE (undefined counts as true)
                        const isOpen = expandedGroups[groupKey] === undefined ? true : expandedGroups[groupKey];

                        // Calculate Client Totals
                        const totalArea = wos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.netArea || 0), 0), 0);
                        const totalVolume = wos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.netVolume || 0), 0), 0);
                        const totalWeight = wos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.totalWeight || 0), 0), 0);
                        const totalPrice = wos.reduce((acc, wo) => acc + (wo.quote?.items || []).reduce((s, i) => s + (i.totalPrice || 0), 0), 0);

                        return (
                            <div key={clientName} className="border-l-4 border-blue-500 mb-2 bg-white shadow-sm">
                                {/* Client Header Row (Clickable) */}
                                <div
                                    className="flex items-center justify-between bg-blue-50 px-4 py-3 cursor-pointer hover:bg-blue-100 transition-colors"
                                    onClick={() => toggleGroup(groupKey)}
                                >
                                    <div className="flex items-center gap-2">
                                        {isOpen ? <ChevronDownIcon className="w-5 h-5 text-blue-700" /> : <ChevronRightIcon className="w-5 h-5 text-gray-500" />}
                                        <span className="font-bold text-blue-900 text-base">{clientName}</span>
                                        <span className="text-xs text-gray-500 ml-2">({wos.length} BTs)</span>
                                    </div>

                                    {/* Summary Stats in Header */}
                                    <div className="flex gap-6 text-sm font-medium text-gray-700">
                                        <div><span className="text-gray-400 text-xs uppercase mr-1">Surface:</span>{fmt(totalArea)} pi²</div>
                                        <div><span className="text-gray-400 text-xs uppercase mr-1">Vol:</span>{fmt(totalVolume)} pi³</div>
                                        <div><span className="text-gray-400 text-xs uppercase mr-1">Poids:</span>{fmt(totalWeight)} lbs</div>
                                        <div><span className="text-gray-400 text-xs uppercase mr-1">Total:</span>{fmt(totalPrice)} $</div>
                                    </div>
                                </div>

                                {/* Detailed Content */}
                                {isOpen && (
                                    <div
                                        className="overflow-x-auto cursor-pointer transition-all"
                                        onClick={() => toggleWideView(groupKey)}
                                        title="Cliquez pour agrandir / réduire"
                                    >
                                        <table className={`${wideViewGroups[groupKey] ? 'min-w-[1600px]' : 'min-w-full'} text - xs text - gray - 600 transition - all duration - 300`}>
                                            <thead className="bg-gray-100 text-gray-500 font-semibold border-b">
                                                <tr>
                                                    {/* Work Order Info */}
                                                    <th className="px-2 py-2 text-left w-24">BT #</th>
                                                    <th className="px-2 py-2 text-left w-32">Projet</th>
                                                    <th className="px-2 py-2 text-left w-24">PO #</th>
                                                    <th className="px-2 py-2 text-left w-32">Dates (MEP / Liv)</th>

                                                    {/* Item Info */}
                                                    <th className="px-2 py-2 text-center w-16">Ligne</th>
                                                    <th className="px-2 py-2 text-left w-48">Couleur</th>
                                                    <th className="px-2 py-2 text-left w-32">Tag / Ref</th>
                                                    <th className="px-2 py-2 text-left w-64">Description</th>
                                                    <th className="px-2 py-2 text-center">Qté</th>
                                                    <th className="px-2 py-2 text-center">Dim (L x l x É)</th>
                                                    <th className="px-2 py-2 text-center">Reste</th>
                                                    <th className="px-2 py-2 text-right">Surface</th>
                                                    <th className="px-2 py-2 text-right">Volume</th>
                                                    <th className="px-2 py-2 text-right">Poids</th>
                                                    <th className="px-2 py-2 text-right">Prix Restant</th>
                                                    <th className="px-2 py-2 text-right">Prix Init</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {wos.map(wo => (
                                                    <React.Fragment key={wo.id}>
                                                        {/* Work Order Group Header (Optional, or just list items with rowspan?) 
                                                            To mimic screenshot, we list items. But items belong to a WO.
                                                            Let's render each item, and for the first item of a WO, we show WO details.
                                                        */}
                                                        {(!wo.quote?.items || wo.quote.items.length === 0) && (
                                                            <tr>
                                                                <td className="px-2 py-2 font-bold text-blue-600">{wo.reference}</td>
                                                                <td colSpan={12} className="px-2 py-2 text-gray-400 italic">Aucun item dans ce bon de travail</td>
                                                            </tr>
                                                        )}
                                                        {(wo.quote?.items || []).map((item, index) => (
                                                            <tr
                                                                key={item.id}
                                                                className="hover:bg-yellow-50 transition-colors cursor-pointer"
                                                                onClick={() => setSelectedItem({ item, wo })}
                                                            >
                                                                {/* WO Columns: Only show on first item */}
                                                                {index === 0 ? (
                                                                    <>
                                                                        <td className="px-2 py-2 align-top font-bold text-blue-600 border-r" rowSpan={wo.quote?.items?.length || 1}>
                                                                            <div className="flex items-center gap-2">
                                                                                <Link to={`/production/${wo.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{wo.reference}</Link>
                                                                                <Link to={`/production/${wo.id}`} onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 transition-colors" title="Gérer les palettes">
                                                                                    <Square3Stack3DIcon className="w-5 h-5" />
                                                                                </Link>
                                                                            </div>
                                                                            <div className="text-[10px] text-gray-400 font-normal mt-1">P: {wo.pallets?.length || 0}</div>
                                                                        </td>
                                                                        <td className="px-2 py-2 align-top border-r" rowSpan={wo.quote?.items?.length || 1}>{wo.quote?.project?.name}</td>
                                                                        <td className="px-2 py-2 align-top border-r" rowSpan={wo.quote?.items?.length || 1}>{wo.clientPO || '-'}</td>
                                                                        <td className="px-2 py-2 align-top text-xs border-r" rowSpan={wo.quote?.items?.length || 1}>
                                                                            <div title="Mise En Prod">{new Date(wo.mepDate).toLocaleDateString()}</div>

                                                                            {/* Editable Delivery Date */}
                                                                            {editingDateId === wo.id ? (
                                                                                <input
                                                                                    type="date"
                                                                                    autoFocus
                                                                                    className="text-xs border rounded p-1 w-24"
                                                                                    defaultValue={(() => {
                                                                                        try {
                                                                                            return wo.deliveryDate ? new Date(wo.deliveryDate).toISOString().split('T')[0] : '';
                                                                                        } catch (e) {
                                                                                            return '';
                                                                                        }
                                                                                    })()}
                                                                                    onBlur={() => setEditingDateId(null)}
                                                                                    onChange={(e) => handleDateUpdate(wo, e.target.value)}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                            ) : (
                                                                                <div
                                                                                    title="Cliquer pour modifier"
                                                                                    className="text-red-500 font-bold cursor-pointer hover:bg-gray-100 rounded px-1 -ml-1 flex items-center gap-1"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingDateId(wo.id);
                                                                                    }}
                                                                                >
                                                                                    {wo.deliveryDate ? new Date(wo.deliveryDate).toLocaleDateString() : '-'}
                                                                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-400">✏️</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </>
                                                                ) : null /* Render nothing for subsequent rows */}

                                                                {/* Item Columns */}
                                                                <td className="px-2 py-1 text-center bg-gray-50 text-xs">{item.lineNo || index + 1}</td>
                                                                <td className="px-2 py-1 text-xs">{item.material || '-'}</td>
                                                                <td className="px-2 py-1 font-medium">{item.tag || item.refReference || '-'}</td>
                                                                <td className="px-2 py-1 text-xs text-gray-500 truncate max-w-[200px]" title={item.description}>{item.description}</td>
                                                                <td className="px-2 py-1 text-center font-bold bg-gray-50">{item.quantity}</td>
                                                                <td className="px-2 py-1 text-center whitespace-nowrap text-xs">
                                                                    {item.length ? `${item.length} "` : '-'} x {item.width ? `${item.width}"` : '-'} x {item.thickness ? `${item.thickness} "` : '-'}
                                                                </td >
                                                                <td className="px-2 py-1 text-center font-bold">
                                                                    {(() => {
                                                                        const rem = Math.max(0, item.quantity - getProducedQty(wo, item.id));
                                                                        return (
                                                                            <span className={rem === 0 ? 'text-green-600' : 'text-orange-600'}>
                                                                                {rem}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>

                                                                {/* Calculated Remaining Columns */}
                                                                <td className={`px-2 py-1 text-right font-medium ${Math.max(0, item.quantity - getProducedQty(wo, item.id)) === 0 ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                                                                    {(() => {
                                                                        const rem = Math.max(0, item.quantity - getProducedQty(wo, item.id));
                                                                        const isImperial = (wo.quote?.project?.measureSystem === 'Imperial') || (!wo.quote?.project?.measureSystem);
                                                                        const unitArea = isImperial ? ((item.length || 0) * (item.width || 0) / 144) : ((item.length || 0) / 1000 * (item.width || 0) / 1000);
                                                                        const label = isImperial ? 'pi²' : 'm²';
                                                                        return `${(unitArea * rem).toLocaleString('fr-CA', { maximumFractionDigits: 2 })} ${label}`;
                                                                    })()}
                                                                </td>
                                                                <td className={`px-2 py-1 text-right font-medium whitespace-nowrap ${Math.max(0, item.quantity - getProducedQty(wo, item.id)) === 0 ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                                                                    {(() => {
                                                                        const rem = Math.max(0, item.quantity - getProducedQty(wo, item.id));
                                                                        const isImperial = (wo.quote?.project?.measureSystem === 'Imperial') || (!wo.quote?.project?.measureSystem);
                                                                        const unitVol = isImperial ? ((item.length || 0) * (item.width || 0) * (item.thickness || 0) / 1728) : ((item.length || 0) / 1000 * (item.width || 0) / 1000 * (item.thickness || 0) / 1000);
                                                                        const label = isImperial ? 'pi³' : 'm³';
                                                                        return `${(unitVol * rem).toLocaleString('fr-CA', { maximumFractionDigits: 2 })} ${label}`;
                                                                    })()}
                                                                </td>
                                                                <td className={`px-2 py-1 text-right font-medium whitespace-nowrap ${Math.max(0, item.quantity - getProducedQty(wo, item.id)) === 0 ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                                                                    {(() => {
                                                                        const rem = Math.max(0, item.quantity - getProducedQty(wo, item.id));
                                                                        const isImperial = (wo.quote?.project?.measureSystem === 'Imperial') || (!wo.quote?.project?.measureSystem);

                                                                        let unitWeight = 0;
                                                                        if (isImperial) {
                                                                            const vol = (item.length || 0) * (item.width || 0) * (item.thickness || 0) / 1728;
                                                                            unitWeight = vol * 175.24;
                                                                        } else {
                                                                            const volM3 = (item.length || 0) / 1000 * (item.width || 0) / 1000 * (item.thickness || 0) / 1000;
                                                                            const volFt3 = volM3 * 35.3146667;
                                                                            unitWeight = volFt3 * 175.24;
                                                                        }

                                                                        return `${(unitWeight * rem).toLocaleString('fr-CA', { maximumFractionDigits: 0 })} lbs`;
                                                                    })()}
                                                                </td>
                                                                <td className="px-2 py-1 text-right font-bold text-green-700">
                                                                    {(() => {
                                                                        const rem = Math.max(0, item.quantity - getProducedQty(wo, item.id));
                                                                        return ((rem * (item.unitPrice || 0))).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });
                                                                    })()}
                                                                </td>
                                                                <td className="px-2 py-1 text-right tabular-nums font-medium text-gray-400 text-xs">{(item.quantity * (item.unitPrice || 0)).toLocaleString('fr-CA', { maximumFractionDigits: 0 })} $</td>
                                                            </tr >
                                                        ))}
                                                        {/* Optional Divider between WOs? */}
                                                        {/* <tr className="h-2 bg-gray-100"><td colSpan={13}></td></tr> */}
                                                    </React.Fragment >
                                                ))}
                                            </tbody >
                                        </table >
                                    </div >
                                )}
                            </div >
                        );
                    })}
                </div >
            ))}

            {
                Object.keys(groupedData).length === 0 && (
                    <div className="text-center py-10 text-gray-500">Aucune commande trouvée.</div>
                )
            }

            {/* Item Detail Modal */}
            {
                selectedItem && (
                    <ProductionItemModal
                        isOpen={!!selectedItem}
                        onClose={() => setSelectedItem(null)}
                        item={selectedItem.item}
                        project={selectedItem.wo.quote.project}
                        client={selectedItem.wo.quote.client}
                        producedQty={getProducedQty(selectedItem.wo, selectedItem.item.id)}
                        clientPO={selectedItem.wo.clientPO}
                        workOrderId={selectedItem.wo.id}
                    />
                )
            }
        </div >
    );
}
