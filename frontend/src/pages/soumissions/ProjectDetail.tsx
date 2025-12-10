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
        if (!window.confirm("Voulez-vous vraiment supprimer cette soumission ?")) return;
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
                            <div key={quote.id} className="border rounded p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p
                                        className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        onClick={() => navigate(`/quotes/${quote.id}`)}
                                    >
                                        {quote.client?.name || 'Client Inconnu'}
                                    </p>
                                    <p
                                        className="text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline cursor-pointer mt-1"
                                        onClick={() => navigate(`/quotes/${quote.id}`)}
                                    >
                                        Réf: {quote.reference}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-mono font-bold">{quote.totalAmount || 0} {quote.currency}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${quote.status === 'Accepted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {quote.status}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/quotes/${quote.id}`)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium text-sm border border-indigo-200 hover:bg-indigo-50 rounded px-3 py-1 transition-colors"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Réviser la soumission ${quote.reference} (Créer R${(parseInt(quote.reference.split('R').pop() || '0')) + 1}) ?`)) {
                                                    try {
                                                        const res = await api.post(`/quotes/${quote.id}/revise`);
                                                        window.location.href = `/quotes/${res.data.id}`; // Hard refresh/nav to new quote
                                                    } catch (e) {
                                                        console.error(e);
                                                        alert("Erreur lors de la révision");
                                                    }
                                                }
                                            }}
                                            className="text-green-600 hover:text-green-900 font-medium text-sm border border-green-200 hover:bg-green-50 rounded px-3 py-1 transition-colors"
                                        >
                                            Réviser
                                        </button>
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
