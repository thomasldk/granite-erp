import React, { useEffect, useState } from 'react';

interface Equipment {
    id: string;
    name: string;
    internalId: string;
    serialNumber: string;
    category: { name: string } | null;
    site: { name: string } | null;
    status: string;
}

const EquipmentList: React.FC = () => {
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/equipments')
            .then(res => res.json())
            .then(data => {
                setEquipments(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching equipments:', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6">Chargement...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des Équipements</h1>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Système</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {equipments.map((eq) => (
                            <tr key={eq.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{eq.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.internalId || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.category?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{eq.site?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eq.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {eq.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EquipmentList;

