import React from 'react';
import api from '../../services/api';

export const DatabaseSettings: React.FC = () => {

    const handleDownloadBackup = async () => {
        if (!window.confirm("Ceci va lancer une sauvegarde immédiate dans le dossier de sauvegardes automatiques. Continuer ?")) {
            return;
        }

        try {
            const response = await api.post('/settings/backup/trigger');
            if (response.data.success) {
                alert(`Sauvegarde réussie ! ✅\n\nFichier enregistré sous :\n${response.data.filepath}`);
            }
        } catch (error) {
            console.error('Failed to trigger backup', error);
            alert('Erreur lors de la sauvegarde sur le disque.');
        }
    };

    const handleDownloadLatest = async () => {
        try {
            // Initiate download
            window.location.href = `${api.defaults.baseURL}/settings/backup/latest`;
        } catch (error) {
            console.error('Failed to download latest backup', error);
            alert('Erreur lors du téléchargement de la dernière sauvegarde.');
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
                        Sauvegarde Complète (Instantanée)
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            Cette action déclenche une <strong>sauvegarde immédiate</strong> de toutes vos données directement dans le dossier <code>Documents/1Granite DRC/nouvelle erp 2025/sauvegardes</code> de votre ordinateur/serveur.
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                            Utile avant de faire des modifications importantes. Le fichier sera nommé avec la date et l'heure actuelle.
                        </p>
                    </div>
                    <div className="mt-5 flex gap-4">
                        <button
                            type="button"
                            onClick={handleDownloadBackup}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                            </svg>
                            Faire une sauvegarde
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadLatest}
                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            Télécharger la dernière sauvegarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
