import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

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
        if (!confirm('Supprimer ce lieu ?')) return;
        try {
            await api.delete(`/project-locations/${id}`);
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
                        <span>{loc.name}</span>
                        <button onClick={() => handleDelete(loc.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
