// React import removed (unused)
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

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
    material?: string; // Color/Material Name
    finish?: string;
    refReference?: string;
    product?: string;
    netArea?: number;       // In sqft or m2
    netVolume?: number;     // In cuft or m3
    totalWeight?: number;   // In lbs or kg
    unitPrice?: number;
    totalPrice?: number;
}

interface Project {
    name: string;
    measureSystem?: string; // "Imperial" | "Metric"
}

interface Client {
    name: string;
}

interface ProductionItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: QuoteItem | null;
    project: Project | null;
    client: Client | null;
    producedQty: number; // Calculated from pallets
    clientPO?: string; // PO Number
    workOrderId: string; // For opening PO file
}

// Helpers
const fmt = (n?: number, decimals = 2) => (n || 0).toLocaleString('fr-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

// Default density if not found (Average Granite density ~175.24 lbs/ft3 from screenshot)
const DEFAULT_DENSITY_LBS_FT3 = 175.24;
// Metric approx: 2807 kg/m3

export default function ProductionItemModal({ isOpen, onClose, item, project, client, producedQty, clientPO, workOrderId }: ProductionItemModalProps) {
    if (!isOpen || !item) return null;

    const handleOpenPO = async () => {
        try {
            const response = await api.get(`/work-orders/${workOrderId}/po-view`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            window.open(url, '_blank');
        } catch (e) {
            alert("Impossible d'ouvrir le PO.");
        }
    };

    // --- Calculations ---
    const isImperial = (project?.measureSystem === 'Imperial') || (!project?.measureSystem); // Default Imperial
    const unitSystemLabel = isImperial ? '"' : 'mm';
    const areaUnitLabel = isImperial ? 'pi²' : 'm²';
    const volumeUnitLabel = isImperial ? 'pi³' : 'm³';
    const weightUnitLabel = 'lbs'; // Always lbs as requested

    const length = item.length || 0;
    const width = item.width || 0;
    const thickness = item.thickness || 0;

    let unitArea = 0;
    let unitVolume = 0;
    let unitWeight = 0;

    if (isImperial) {
        // Surface Unitaire (pi2) = (L x W) / 144
        unitArea = (length * width) / 144;
        // Volume Unitaire (pi3) = (L * W * T) / 1728
        unitVolume = (length * width * thickness) / 1728;
        // Poids Unitaire (lbs)
        unitWeight = unitVolume * DEFAULT_DENSITY_LBS_FT3;
    } else {
        // Metric (mm -> m)
        // Surface Unitaire (m2) = (L/1000 * W/1000)
        unitArea = (length / 1000) * (width / 1000);
        // Volume Unitaire (m3) = (L/1000 * W/1000 * T/1000)
        unitVolume = (length / 1000) * (width / 1000) * (thickness / 1000);

        // Poids Unitaire (ALWAYS LBS)
        // Convert m3 to ft3 => 1 m3 = 35.3146667 ft3
        const volumeFt3 = unitVolume * 35.3146667;
        unitWeight = volumeFt3 * DEFAULT_DENSITY_LBS_FT3;
    }

    // Totals (based on Item Quantity)
    const totalAreaCalc = unitArea * item.quantity;
    const totalVolumeCalc = unitVolume * item.quantity;
    const totalWeightCalc = unitWeight * item.quantity;

    // Financials
    const unitPrice = item.unitPrice || 0;
    const totalPrice = item.quantity * unitPrice;

    // Remaining
    const remainingQty = item.quantity - producedQty;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col border border-gray-600">

                {/* Header */}
                <div className="flex justify-between items-center bg-gray-900 text-white px-6 py-4 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">Ligne de production</span>
                        <div className="flex gap-2 ml-4">
                            <button className="text-gray-400 hover:text-white" title="Info"><i className="fas fa-info-circle"></i></button>
                            <button className="text-gray-400 hover:text-white" title="Print"><i className="fas fa-print"></i></button>
                        </div>
                    </div>

                    <button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors shadowed-button" title="Fermer">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 space-y-3 text-sm text-gray-800 bg-white">

                    {/* SECTION 1: DESCRIPTION */}
                    <div className="border border-gray-300">
                        <div className="bg-black text-white px-2 py-1 font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>Description
                        </div>
                        <div className="grid grid-cols-2 gap-0 text-xs">
                            {/* Left Column */}
                            <div className="bg-gray-200 border-r border-b border-white px-2 py-1 flex justify-between items-center">
                                <span className="text-gray-600">Système</span>
                                <span className="font-bold text-green-600">{isImperial ? 'Impérial' : 'Métrique'}</span>
                            </div>
                            <div className="bg-gray-200 border-b border-white px-2 py-1 flex justify-between items-center">
                                <span className="text-gray-600">Référence produit</span>
                                <span className="font-bold text-gray-900">{item.tag || item.refReference || '-'}</span>
                            </div>

                            <div className="bg-gray-200 border-r border-b border-white px-2 py-1 flex justify-between items-center">
                                <span className="text-gray-600">Nom du client</span>
                                <span className="font-bold text-gray-900">{client?.name || '-'}</span>
                            </div>
                            <div className="bg-gray-200 border-b border-white px-2 py-1 flex justify-between items-center">
                                <span className="text-gray-600">Référence produit</span>
                                <span className="font-bold text-gray-900">{item.tag || item.refReference || '-'}</span>
                            </div>

                            <div className="bg-gray-200 border-b border-white px-2 py-1 flex justify-between items-center col-span-2">
                                <span className="text-gray-600">Couleur</span>
                                <span className="font-bold text-gray-900">{item.material || '-'}</span>
                            </div>

                            <div className="bg-gray-200 border-r border-b border-white px-2 py-1 flex justify-between col-span-2">
                                <span className="text-gray-600">Item</span>
                                <span className="font-bold text-gray-900 text-right">{item.product || item.description || '-'}</span>
                            </div>

                            <div className="bg-gray-200 border-r border-b border-white px-2 py-1 flex justify-between col-span-2">
                                <span className="text-gray-600">Finis et détails</span>
                                <span className="font-bold italic text-gray-900 text-right">{item.finish || item.description || '-'}</span>
                            </div>

                            {/* Dimensions Block */}
                            <div className="col-span-2 grid grid-cols-2">
                                <div className="p-1 bg-gray-100 space-y-0.5 border-r border-white">
                                    <div className="flex justify-between"><span>Longueur unitaire Net</span> <strong>{fmt(length, 3)} {unitSystemLabel}</strong></div>
                                    <div className="flex justify-between"><span>Largeur net</span> <strong>{fmt(width, 3)} {unitSystemLabel}</strong></div>
                                    <div className="flex justify-between"><span>Epaisseur</span> <strong>{fmt(thickness, 3)} {unitSystemLabel}</strong></div>
                                    <div className="text-gray-500 text-[10px] mt-1 text-right italic border-t border-gray-300 pt-1">Calcul du poids en fonction du volume</div>
                                    <div className="flex justify-between items-center mt-1 pt-1 bg-white px-2 py-0.5 border border-gray-200 rounded">
                                        <span className="font-semibold">Poids pièce</span>
                                        <div className="font-black text-base">{fmt(unitWeight)} {weightUnitLabel}</div>
                                    </div>
                                </div>
                                <div className="p-1 bg-gray-100 space-y-0.5">
                                    <div className="flex justify-between"><span>Longueur unitaire Brut</span> <strong>{fmt(length, 3)} {unitSystemLabel}</strong></div>
                                    <div className="flex justify-between"><span>Largeur brut</span> <strong>{fmt(width, 3)} {unitSystemLabel}</strong></div>
                                    <div className="flex justify-between"><span>Hauteur brut</span> <strong>-</strong></div>
                                    <div className="text-right mt-2">
                                        <div className="flex justify-between items-center border-t border-gray-300 pt-1">
                                            <span>Poids au {volumeUnitLabel}</span>
                                            <div className="bg-white px-2 font-bold shadow-sm">{fmt(DEFAULT_DENSITY_LBS_FT3)} {weightUnitLabel}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: INFORMATIONS DE PRODUCTION */}
                    <div className="border border-gray-300 shadow-sm">
                        <div className="bg-black text-white px-2 py-1 font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>Informations de production
                        </div>
                        <div className="grid grid-cols-2 gap-0 bg-white text-xs">

                            {/* Col 1 */}
                            <div className="p-2 space-y-1 border-r border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-700">Qté initiale dans la soumission</span>
                                    <strong className="text-lg">{fmt(item.quantity, 0)}</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-700">P.O.</span>
                                    {clientPO ? (
                                        <button onClick={handleOpenPO} className="text-blue-600 hover:underline font-bold flex items-center gap-1">
                                            {clientPO} <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                        </button>
                                    ) : <strong>-</strong>}
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                    <span className="font-semibold text-gray-700">Prix en / ea</span>
                                    <strong className="text-base">{fmt(unitPrice)} CAD</strong>
                                </div>
                            </div>

                            {/* Col 2 */}
                            <div className="p-2 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-700">Devise</span>
                                    <strong>CAD</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-700">Unité</span>
                                    <strong>{item.unit || 'ea'}</strong>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                                    <span className="font-semibold text-gray-700">Prix total estimé</span>
                                    <strong className="text-base">{fmt(totalPrice)} CAD</strong>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* SECTION 3: QUANTITE RESTANTE A PRODUIRE (Totaux) */}
                    <div className="border border-gray-300 shadow-md">
                        <div className="bg-black text-white px-2 py-1 font-bold flex justify-between items-center text-xs uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>Quantité restante à produire (Totaux)
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-0 bg-white text-xs">
                            {/* Left: Totals assigned to this line */}
                            <div className="p-2 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
                                <div className="space-y-1">
                                    <div className="flex justify-between"><span>Qté affecté à cette ligne</span> <strong>{fmt(item.quantity, 0)}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Longueur Net totale</span> <strong>{fmt(isImperial ? (length * item.quantity / 12) : (length * item.quantity / 1000), 2)} {isImperial ? 'plin' : 'ml'}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Surface Net totale</span> <strong>{fmt(totalAreaCalc)} {areaUnitLabel}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Volume net total</span> <strong>{fmt(totalVolumeCalc, 3)} {volumeUnitLabel}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Poids net total</span> <strong>{fmt(totalWeightCalc, 0)} {weightUnitLabel}</strong></div>
                                </div>

                                <div className="border-t border-gray-300 my-1 pt-1 mt-auto">
                                    <div className="flex justify-between font-bold text-lg text-gray-800"><span>Prix total</span> <span>{fmt(totalPrice)} CAD</span></div>
                                </div>
                            </div>

                            {/* Right: Remaining to Produce (The "Reste") */}
                            <div className="p-2 bg-gray-200 flex flex-col h-full">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-red-600 font-black text-lg items-center border-b border-gray-300 pb-1 mb-1">
                                        <span>Qté restant à produire</span>
                                        <span>{remainingQty}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600"><span>Surface Net restante</span> <strong>{fmt(unitArea * remainingQty)} {areaUnitLabel}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Volume net restant</span> <strong>{fmt(unitVolume * remainingQty)} {volumeUnitLabel}</strong></div>
                                    <div className="flex justify-between text-gray-600"><span>Poids restant</span> <strong>{fmt(unitWeight * remainingQty)} {weightUnitLabel}</strong></div>
                                </div>

                                <div className="border-t border-gray-400 my-1 pt-1 mt-auto">
                                    <div className="flex justify-between font-bold text-lg text-gray-900"><span>Prix total restant</span> <span>{fmt(remainingQty * unitPrice)} CAD</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
