
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getParts, deletePart } from '../../services/api';

const PartList: React.FC = () => {
    const [parts, setParts] = useState<any[]>([]);

    useEffect(() => {
        loadParts();
    }, []);

    const loadParts = async () => {
        try {
            const data = await getParts();
            setParts(data);
        } catch (error) {
            console.error('Error loading parts:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) {
            try {
                await deletePart(id);
                loadParts();
            } catch (error) {
                console.error('Error deleting part:', error);
            }
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Pièces</h1>
                <Link
                    to="/maintenance/parts/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nouvelle Pièce
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement lié</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {parts.map((part) => (
                            <tr key={part.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{part.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.reference || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.category?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`${part.stockQuantity <= part.minQuantity ? 'text-red-500 font-bold' : ''}`}>
                                        {part.stockQuantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.location || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{part.equipment?.name || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        <Link to={`/maintenance/parts/${part.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                                            <PencilIcon className="w-5 h-5" />
                                        </Link>
                                        <button onClick={() => handleDelete(part.id)} className="text-red-600 hover:text-red-900">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {parts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">Aucune pièce trouvée.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PartList;
