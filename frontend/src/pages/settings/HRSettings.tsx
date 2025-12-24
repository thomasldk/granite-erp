
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrashIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

const HRSettings: React.FC = () => {
    const [departments, setDepartments] = useState<any[]>([]);
    const [jobTitles, setJobTitles] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [hrSites, setHrSites] = useState<any[]>([]);
    const [printers, setPrinters] = useState<any[]>([]);
    // New HR Sites state will be added next

    // Form states
    const [newDepartment, setNewDepartment] = useState('');
    const [newJobTitle, setNewJobTitle] = useState('');
    const [newRole, setNewRole] = useState('');
    const [newHRSite, setNewHRSite] = useState('');
    const [newPrinter, setNewPrinter] = useState('');
    const [newPrinterType, setNewPrinterType] = useState('Office'); // 'Office' or 'Label'

    const fetchData = async () => {
        try {
            const [deptRes, jobRes, roleRes, siteRes, printerRes] = await Promise.all([
                api.get('/hr-settings/departments'),
                api.get('/hr-settings/job-titles'),
                api.get('/hr-settings/roles'),
                api.get('/hr-settings/sites'),
                api.get('/hr-settings/printers')
            ]);
            setDepartments(deptRes.data);
            setJobTitles(jobRes.data);
            setRoles(roleRes.data);
            setHrSites(siteRes.data);
            setPrinters(printerRes.data || []);
        } catch (error) {
            console.error("Error fetching HR settings", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddDepartment = async () => {
        if (!newDepartment.trim()) return;
        try {
            await api.post('/hr-settings/departments', { name: newDepartment });
            setNewDepartment('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm("Supprimer ce département ?")) return;
        const code = prompt("Entrez le code de sécurité pour supprimer :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        try {
            await api.delete(`/hr-settings/departments/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditDepartment = async (dept: any) => {
        const code = prompt("Entrez le code de sécurité pour modifier :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        const newName = prompt("Modifier le nom du département :", dept.name);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/hr-settings/departments/${dept.id}`, { name: newName });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la modification");
        }
    };

    const handleAddJobTitle = async () => {
        if (!newJobTitle.trim()) return;
        try {
            await api.post('/hr-settings/job-titles', { name: newJobTitle });
            setNewJobTitle('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDeleteJobTitle = async (id: string) => {
        if (!confirm("Supprimer ce titre ?")) return;
        const code = prompt("Entrez le code de sécurité pour supprimer :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        try {
            await api.delete(`/hr-settings/job-titles/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditJobTitle = async (job: any) => {
        const code = prompt("Entrez le code de sécurité pour modifier :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        const newName = prompt("Modifier le titre :", job.name);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/hr-settings/job-titles/${job.id}`, { name: newName });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la modification");
        }
    };

    const handleAddRole = async () => {
        if (!newRole.trim()) return;
        try {
            await api.post('/hr-settings/roles', { name: newRole });
            setNewRole('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDeleteRole = async (id: string) => {
        if (!confirm("Supprimer ce rôle ?")) return;
        const code = prompt("Entrez le code de sécurité pour supprimer :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        try {
            await api.delete(`/hr-settings/roles/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditRole = async (role: any) => {
        const code = prompt("Entrez le code de sécurité pour modifier :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        const newName = prompt("Modifier le rôle :", role.name);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/hr-settings/roles/${role.id}`, { name: newName });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la modification");
        }
    };


    const handleAddHRSite = async () => {
        if (!newHRSite.trim()) return;
        try {
            await api.post('/hr-settings/sites', { name: newHRSite });
            setNewHRSite('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDeleteHRSite = async (id: string) => {
        if (!confirm("Supprimer ce site RH ?")) return;
        const code = prompt("Entrez le code de sécurité pour supprimer :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        try {
            await api.delete(`/hr-settings/sites/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditHRSite = async (site: any) => {
        const code = prompt("Entrez le code de sécurité pour modifier :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        const newName = prompt("Modifier le site :", site.name);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/hr-settings/sites/${site.id}`, { name: newName });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la modification");
        }
    };

    const handleAddPrinter = async () => {
        if (!newPrinter.trim()) return;
        try {
            await api.post('/hr-settings/printers', { name: newPrinter, type: newPrinterType });
            setNewPrinter('');
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDeletePrinter = async (id: string) => {
        if (!confirm("Supprimer cette imprimante ?")) return;
        const code = prompt("Entrez le code de sécurité pour supprimer :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        try {
            await api.delete(`/hr-settings/printers/${id}`);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleEditPrinter = async (printer: any) => {
        const code = prompt("Entrez le code de sécurité pour modifier :");
        if (code !== "1234") {
            alert("Code incorrect !");
            return;
        }
        const newName = prompt("Modifier le nom de l'imprimante :", printer.name);
        if (!newName || !newName.trim()) return;
        try {
            await api.put(`/hr-settings/printers/${printer.id}`, { name: newName });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la modification");
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres RH</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* DEPARTMENTS CARD */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Départements</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="Nouveau département..."
                            value={newDepartment}
                            onChange={e => setNewDepartment(e.target.value)}
                        />
                        <button
                            onClick={handleAddDepartment}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {departments.map(dept => (
                            <li key={dept.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                                <span className="font-medium text-gray-700">{dept.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditDepartment(dept)} className="text-blue-400 hover:text-blue-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteDepartment(dept.id)} className="text-red-400 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* JOB TITLES CARD */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Titres de Poste</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="Nouveau titre..."
                            value={newJobTitle}
                            onChange={e => setNewJobTitle(e.target.value)}
                        />
                        <button
                            onClick={handleAddJobTitle}
                            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {jobTitles.map(title => (
                            <li key={title.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                                <span className="font-medium text-gray-700">{title.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditJobTitle(title)} className="text-blue-400 hover:text-blue-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteJobTitle(title.id)} className="text-red-400 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* ROLES CARD */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Rôles / Accès ERP</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="Nouveau rôle (ex: SUPERVISEUR)..."
                            value={newRole}
                            onChange={e => setNewRole(e.target.value)}
                        />
                        <button
                            onClick={handleAddRole}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {roles.map(role => (
                            <li key={role.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                                <span className="font-medium text-gray-700">{role.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditRole(role)} className="text-blue-400 hover:text-blue-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteRole(role.id)} className="text-red-400 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* SITES RH CARD */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Sites RH (Lieux de travail)</h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2"
                            placeholder="Nouveau site (ex: Usine 1, Bureau)..."
                            value={newHRSite}
                            onChange={e => setNewHRSite(e.target.value)}
                        />
                        <button
                            onClick={handleAddHRSite}
                            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center"
                        >
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <ul className="divide-y divide-gray-100">
                        {hrSites.map(site => (
                            <li key={site.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
                                <span className="font-medium text-gray-700">{site.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditHRSite(site)} className="text-blue-400 hover:text-blue-700">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDeleteHRSite(site.id)} className="text-red-400 hover:text-red-700">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* PRINTERS CARD */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 col-span-1 md:col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Gestion des Imprimantes</h2>

                    {/* ADD FORM */}
                    <div className="flex gap-2 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <select
                            value={newPrinterType}
                            onChange={e => setNewPrinterType(e.target.value)}
                            className="border rounded px-3 py-2 bg-white text-sm font-medium text-gray-700"
                        >
                            <option value="Office">Bureau</option>
                            <option value="Label">Étiquette</option>
                        </select>
                        <input
                            type="text"
                            className="flex-1 border rounded px-3 py-2 bg-white"
                            placeholder="Nom de l'imprimante (ex: RICOH-Acceuil)..."
                            value={newPrinter}
                            onChange={e => setNewPrinter(e.target.value)}
                        />
                        <button
                            onClick={handleAddPrinter}
                            className="bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 flex items-center font-medium"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Ajouter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* OFFICE PRINTERS LIST */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-8 bg-blue-500 rounded mr-2"></span>
                                Imprimantes Bureau (Papier)
                            </h3>
                            <ul className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                {printers.filter(p => !p.type || p.type === 'Office').map(printer => (
                                    <li key={printer.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-4 bg-white">
                                        <span className="font-medium text-gray-700">{printer.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditPrinter(printer)} className="text-blue-400 hover:text-blue-700">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeletePrinter(printer.id)} className="text-red-400 hover:text-red-700">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {printers.filter(p => !p.type || p.type === 'Office').length === 0 && (
                                    <li className="py-4 text-center text-gray-400 text-sm italic bg-gray-50">Aucune imprimante de bureau</li>
                                )}
                            </ul>
                        </div>

                        {/* LABEL PRINTERS LIST */}
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-8 bg-orange-500 rounded mr-2"></span>
                                Imprimantes Étiquette (Zebra)
                            </h3>
                            <ul className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                {printers.filter(p => p.type === 'Label').map(printer => (
                                    <li key={printer.id} className="py-3 flex justify-between items-center hover:bg-gray-50 px-4 bg-white">
                                        <span className="font-medium text-gray-700">{printer.name}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditPrinter(printer)} className="text-blue-400 hover:text-blue-700">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeletePrinter(printer.id)} className="text-red-400 hover:text-red-700">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                                {printers.filter(p => p.type === 'Label').length === 0 && (
                                    <li className="py-4 text-center text-gray-400 text-sm italic bg-gray-50">Aucune imprimante étiquette</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRSettings;
