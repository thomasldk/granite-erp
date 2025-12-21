
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrashIcon, PlusIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface MaintenanceSite {
    id: string;
    name: string;
}

export default function MaintenanceSiteList() {
    const [sites, setSites] = useState<MaintenanceSite[]>([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const res = await api.get('/maintenance-sites');
            setSites(res.data);
        } catch (e) {
            console.error("Failed to fetch maintenance sites", e);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        try {
            await api.post('/maintenance-sites', { name: newName });
            setNewName('');
            fetchSites();
        } catch (e) {
            console.error("Failed to create maintenance site", e);
        }
    };

    const handleDelete = async (id: string) => {
        const code = window.prompt("Code de sécurité requis pour supprimer :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }

        try {
            await api.delete(`/maintenance-sites/${id}`);
            fetchSites();
        } catch (error) {
            console.error('Failed to delete site', error);
            alert('Erreur lors de la suppression');
        }
    };

    const startEditing = (site: MaintenanceSite) => {
        setEditingId(site.id);
        setEditingName(site.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const saveEditing = async () => {
        if (!editingName.trim() || !editingId) return;
        try {
            await api.put(`/maintenance-sites/${editingId}`, { name: editingName });
            setEditingId(null);
            fetchSites();
        } catch (e) {
            console.error("Failed to update maintenance site", e);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Lieux de Maintenance</h1>

            <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
                <input
                    type="text"
                    className="flex-1 rounded-md border-gray-300 shadow-sm"
                    placeholder="Nouveau site (ex: Garage A)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700 transition">
                    <PlusIcon className="h-5 w-5 mr-1" /> Ajouter
                </button>
            </form>

            <ul className="bg-white shadow rounded-md max-w-md divide-y">
                {sites.map(site => (
                    <li key={site.id} className="p-4 flex justify-between items-center group">
                        {editingId === site.id ? (
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
                                <span>{site.name}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => startEditing(site)} className="text-blue-500 hover:text-blue-700">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(site.id)} className="text-red-500 hover:text-red-700">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
                {sites.length === 0 && (
                    <li className="p-4 text-center text-gray-500 italic">Aucun site de maintenance défini.</li>
                )}
            </ul>
        </div>
    );
}
