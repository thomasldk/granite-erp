import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

const RepairList: React.FC = () => {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Réparations</h1>
                <Link
                    to="/maintenance/repairs/new"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nouvelle Réparation
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-gray-500 text-center py-8">Aucune réparation enregistrée pour le moment.</p>
            </div>
        </div>
    );
};

export default RepairList;
