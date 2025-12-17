import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Repair {
    id: string;
    reference: string;
    title: string | null;
    description: string;
    priority: string;
    status: string;
    requester: string | null;
    mechanic: string | null;
    type: string;
    isFunctional: boolean;
    detectionDate: string; // ISO string from backend
    dueDate: string | null;
    equipmentId: string | null;
    equipment?: { id: string, name: string, internalId: string } | null;
    parts?: { partId: string, quantity: number, action: string }[];
    recurrenceFreq?: string | null;
    recurrenceDay?: string | null;
}

interface Equipment {
    id: string;
    name: string;
    internalId: string;
}

interface Part {
    id: string;
    name: string;
    reference: string;
    stockQuantity: number;
}

interface RepairEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    repair: Repair | null;
    onSave: (updatedRepair: any) => void; // Using any for partial update object to send to API
    equipments: Equipment[];
    availableParts: Part[]; // Added
}

const RepairEditModal: React.FC<RepairEditModalProps> = ({ isOpen, onClose, repair, onSave, equipments, availableParts }) => {
    // Form State
    const [equipmentId, setEquipmentId] = useState('');
    const [detectionDate, setDetectionDate] = useState('');
    const [isFunctional, setIsFunctional] = useState('true');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [requester, setRequester] = useState('Pierre Martin');
    const [mechanic, setMechanic] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('Open');
    const [type, setType] = useState('Repair');
    const [recurrenceFreq, setRecurrenceFreq] = useState('');
    const [recurrenceDay, setRecurrenceDay] = useState('');

    // Parts State
    const [selectedParts, setSelectedParts] = useState<{ partId: string, quantity: number, action: string }[]>([]);

    useEffect(() => {
        if (repair) {
            setEquipmentId(repair.equipmentId || '');
            setTitle(repair.title || '');
            setDescription(repair.description || '');
            setPriority(repair.priority || 'Normal');
            setRequester(repair.requester || '');
            setMechanic(repair.mechanic || '');
            setStatus(repair.status || 'Open');
            setType(repair.type || 'Repair');
            setIsFunctional(repair.isFunctional ? 'true' : 'false');

            // Map existing parts if available (need to ensure backend returns them in list/detail)
            // Assuming the repair object passed here might need to be refreshed or we rely on what List passed.
            // If List passed 'parts' via 'repair' prop, we use it. 
            // NOTE: The Repair interface above needs to match what's passed.
            // Currently Repair interface doesn't have parts. I added it above in this replacement.
            if (repair.parts) {
                setSelectedParts(repair.parts.map(p => ({
                    partId: p.partId,
                    quantity: p.quantity,
                    action: p.action
                })));
            } else {
                setSelectedParts([]);
            }

            // Init Recurrence
            setRecurrenceFreq(repair.recurrenceFreq || '');
            setRecurrenceDay(repair.recurrenceDay || '');

            if (repair.detectionDate) {
                setDetectionDate(new Date(repair.detectionDate).toISOString().slice(0, 16));
            } else {
                setDetectionDate(new Date().toISOString().slice(0, 16));
            }

            if (repair.dueDate) {
                setDueDate(new Date(repair.dueDate).toISOString().slice(0, 10));
            } else {
                setDueDate('');
            }
        } else {
            // Reset for new entry
            setEquipmentId('');
            setTitle('');
            setDescription('');
            setPriority('Normal');
            setRequester('Pierre Martin');
            setMechanic('');
            setStatus('Open');
            setType('Repair');
            setIsFunctional('true');
            setDetectionDate(new Date().toISOString().slice(0, 16));
            setDueDate('');
            setRecurrenceFreq('');
            setRecurrenceDay('');
            setSelectedParts([]);
        }
    }, [repair, isOpen]);

    const handleAddPart = () => {
        setSelectedParts([...selectedParts, { partId: '', quantity: 1, action: 'USE' }]);
    };

    const handleRemovePart = (index: number) => {
        const newParts = [...selectedParts];
        newParts.splice(index, 1);
        setSelectedParts(newParts);
    };

    const handlePartChange = (index: number, field: string, value: any) => {
        const newParts = [...selectedParts];
        (newParts[index] as any)[field] = value;
        setSelectedParts(newParts);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            equipmentId: equipmentId || null,
            title,
            description,
            priority,
            requester,
            status,
            mechanic,
            type,
            isFunctional: isFunctional === 'true',
            detectionDate,
            dueDate: type === 'Maintenance' ? null : (dueDate || null), // Clear due date if maintenance
            recurrenceFreq: type === 'Maintenance' ? recurrenceFreq : null,
            recurrenceDay: type === 'Maintenance' ? recurrenceDay : null,
            parts: selectedParts.filter(p => p.partId) // Only send parts with selected ID
        });
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Fermer</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900 mb-6">
                                            {repair ? 'Modifier la Demande' : 'Nouvelle Demande d\'entretien et réparation'}
                                        </Dialog.Title>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Forms Content adapted from RepairForm.tsx */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-orange-600 uppercase mb-4">Généralité</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Type de demande</label>
                                                            <select
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                                        className="form-radio text-indigo-600"
                                                                        name="isFunctional"
                                                                        value="false"
                                                                        checked={isFunctional === 'false'}
                                                                        onChange={e => setIsFunctional(e.target.value)}
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">Non</span>
                                                                </label>
                                                                <label className="inline-flex items-center">
                                                                    <input
                                                                        type="radio"
                                                                        className="form-radio text-indigo-600"
                                                                        name="isFunctional"
                                                                        value="true"
                                                                        checked={isFunctional === 'true'}
                                                                        onChange={e => setIsFunctional(e.target.value)}
                                                                    />
                                                                    <span className="ml-2 text-sm text-gray-700">Oui</span>
                                                                </label>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Équipement</label>
                                                            <select
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                        {repair && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">Statut</label>
                                                                <select
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Niveau d'urgence</label>
                                                            <select
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                value={requester}
                                                                onChange={e => setRequester(e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Mécanicien</label>
                                                            <input
                                                                type="text"
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                value={mechanic}
                                                                onChange={e => setMechanic(e.target.value)}
                                                                placeholder="Nom du mécanicien"
                                                            />
                                                        </div>

                                                        {type !== 'Maintenance' ? (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700">A faire pour le (Échéance)</label>
                                                                <input
                                                                    type="date"
                                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                    value={dueDate}
                                                                    onChange={e => setDueDate(e.target.value)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700">Fréquence</label>
                                                                    <select
                                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                        value={recurrenceFreq}
                                                                        onChange={e => setRecurrenceFreq(e.target.value)}
                                                                    >
                                                                        <option value="">Sélectionner...</option>
                                                                        <option value="Oneoff">Une fois</option>
                                                                        <option value="Weekly">Hebdomadaire</option>
                                                                        <option value="Monthly">Mensuel</option>
                                                                        <option value="Yearly">Annuel</option>
                                                                    </select>
                                                                </div>
                                                                {recurrenceFreq === 'Weekly' && (
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-700">Jour</label>
                                                                        <select
                                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                            value={recurrenceDay}
                                                                            onChange={e => setRecurrenceDay(e.target.value)}
                                                                        >
                                                                            <option value="">Sélectionner...</option>
                                                                            <option value="Monday">Lundi</option>
                                                                            <option value="Tuesday">Mardi</option>
                                                                            <option value="Wednesday">Mercredi</option>
                                                                            <option value="Thursday">Jeudi</option>
                                                                            <option value="Friday">Vendredi</option>
                                                                            <option value="Saturday">Samedi</option>
                                                                            <option value="Sunday">Dimanche</option>
                                                                        </select>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium text-orange-600 uppercase mb-4">Symptômes</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">Symptôme (Titre)</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
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
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                            value={description}
                                                            onChange={e => setDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pièces Section */}
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="text-sm font-medium text-orange-600 uppercase">Pièces Requises</h4>
                                                    <button
                                                        type="button"
                                                        onClick={handleAddPart}
                                                        className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
                                                    >
                                                        + Ajouter une pièce
                                                    </button>
                                                </div>

                                                {selectedParts.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {selectedParts.map((partItem, index) => (
                                                            <div key={index} className="flex gap-4 items-end bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                                <div className="flex-grow">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Pièce</label>
                                                                    <select
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                        value={partItem.partId}
                                                                        onChange={e => handlePartChange(index, 'partId', e.target.value)}
                                                                        required
                                                                    >
                                                                        <option value="">Sélectionner...</option>
                                                                        {availableParts && availableParts.map(p => (
                                                                            <option key={p.id} value={p.id}>
                                                                                {p.name} (Ref: {p.reference || '-'}) - Stock: {p.stockQuantity}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="w-32">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                                                                    <select
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                        value={partItem.action}
                                                                        onChange={e => handlePartChange(index, 'action', e.target.value)}
                                                                    >
                                                                        <option value="USE">À Utiliser</option>
                                                                        <option value="ORDER">À Commander</option>
                                                                    </select>
                                                                </div>
                                                                <div className="w-20">
                                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Qté</label>
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                                        value={partItem.quantity}
                                                                        onChange={e => handlePartChange(index, 'quantity', e.target.value)}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemovePart(index)}
                                                                    className="text-red-600 hover:text-red-900 mb-2 p-1"
                                                                >
                                                                    <TrashIcon className="h-5 w-5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">Aucune pièce sélectionnée.</p>
                                                )}
                                            </div>

                                            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                <button
                                                    type="submit"
                                                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                                >
                                                    Enregistrer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                    onClick={onClose}
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default RepairEditModal;
