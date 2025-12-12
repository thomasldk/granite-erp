import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

interface Equipment {
    id: string;
    number: string;
    name: string;
    category: string;
    productionSite?: { name: string };
    supplier?: { name: string };
}

const EquipmentList: React.FC = () => {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            const response = await api.get('/maintenance/equipment');
            setEquipment(response.data);
        } catch (error) {
            console.error('Error fetching equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Équipements</h2>
                <Link
                    to="/maintenance/equipment/new"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                >
                    Nouvel Équipement
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fournisseur</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center">Chargement...</td></tr>
                        ) : equipment.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Aucun équipement trouvé.</td></tr>
                        ) : (
                            equipment.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productionSite?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.supplier?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link to={`/maintenance/equipment/${item.id}/edit`} className="text-primary hover:text-primary/80 mr-4">Modifier</Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EquipmentList;
