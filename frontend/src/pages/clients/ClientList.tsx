import React, { useEffect, useState } from 'react';
import { getThirdParties, ThirdParty } from '../../services/thirdPartyService';
import { Link, useNavigate } from 'react-router-dom';

interface ClientListProps {
    type?: 'Client' | 'Supplier';
}

const ClientList: React.FC<ClientListProps> = ({ type = 'Client' }) => {
    const navigate = useNavigate();
    const [clients, setClients] = useState<ThirdParty[]>([]);
    const [loading, setLoading] = useState(true);

    const title = type === 'Client' ? 'Clients' : 'Fournisseurs';
    const singular = type === 'Client' ? 'Client' : 'Fournisseur';
    const basePath = type === 'Client' ? '/clients' : '/suppliers';

    useEffect(() => {
        loadClients();
    }, [type]);

    const loadClients = async () => {
        setLoading(true);
        try {
            const data = await getThirdParties(type);
            setClients(data);
        } catch (error) {
            console.error('Failed to load clients', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                <Link to={`${basePath}/new`} className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition duration-200">
                    + Nouveau {singular}
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{singular}</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Info</th>
                            {type === 'Supplier' && (
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Liste de prix</th>
                            )}
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={type === 'Supplier' ? 4 : 3} className="text-center py-4">Chargement...</td></tr>
                        ) : clients.length === 0 ? (
                            <tr><td colSpan={type === 'Supplier' ? 4 : 3} className="text-center py-4 text-gray-500">Aucun {singular.toLowerCase()} trouvé.</td></tr>
                        ) : (
                            clients.map((client) => (
                                <tr
                                    key={client.id}
                                    className="hover:bg-gray-50 bg-white border-b border-gray-200 transition duration-150 cursor-pointer"
                                    onClick={() => navigate(`${basePath}/${client.id}`)}
                                >
                                    <td className="px-5 py-5 text-sm">
                                        <p className="text-gray-900 font-bold text-lg">
                                            {client.name}
                                        </p>
                                    </td>
                                    <td className="px-5 py-5 text-sm">
                                        {type === 'Supplier' ? (
                                            <p className="text-gray-900 font-bold">{client.supplierType || 'Non spécifié'}</p>
                                        ) : (
                                            <p className="text-gray-900 font-mono font-bold">{client.code || '-'}</p>
                                        )}
                                        <p className="text-gray-500 text-xs mt-1">📞 {client.phone || '-'}</p>
                                    </td>
                                    {type === 'Supplier' && (
                                        <td className="px-5 py-5 text-sm text-center">
                                            {(client as any).priceListUrl ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <a
                                                        href={`${(client as any).priceListUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Liste de prix"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-block text-red-600 hover:text-red-800"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    </a>
                                                    {(client as any).priceListDate && (
                                                        <span className="text-gray-600 font-medium text-xs">
                                                            {(client as any).priceListDate}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">-</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-5 py-5 text-sm text-right">
                                        <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                                            <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                                            <span className="relative">Voir &rarr;</span>
                                        </span>
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

export default ClientList;
