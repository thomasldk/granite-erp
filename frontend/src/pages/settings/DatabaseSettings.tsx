import React from 'react';
import api from '../../services/api';

export const DatabaseSettings: React.FC = () => {

    const handleDownloadBackup = async () => {
        try {
            const response = await api.get('/settings/backup', {
                responseType: 'blob'
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from header or default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = 'backup.json';
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Failed to download backup', error);
            alert('Erreur lors du téléchargement de la sauvegarde.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Gestion de la Base de Données
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Exportez vos données pour les sécuriser.
                    </p>
                </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Sauvegarde Complète (JSON)
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            Cette action téléchargera un fichier contenant l'intégralité de vos données : Clients, Soumissions, Projets, Matériaux, Paramètres, etc.
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                            Format : JSON standardisé. Conservez ce fichier en lieu sûr.
                        </p>
                    </div>
                    <div className="mt-5">
                        <button
                            type="button"
                            onClick={handleDownloadBackup}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                            </svg>
                            Télécharger la sauvegarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
