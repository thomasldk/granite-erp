import React, { useEffect, useState } from 'react';

interface Part {
    id: string;
    name: string;
    reference: string | null;
    category: { name: string } | null;
    site: { name: string } | null;
    stockQuantity: number;
    minQuantity: number;
    description: string | null;
    supplier: string | null;
}

const PartList: React.FC = () => {
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/parts')
            .then(res => res.json())
            .then(data => {
                setParts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching parts:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des Pièces</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièce</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté. Dispo.</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté. Min.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {parts.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.reference || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.site?.name || '-'}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${p.stockQuantity <= p.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>{p.stockQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{p.minQuantity}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.supplier || ''}>{p.supplier || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartList;

