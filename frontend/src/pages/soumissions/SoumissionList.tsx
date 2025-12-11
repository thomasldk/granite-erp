import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SoumissionList: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/soumissions');
            setProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects', error);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Projets / Soumissions</h1>
                <button
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                    onClick={() => navigate('/soumissions/new-project')}
                >
                    + Nouveau Projet
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Référence
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Nom du Projet
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Client Principal (Opt.)
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Soumissions
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Statut
                            </th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50 transition duration-150">
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span
                                        className="font-mono text-blue-600 font-medium hover:underline cursor-pointer"
                                        onClick={() => navigate(`/soumissions/${project.id}`)}
                                    >
                                        {project.reference}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap font-semibold">{project.name}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap">
                                        {/* Show last quote client, or project client, or empty */}
                                        {project.quotes?.[0]?.client?.name || project.client?.name || '-'}
                                    </p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
                                        {project.quotes?.length || 0} devis
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'Won' ? 'bg-green-100 text-green-800' :
                                        project.status === 'Lost' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {project.status}
                                    </span>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <div className="flex space-x-2">
                                        <button
                                            className="text-primary hover:text-blue-900 font-medium border border-blue-200 hover:bg-blue-50 px-3 py-1 rounded"
                                            onClick={() => navigate(`/soumissions/${project.id}`)}
                                        >
                                            Voir
                                        </button>
                                        <button
                                            className="text-red-600 hover:text-red-900 font-medium border border-red-200 hover:bg-red-50 px-3 py-1 rounded"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Voulez-vous vraiment supprimer ce projet et toutes ses soumissions ?')) {
                                                    try {
                                                        await api.delete(`/soumissions/${project.id}`);
                                                        fetchProjects(); // Refresh list
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Erreur lors de la suppression");
                                                    }
                                                }
                                            }}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {projects.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center text-gray-500">
                                    Aucun projet trouvé. Commencez par créer une nouvelle soumission.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SoumissionList;
