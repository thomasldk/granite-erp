import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Equipment {
    id: string;
    name: string;
    internalId: string;
}

const RepairForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);

    const [equipments, setEquipments] = useState<Equipment[]>([]);

    // Form State
    const [equipmentId, setEquipmentId] = useState('');
    const [detectionDate, setDetectionDate] = useState(new Date().toISOString().slice(0, 16));
    const [isFunctional, setIsFunctional] = useState('true');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [requester, setRequester] = useState('Pierre Martin');
    const [mechanic, setMechanic] = useState('');
    const [dueDate, setDueDate] = useState('');
    // We might want to handle status if editing, but for now let's keep it simple (status update via another flow? maybe add status dropdown if editing?)
    // Image in list shows status "Open". Assuming we might want to change it.
    // I'll add Status dropdown ONLY if isEditMode.
    const [status, setStatus] = useState('Open');
    const [type, setType] = useState('Repair'); // Repair or Maintenance

    useEffect(() => {
        // Fetch equipments
        fetch('/api/equipments')
            .then(res => res.json())
            .then(data => setEquipments(data))
            .catch(err => console.error(err));

        // If Edit Mode, fetch repair details
        if (isEditMode && id) {
            fetch(`/api/repairs/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Repair not found');
                    return res.json();
                })
                .then(data => {
                    setEquipmentId(data.equipmentId || '');
                    setTitle(data.title || '');
                    setDescription(data.description || '');
                    setPriority(data.priority || 'Normal');
                    setRequester(data.requester || '');
                    setMechanic(data.mechanic || '');
                    setStatus(data.status || 'Open');
                    setType(data.type || 'Repair');
                    setIsFunctional(data.isFunctional ? 'true' : 'false'); // Note: data.isFunctional is boolean? My schema says boolean default true.
                    // Wait, schema says `isFunctional` Boolean. So data.isFunctional should be bool.

                    if (data.detectionDate) {
                        setDetectionDate(new Date(data.detectionDate).toISOString().slice(0, 16));
                    }
                    if (data.dueDate) {
                        setDueDate(new Date(data.dueDate).toISOString().slice(0, 10)); // yyyy-mm-dd
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Erreur: Demande introuvable.');
                    navigate('/maintenance/repairs');
                });
        }
    }, [id, isEditMode, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = isEditMode ? `/api/repairs/${id}` : '/api/repairs';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equipmentId: equipmentId || null,
                    title,
                    description,
                    priority,
                    requester,
                    status, // Update status too
                    mechanic,
                    type,
                    isFunctional: isFunctional === 'true',
                    detectionDate,
                    dueDate: dueDate || null
                })
            });
            if (res.ok) {
                navigate('/maintenance/repairs');
            } else {
                alert('Erreur lors de la sauvegarde.');
            }
        } catch (error) {
            console.error(error);
            alert('Erreur réseau.');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
                {isEditMode ? 'Modifier la Demande' : 'Nouvelle Demande de Réparation'}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Généralité Section */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-orange-600">Généralité</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type de demande</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={type}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="Repair">Réparation</option>
                                    <option value="Maintenance">Entretien</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date de détection</label>
                                <input
                                    type="datetime-local"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={detectionDate}
                                    onChange={e => setDetectionDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Équipement fonctionnel ?</label>
                                <div className="mt-2 flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="isFunctional"
                                            value="false"
                                            checked={isFunctional === 'false'}
                                            onChange={e => setIsFunctional(e.target.value)}
                                        />
                                        <span className="ml-2">Non</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            className="form-radio text-blue-600"
                                            name="isFunctional"
                                            value="true"
                                            checked={isFunctional === 'true'}
                                            onChange={e => setIsFunctional(e.target.value)}
                                        />
                                        <span className="ml-2">Oui</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Équipement</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={equipmentId}
                                    onChange={e => setEquipmentId(e.target.value)}
                                >
                                    <option value="">Sélectionner un équipement (Optionnel)</option>
                                    {equipments.map(eq => (
                                        <option key={eq.id} value={eq.id}>
                                            {eq.name} ({eq.internalId || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Statut</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        value={status}
                                        onChange={e => setStatus(e.target.value)}
                                    >
                                        <option value="Open">Ouvert</option>
                                        <option value="In Progress">En Cours</option>
                                        <option value="Completed">Terminé</option>
                                        <option value="Cancelled">Annulé</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Niveau d'urgence</label>
                                <select
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={priority}
                                    onChange={e => setPriority(e.target.value)}
                                >
                                    <option value="Low">Faible</option>
                                    <option value="Normal">Normale</option>
                                    <option value="High">Haute</option>
                                    <option value="Urgent">Urgente</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Demandeur</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={requester}
                                    onChange={e => setRequester(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mécanicien</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={mechanic}
                                    onChange={e => setMechanic(e.target.value)}
                                    placeholder="Nom du mécanicien"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">A faire pour le (Échéance)</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Symptomes Section */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-orange-600">Symptômes</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Symptôme (Titre)</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Ex: Bruit anormal moteur..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description détaillée</label>
                            <textarea
                                required
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/maintenance/repairs')}
                        className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        {isEditMode ? 'Mettre à jour' : 'Créer la demande'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default RepairForm;
