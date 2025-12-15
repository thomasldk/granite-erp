import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const IncotermList: React.FC = () => {
    const [incoterms, setIncoterms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIncoterms();
    }, []);

    const fetchIncoterms = async () => {
        try {
            const res = await api.get('/incoterms');
            setIncoterms(res.data);
        } catch (error) {
            console.error('Error fetching incoterms:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Incoterms</h1>
                {/* No Add Button - These are rigid system codes for now */}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                    {incoterms.map((incoterm) => (
                        <li key={incoterm.id}>
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-blue-600 truncate">
                                        {incoterm.name}
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${incoterm.requiresText ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                            {incoterm.xmlCode}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">
                                            {incoterm.requiresText ? 'Nécessite une saisie manuelle' : 'Code Standard'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <p className="mt-4 text-xs text-gray-500 italic">
                Note: Les codes Incoterm sont définis par le système pour assurer la conformité XML.
            </p>
        </div>
    );
};

export default IncotermList;
