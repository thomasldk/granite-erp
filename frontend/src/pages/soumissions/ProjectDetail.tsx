import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);

    useEffect(() => {
        if (id) fetchProject();
    }, [id]);

    const fetchProject = async () => {
        try {
            // Fetching all projects includes location relation as per soumissionController.getProjects
            const response = await api.get(`/soumissions`);
            const found = response.data.find((p: any) => p.id === id);
            setProject(found);
        } catch (error) {
            console.error('Error fetching project', error);
        }
    };

    const handleDeleteQuote = async (quoteId: string) => {
        const code = window.prompt("Code de sécurité requis pour supprimer cette soumission :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }
        try {
            await api.delete(`/quotes/${quoteId}`);
            setProject((prev: any) => ({
                ...prev,
                quotes: prev.quotes.filter((q: any) => q.id !== quoteId)
            }));
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la suppression");
        }
    };

    if (!project) return <div>Chargement...</div>;

    return (
        <div className="p-8">
            <div className="mb-6">
                <button onClick={() => navigate('/soumissions')} className="text-gray-500 hover:text-gray-700 mb-2">
                    &larr; Retour à la liste
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                        <p className="text-gray-600 font-mono mb-2">{project.reference}</p>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                            <p><span className="font-semibold">Lieu :</span> {project.location?.name || 'Non défini'}</p>
                            <p><span className="font-semibold">Système :</span> {project.measureSystem}</p>
                            <p><span className="font-semibold">Production estimée :</span> {project.estimatedWeeks === 0 ? 'À déterminer' : project.estimatedWeeks ? `${project.estimatedWeeks} semaines` : 'Non défini'}</p>
                            <p><span className="font-semibold">Nombre de lignes :</span> {project.numberOfLines || 'Non défini'}</p>
                        </div>
                    </div>
                    <button
                        className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => navigate(`/soumissions/${project.id}/new-quote`)}
                    >
                        + Créer une Soumission (Client)
                    </button>
                    <button
                        className="bg-secondary hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-4"
                        onClick={() => navigate(`/soumissions/projects/${project.id}/edit`)}
                    >
                        Modifier le projet
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Soumissions associées au projet</h3>
                <div className="grid gap-4">
                    {project.quotes && project.quotes.length > 0 ? (
                        project.quotes.map((quote: any) => (
                            <div key={quote.id} className="border rounded p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors" onClick={(e) => {
                                // Prevent nav if clicking buttons
                                if ((e.target as HTMLElement).tagName === 'BUTTON') return;
                                navigate(`/quotes/${quote.id}`);
                            }}>
                                {/* 1. Client & Ref */}
                                <div className="w-1/4 min-w-[200px]">
                                    <p className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline truncate">
                                        {quote.client?.name || 'Client Inconnu'}
                                    </p>
                                    <p className="text-xs font-mono text-gray-500 mt-1">
                                        Réf: {quote.reference}
                                    </p>
                                </div>

                                {/* 2. Material (Pierre) - CENTERED */}
                                <div className="flex-1 text-center">
                                    {quote.material ? (
                                        <p className="text-gray-700 font-medium text-sm">
                                            {quote.material.name}
                                        </p>
                                    ) : (
                                        <span className="text-gray-300 text-sm">-</span>
                                    )}
                                </div>

                                {/* 3. Status - CENTERED */}
                                <div className="flex-1 text-center">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${quote.status === 'Accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                                        quote.status === 'Sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                            'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}>
                                        {quote.status}
                                    </span>
                                </div>

                                {/* 4. Amount & Actions */}
                                <div className="flex items-center gap-6 justify-end w-auto">
                                    <p className="font-mono font-bold text-gray-900 text-lg whitespace-nowrap min-w-[100px] text-right">
                                        {quote.totalAmount ? Number(quote.totalAmount).toFixed(2) : '0.00'} {(() => {
                                            // User Request: If Client US -> Mark USD, else CAD
                                            // Logic: Check Address Country (Case Insensitive, French support)
                                            const client = quote.client || {};
                                            const addresses = client.addresses || [];

                                            const hasUSAddress = addresses.some((a: any) => {
                                                if (!a.country) return false;
                                                const c = a.country.toLowerCase().trim();
                                                return ['usa', 'us', 'united states', 'united states of america', 'états-unis', 'etats-unis', 'etats unis'].some(v => c.includes(v));
                                            });

                                            return hasUSAddress ? 'USD' : 'CAD';
                                        })()}
                                    </p>
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleDeleteQuote(quote.id)}
                                            className="text-red-600 hover:text-red-900 font-medium text-sm border border-red-200 hover:bg-red-50 rounded px-3 py-1 transition-colors"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">Aucune soumission pour ce projet pour le moment.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;
