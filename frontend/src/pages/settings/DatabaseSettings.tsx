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

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleRestoreClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again if needed
        event.target.value = '';

        if (!window.confirm("⚠️ ATTENTION : DANGER ⚠️\n\nVous êtes sur le point de RESTAURER une sauvegarde.\n\nCela va EFFACER TOTALEMENT les données actuelles de la base de données pour les remplacer par celles du fichier.\n\nÊtes-vous sûr de vouloir continuer ?")) {
            return;
        }

        const formData = new FormData();
        formData.append('backup', file);

        try {
            const response = await api.post('/settings/backup/restore', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                alert("Restauration terminée avec succès ! ✅\n\nLa page va se recharger.");
                window.location.reload();
            }
        } catch (error) {
            console.error("Restore failed", error);
            alert("Erreur lors de la restauration.\nVérifiez le fichier (format JSON attendu) et les logs serveur.");
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

            {/* DOWNLOAD SECTION */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Sauvegardes
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                        <p>
                            Gérez les sauvegardes manuelles et automatiques de votre ERP.
                        </p>
                    </div>
                    <div className="mt-5 flex gap-4">
                        <button
                            type="button"
                            onClick={handleDownloadBackup}
                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" />
                            </svg>
                            Faire une sauvegarde
                        </button>

                        <button
                            type="button"
                            onClick={handleDownloadLatest}
                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                            </svg>
                            Télécharger la dernière sauvegarde
                        </button>
                    </div>
                </div>
            </div>

            {/* RESTORE SECTION */}
            <div className="bg-red-50 border border-red-200 shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-base font-semibold leading-6 text-red-800">
                        Zone de Danger : Restauration
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-red-600">
                        <p>
                            Importez un fichier de sauvegarde (JSON) pour écraser et remplacer toutes les données actuelles.
                            <br />
                            <strong>Idéal pour la mise en production ou un retour en arrière.</strong>
                        </p>
                    </div>
                    <div className="mt-5">
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <button
                            type="button"
                            onClick={handleRestoreClick}
                            className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
                        >
                            <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                            Importer une sauvegarde
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
