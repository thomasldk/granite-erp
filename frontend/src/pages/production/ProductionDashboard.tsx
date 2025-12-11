
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

interface ProductionItem {
    id: string;
    quoteRef: string;
    clientName: string;
    site: string; // Added
    tag: string;
    granite: string;
    qty: number;
    item: string;
    length: number;
    width: number;
    thickness: number;
    description: string;
    netLength: string;
    netArea: string;
    netVolume: string;
    totalWeight: string;
    unitPriceCad: string;
    unitPriceUsd: string;
    totalCad: string;
    totalUsd: string;
    unit: string;
}

const ProductionDashboard: React.FC = () => {
    const [items, setItems] = useState<ProductionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const currentSite = searchParams.get('site'); // RAP or STD

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/production/items');
            setItems(response.data);
        } catch (error) {
            console.error("Error fetching production items", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic: Check if item.site contains the requested site string (e.g. "RAP" in "Production RAP")
    const filteredItems = currentSite
        ? items.filter(item => item.site && item.site.includes(currentSite))
        : items;

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">
                Tableau de Bord Production {currentSite ? `- ${currentSite}` : '(Global)'}
            </h1>

            <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                <table className="min-w-full text-xs text-left text-gray-700">
                    <thead className="bg-gray-800 text-white uppercase font-medium">
                        <tr>
                            <th className="px-2 py-3 border-r border-gray-600">No</th>
                            <th className="px-2 py-3 border-r border-gray-600">Ref</th>
                            <th className="px-2 py-3 border-r border-gray-600">Site</th>
                            <th className="px-2 py-3 border-r border-gray-600">Tag</th>
                            <th className="px-2 py-3 border-r border-gray-600">Granite</th>
                            <th className="px-2 py-3 border-r border-gray-600">Qty</th>
                            <th className="px-2 py-3 border-r border-gray-600">Item</th>

                            {/* Dims */}
                            <th className="px-2 py-3 border-r border-gray-600 text-center">Length</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-center">Width/Deep</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-center">Thick/Height</th>

                            <th className="px-4 py-3 border-r border-gray-600 w-1/4">Description</th>

                            {/* Net Totals */}
                            <th className="px-2 py-3 border-r border-gray-600 text-right">Total Length Net</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-right">Total Area Net</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-right">Total Volume Net</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-right">Tot. Weight</th>

                            {/* Pricing */}
                            <th className="px-2 py-3 border-r border-gray-600 text-right bg-gray-700">Unit Price CAD$</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-right bg-gray-700">Unit Price USD$</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-center">Unit</th>
                            <th className="px-2 py-3 border-r border-gray-600 text-right bg-gray-700">Total CDN$</th>
                            <th className="px-2 py-3 text-right bg-gray-700">Total USD$</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={20} className="px-4 py-4 text-center text-gray-500">
                                    Aucune production trouvée pour ce site.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-2 py-2 border-r">{index + 1}</td>
                                    <td className="px-2 py-2 border-r font-medium">{item.quoteRef}</td>
                                    <td className="px-2 py-2 border-r">{item.site}</td>
                                    <td className="px-2 py-2 border-r">{item.tag}</td>
                                    <td className="px-2 py-2 border-r truncate max-w-xs" title={item.granite}>{item.granite}</td>
                                    <td className="px-2 py-2 border-r font-bold text-center">{item.qty}</td>
                                    <td className="px-2 py-2 border-r">{item.item}</td>

                                    {/* Dims */}
                                    <td className="px-2 py-2 border-r text-center">{item.length}</td>
                                    <td className="px-2 py-2 border-r text-center">{item.width}</td>
                                    <td className="px-2 py-2 border-r text-center">{item.thickness}</td>

                                    <td className="px-4 py-2 border-r truncate max-w-sm" title={item.description}>{item.description}</td>

                                    {/* Net Totals */}
                                    <td className="px-2 py-2 border-r text-right">{item.netLength}</td>
                                    <td className="px-2 py-2 border-r text-right font-semibold">{item.netArea}</td>
                                    <td className="px-2 py-2 border-r text-right">{item.netVolume}</td>
                                    <td className="px-2 py-2 border-r text-right font-medium">{item.totalWeight}</td>

                                    {/* Pricing */}
                                    <td className="px-2 py-2 border-r text-right">{item.unitPriceCad}</td>
                                    <td className="px-2 py-2 border-r text-right">{item.unitPriceUsd}</td>
                                    <td className="px-2 py-2 border-r text-center text-gray-500">{item.unit || '-'}</td>
                                    <td className="px-2 py-2 border-r text-right font-bold text-green-700">{item.totalCad}</td>
                                    <td className="px-2 py-2 text-right font-bold text-blue-700">{item.totalUsd}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductionDashboard;
