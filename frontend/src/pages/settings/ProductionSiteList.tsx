import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrashIcon, PlusIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ProductionSite {
    id: string;
    name: string;
    address?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    country?: string;
    managerName?: string;
    managerEmail?: string;
    managerPhone?: string;
}

export default function ProductionSiteList() {
    const [sites, setSites] = useState<ProductionSite[]>([]);

    // New Site State
    const [newSite, setNewSite] = useState<Partial<ProductionSite>>({
        name: '',
        address: '',
        city: '',
        province: 'QC',
        zipCode: '',
        country: 'Canada',
        managerName: '',
        managerEmail: '',
        managerPhone: ''
    });

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingSite, setEditingSite] = useState<Partial<ProductionSite>>({});

    useEffect(() => {
        fetchSites();
    }, []);

    const fetchSites = async () => {
        try {
            const res = await api.get('/production-sites');
            setSites(res.data);
        } catch (e) {
            console.error("Failed to fetch production sites", e);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSite.name?.trim()) return;
        try {
            await api.post('/production-sites', newSite);
            setNewSite({
                name: '',
                address: '',
                city: '',
                province: 'QC',
                zipCode: '',
                country: 'Canada',
                managerName: '',
                managerEmail: '',
                managerPhone: ''
            });
            fetchSites();
        } catch (e) {
            console.error("Failed to create production site", e);
        }
    };

    const handleDelete = async (id: string) => {
        const code = window.prompt("Code de sécurité requis pour supprimer :");
        if (code !== '1234') {
            if (code !== null) alert("Code incorrect.");
            return;
        }

        try {
            await api.delete(`/production-sites/${id}`);
            fetchSites();
        } catch (error) {
            console.error('Failed to delete site', error);
            alert('Erreur lors de la suppression');
        }
    };

    const startEditing = (site: ProductionSite) => {
        setEditingId(site.id);
        setEditingSite({ ...site });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingSite({});
    };

    const saveEditing = async () => {
        if (!editingSite.name?.trim() || !editingId) return;
        try {
            await api.put(`/production-sites/${editingId}`, editingSite);
            setEditingId(null);
            fetchSites();
        } catch (e) {
            console.error("Failed to update production site", e);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Lieux de Production</h1>

            {/* Add Form */}
            <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ajouter un nouveau site</h3>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Nom du Site *"
                        value={newSite.name}
                        onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Adresse"
                        value={newSite.address}
                        onChange={e => setNewSite({ ...newSite, address: e.target.value })}
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Ville"
                        value={newSite.city}
                        onChange={e => setNewSite({ ...newSite, city: e.target.value })}
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Province (ex: QC)"
                        value={newSite.province}
                        onChange={e => setNewSite({ ...newSite, province: e.target.value })}
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Code Postal"
                        value={newSite.zipCode}
                        onChange={e => setNewSite({ ...newSite, zipCode: e.target.value })}
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Pays"
                        value={newSite.country}
                        onChange={e => setNewSite({ ...newSite, country: e.target.value })}
                    />
                    <input
                        type="text"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Nom Responsable"
                        value={newSite.managerName}
                        onChange={e => setNewSite({ ...newSite, managerName: e.target.value })}
                    />
                    <input
                        type="email"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Email Responsable"
                        value={newSite.managerEmail}
                        onChange={e => setNewSite({ ...newSite, managerEmail: e.target.value })}
                    />
                    <input
                        type="tel"
                        className="rounded-md border-gray-300 shadow-sm text-sm"
                        placeholder="Tel Responsable"
                        value={newSite.managerPhone}
                        onChange={e => setNewSite({ ...newSite, managerPhone: e.target.value })}
                    />

                    <div className="col-span-full flex justify-end">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center hover:bg-indigo-700 transition text-sm">
                            <PlusIcon className="h-4 w-4 mr-1" /> Ajouter le site
                        </button>
                    </div>
                </form>
            </div>

            <ul className="bg-white shadow rounded-md divide-y">
                {sites.map(site => (
                    <li key={site.id} className="p-4 group">
                        {editingId === site.id ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    value={editingSite.name}
                                    onChange={e => setEditingSite({ ...editingSite, name: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm font-bold"
                                    placeholder="Nom *"
                                />
                                <input
                                    type="text"
                                    value={editingSite.address || ''}
                                    onChange={e => setEditingSite({ ...editingSite, address: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Adresse"
                                />
                                <input
                                    type="text"
                                    value={editingSite.city || ''}
                                    onChange={e => setEditingSite({ ...editingSite, city: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Ville"
                                />
                                <input
                                    type="text"
                                    value={editingSite.province || ''}
                                    onChange={e => setEditingSite({ ...editingSite, province: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Province"
                                />
                                <input
                                    type="text"
                                    value={editingSite.zipCode || ''}
                                    onChange={e => setEditingSite({ ...editingSite, zipCode: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Code Postal"
                                />
                                <input
                                    type="text"
                                    value={editingSite.country || ''}
                                    onChange={e => setEditingSite({ ...editingSite, country: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Pays"
                                />
                                <input
                                    type="text"
                                    value={editingSite.managerName || ''}
                                    onChange={e => setEditingSite({ ...editingSite, managerName: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Responsable"
                                />
                                <input
                                    type="text"
                                    value={editingSite.managerEmail || ''}
                                    onChange={e => setEditingSite({ ...editingSite, managerEmail: e.target.value })}
                                    className="rounded-md border-gray-300 shadow-sm text-sm"
                                    placeholder="Email"
                                />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={editingSite.managerPhone || ''}
                                        onChange={e => setEditingSite({ ...editingSite, managerPhone: e.target.value })}
                                        className="rounded-md border-gray-300 shadow-sm text-sm flex-1"
                                        placeholder="Tel"
                                    />
                                    <button onClick={saveEditing} className="text-green-600 hover:text-green-800 p-1">
                                        <CheckIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700 p-1">
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{site.name}</h3>
                                    <div className="text-sm text-gray-500 mt-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                                        <p>
                                            <span className="font-medium text-gray-700">Adresse:</span> {site.address || '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Ville/Prov:</span> {site.city}{site.city && site.province ? ', ' : ''}{site.province}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Resp:</span> {site.managerName || '-'}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-700">Contact:</span> {site.managerEmail || '-'} {site.managerPhone ? `(${site.managerPhone})` : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => startEditing(site)} className="text-blue-500 hover:text-blue-700 p-1">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleDelete(site.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
                {sites.length === 0 && (
                    <li className="p-8 text-center text-gray-500 italic">Aucun lieu de production défini. Utilisez le formulaire ci-dessus pour en ajouter un.</li>
                )}
            </ul>
        </div>
    );
}
