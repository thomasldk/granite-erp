import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import api, { getEquipments, getProductionSites } from '../../services/api';

interface Equipment {
    id: string;
    name: string;
    number: string;
}

const RepairForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        reference: '', // Auto-generated usually, but display if exists
        detectionDate: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
        isOperational: true,
        equipmentId: '',
        status: 'Open',
        priority: 'Medium',
        authorName: 'Pierre Martin', // Default or from Auth
        closedAt: '',
        requesterName: '',
        mechanicName: '',
        dueDate: '',
        location: '',
        description: '',
    });

    const [equipments, setEquipments] = useState<Equipment[]>([]);

    const [sites, setSites] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const [eqData, siteData] = await Promise.all([
                    getEquipments(),
                    getProductionSites()
                ]);
                setEquipments(eqData);
                setSites(siteData);
            } catch (error) {
                console.error('Error loading options:', error);
            }
        };
        loadOptions();

        if (isEditMode) {
            api.get(`/maintenance/requests/${id}`)
                .then(res => {
                    const data = res.data;
                    setFormData({
                        ...data,
                        detectionDate: data.detectionDate ? data.detectionDate.slice(0, 16) : '',
                        dueDate: data.dueDate ? data.dueDate.slice(0, 10) : '',
                        closedAt: data.closedAt ? data.closedAt.slice(0, 16) : '',
                        equipmentId: data.equipmentId || ''
                    });
                })
                .catch(err => console.error(err));
        }
    }, [id, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEditMode
            ? `/maintenance/requests/${id}`
            : '/maintenance/requests';

        const method = isEditMode ? 'put' : 'post';

        const payload = {
            ...formData,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
            closedAt: formData.closedAt ? new Date(formData.closedAt) : null,
        };

        try {
            await api[method](url, payload);
            navigate('/maintenance/repairs');
        } catch (error) {
            console.error(error);
            alert('Erreur: ' + (error as any).message);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <button
                onClick={() => navigate('/maintenance/repairs')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Retour à la liste
            </button>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Header Bar */}
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <div>
                        {isEditMode && <span className="text-sm text-gray-500 mr-4">Référence: <span className="font-mono font-bold text-gray-700">{formData.reference}</span></span>}
                        {isEditMode && <span className="text-sm text-gray-500">Créé le: {new Date().toLocaleDateString()}</span>}
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Detection Date */}
                        <div className="flex items-center">
                            <label className="w-48 text-sm font-medium text-gray-700">Date de détection</label>
                            <div className="flex-1 flex gap-2">
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.detectionDate}
                                    onChange={e => setFormData({ ...formData, detectionDate: e.target.value })}
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                />
                            </div>
                        </div>

                        {/* Is Operational */}
                        <div className="flex items-center">
                            <label className="w-48 text-sm font-medium text-gray-700">Équipement fonctionnel</label>
                            <div className="flex-1 flex items-center space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        checked={!formData.isOperational}
                                        onChange={() => setFormData({ ...formData, isOperational: false })}
                                        className="form-radio text-red-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Non</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        checked={formData.isOperational}
                                        onChange={() => setFormData({ ...formData, isOperational: true })}
                                        className="form-radio text-green-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Oui</span>
                                </label>
                            </div>
                        </div>

                        {/* Equipment */}
                        <div className="flex items-center">
                            <label className="w-48 text-sm font-medium text-gray-700">Équipement</label>
                            <select
                                value={formData.equipmentId}
                                onChange={e => setFormData({ ...formData, equipmentId: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Sélectionner...</option>
                                {equipments.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.number} - {eq.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Status (Display Only or Edit?) - Assuming Edit for now */}
                        <div className="flex items-center">
                            <label className="w-48 text-sm font-medium text-gray-700">Statut</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-semibold"
                            >
                                <option value="Open">Ouvert</option>
                                <option value="In Progress">En cours</option>
                                <option value="Done">Terminé (Clos)</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col mt-4">
                            <label className="text-sm font-medium text-gray-700 mb-2">Description / Problème</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                placeholder="Décrivez le problème..."
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Author */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Auteur</label>
                            <input
                                type="text"
                                value={formData.authorName}
                                onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm font-bold bg-gray-50"
                            />
                        </div>

                        {/* Closed At */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Clôture réalisée le</label>
                            <input
                                type="datetime-local"
                                value={formData.closedAt}
                                onChange={e => setFormData({ ...formData, closedAt: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Priority */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Niveau d'urgence</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                                <option value="Low">Faible</option>
                                <option value="Medium">Moyenne</option>
                                <option value="High">Élevée</option>
                                <option value="Critical">Critique</option>
                            </select>
                        </div>

                        {/* Spacer */}
                        <div className="h-4"></div>

                        {/* Requester */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Demandeur</label>
                            {/* Using Simple Input for now, could be select */}
                            <input
                                type="text"
                                value={formData.requesterName || ''}
                                onChange={e => setFormData({ ...formData, requesterName: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Mechanic */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Mécanicien</label>
                            <input
                                type="text"
                                value={formData.mechanicName || ''}
                                onChange={e => setFormData({ ...formData, mechanicName: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Due Date */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">À faire pour le</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            />
                        </div>

                        {/* Spacer */}
                        <div className="h-4"></div>

                        {/* Location */}
                        <div className="flex items-center">
                            <label className="w-40 text-sm font-medium text-gray-700 text-right mr-4">Localisation</label>
                            <select
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                            >
                                <option value="">Sélectionner...</option>
                                {sites.map(site => (
                                    <option key={site.id} value={site.name}>{site.name}</option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => navigate('/maintenance/repairs')}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                        Sauvegarder
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RepairForm;
