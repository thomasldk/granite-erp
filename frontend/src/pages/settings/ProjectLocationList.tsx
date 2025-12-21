import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrashIcon, PlusIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ProjectLocationList() {
    const [locations, setLocations] = useState<any[]>([]);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const res = await api.get('/project-locations');
            setLocations(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName) return;
        try {
            await api.post('/project-locations', { name: newName });
            setNewName('');
            fetchLocations();
        } catch (e) {
            console.error(e);
            console.error(e);
            console.error(e);
            const errMsg = (e as any).response?.data?.details || (e as any).response?.data?.error || (e as any).message;
            alert(`Erreur ajout: ${JSON.stringify(errMsg)}`);
        }
    };

    const handleDelete = async (id: string) => {
        const code = window.prompt("Code de sécurité requis pour supprimer :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }

        try {
            await api.delete(`/project-locations/${id}`);
            fetchLocations();
        } catch (error) {
            console.error('Failed to delete location', error);
            alert('Erreur lors de la suppression');
        }
    };

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const startEditing = (loc: any) => {
        setEditingId(loc.id);
        setEditingName(loc.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveEditing = async () => {
        if (!editingName.trim() || !editingId) return;
        try {
            await api.put(`/project-locations/${editingId}`, { name: editingName });
            setEditingId(null);
            fetchLocations();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Lieux de Projets</h1>

            <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
                <input
                    type="text"
                    className="flex-1 rounded-md border-gray-300 shadow-sm"
                    placeholder="Nouveau lieu (ex: Montréal)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center">
                    <PlusIcon className="h-5 w-5 mr-1" /> Ajouter
                </button>
            </form>

            <ul className="bg-white shadow rounded-md max-w-md divide-y">
                {locations.map(loc => (
                    <li key={loc.id} className="p-4 flex justify-between items-center group">
                        {editingId === loc.id ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={e => setEditingName(e.target.value)}
                                    className="flex-1 rounded-md border-gray-300 shadow-sm text-sm"
                                />
                                <button onClick={saveEditing} className="text-green-600 hover:text-green-800">
                                    <CheckIcon className="h-5 w-5" />
                                </button>
                                <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700">
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span>{loc.name}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => startEditing(loc)} className="text-blue-500 hover:text-blue-700">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(loc.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
