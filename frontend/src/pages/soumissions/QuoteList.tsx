import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Quote {
    id: string;
    reference: string;
    dateIssued: string;
    totalAmount: number;
    status: string;
    client: {
        name: string;
    };
    project?: {
        name: string;
    }
}

export default function QuoteList() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const response = await api.get('/quotes');
            setQuotes(response.data);
        } catch (error) {
            console.error('Error fetching quotes:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Soumissions</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Liste des soumissions en cours et archivées.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <Link
                        to="/quotes/new"
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <PlusIcon className="h-5 w-5 inline-block mr-1" />
                        Nouvelle Soumission
                    </Link>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Référence
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Client
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Projet
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Date
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Statut
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4">Chargement...</td>
                                        </tr>
                                    ) : quotes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-4 text-gray-500">Aucune soumission trouvée.</td>
                                        </tr>
                                    ) : (
                                        quotes.map((quote) => (
                                            <tr key={quote.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                    {quote.reference}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {quote.client.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {quote.project?.name || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(quote.dateIssued).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${quote.status === 'Draft' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' :
                                                        quote.status === 'Sent' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                                            quote.status === 'Accepted' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                                'bg-red-50 text-red-700 ring-red-600/10'
                                                        }`}>
                                                        {quote.status}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <Link to={`/quotes/${quote.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                        Ouvrir
                                                    </Link>
                                                    <button
                                                        onClick={async () => {
                                                            const code = window.prompt("Code de sécurité requis pour supprimer cette soumission :");
                                                            if (code !== '1234') {
                                                                if (code !== null) alert("Code incorrect.");
                                                                return;
                                                            }

                                                            try {
                                                                await api.delete(`/quotes/${quote.id}`);
                                                                setQuotes(quotes.filter(q => q.id !== quote.id));
                                                            } catch (e) {
                                                                console.error(e);
                                                                alert('Erreur lors de la suppression');
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
