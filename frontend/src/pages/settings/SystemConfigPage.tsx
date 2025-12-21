
import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../../services/settingsService';

export const SystemConfigPage: React.FC = () => {
    const [settings, setSettings] = useState<Record<string, string>>({
        'path.local.excel': '/Volumes/nxerp',
        'path.local.exchange': '/Volumes/demo/echange',
        'path.prod.excel': 'H:\\Demo\\Echange',
        'path.prod.exchange': 'C:\\Lotus\\Domino\\data\\domino\\html\\erp\\demo\\echange'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await getSystemSettings();
            setSettings(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await updateSystemSettings(settings);
            setMessage('Configuration sauvegardée avec succès !');
        } catch (error) {
            setMessage('Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="p-8 bg-white shadow rounded-lg max-w-4xl mx-auto mt-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuration Système (Chemins)</h1>

            {message && (
                <div className={`p-4 mb-4 rounded ${message.includes('Erreur') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-8">

                {/* LOCAL (MAC) */}
                <div className="border border-gray-200 rounded p-6 bg-gray-50">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <span className="mr-2">💻</span> Environnement Local (Mac)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dossier Cible Excel (Volume monté)</label>
                            <input
                                type="text"
                                name="path.local.excel"
                                value={settings['path.local.excel']}
                                onChange={handleChange}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="/Volumes/nxerp"
                            />
                            <p className="text-xs text-gray-500 mt-1">Ex: /Volumes/nxerp</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dossier Échange XML (Sniffer)</label>
                            <input
                                type="text"
                                name="path.local.exchange"
                                value={settings['path.local.exchange']}
                                onChange={handleChange}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="/Volumes/demo/echange"
                            />
                            <p className="text-xs text-gray-500 mt-1">Ex: /Volumes/demo/echange</p>
                        </div>
                    </div>
                </div>

                {/* PROD (RAILWAY / WINDOWS) */}
                <div className="border border-blue-100 rounded p-6 bg-blue-50">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-900">
                        <span className="mr-2">☁️</span> Environnement Production (Railway + Windows)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">Dossier Cible Excel (Attribut 'cible' du XML)</label>
                            <input
                                type="text"
                                name="path.prod.excel"
                                value={settings['path.prod.excel']}
                                onChange={handleChange}
                                className="w-full border border-blue-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="H:\Demo\Echange"
                            />
                            <p className="text-xs text-blue-600 mt-1">Le chemin que l'automate Excel utilisera pour sauver le XLSX.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-900 mb-1">Chemin Échange XML (Serveur Lotus)</label>
                            <p className="text-sm font-mono bg-white p-2 rounded border border-blue-200 text-gray-600 mb-2">
                                {settings['path.prod.exchange']}
                            </p>
                            <p className="text-xs text-blue-600">
                                Ce chemin est géré par le script "Facteur" sur Windows. Modifiez le fichier <code>facteur.js</code> si nécessaire.
                            </p>
                            <input
                                type="text"
                                name="path.prod.exchange"
                                value={settings['path.prod.exchange']}
                                onChange={handleChange}
                                className="w-full border border-blue-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`bg-primary hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow-lg transition duration-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Sauvegarde...' : 'Enregistrer la Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

