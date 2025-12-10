import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Representative {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mobile: string;
    fax: string;
}

const RepresentativeList: React.FC = () => {
    const [reps, setReps] = useState<Representative[]>([]);

    // Form State
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '' });
    const [editingRepId, setEditingRepId] = useState<string | null>(null);

    useEffect(() => {
        loadReps();
    }, []);

    const loadReps = async () => {
        try {
            const res = await api.get('/representatives');
            setReps(res.data);
        } catch (error) {
            console.error('Error loading reps', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Êtes-vous sûr ?')) return;
        try {
            await api.delete(`/representatives/${id}`);
            loadReps();
        } catch (error) {
            console.error('Error deleting rep', error);
        }
    };

    const handleEdit = (rep: Representative) => {
        setFormData({
            firstName: rep.firstName,
            lastName: rep.lastName,
            email: rep.email || '',
            phone: rep.phone || '',
            mobile: rep.mobile || '',
            fax: rep.fax || ''
        });
        setEditingRepId(rep.id);
        setFormVisible(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingRepId) {
                await api.put(`/representatives/${editingRepId}`, formData);
            } else {
                await api.post('/representatives', formData);
            }
            setFormData({ firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '' });
            setEditingRepId(null);
            setFormVisible(false);
            loadReps();
        } catch (error) {
            console.error('Error saving rep', error);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    const formatPhoneNumber = (value: string) => {
        if (!value) return value;
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Gestion des Représentants</h2>
                <button
                    onClick={() => {
                        setEditingRepId(null);
                        setFormData({ firstName: '', lastName: '', email: '', phone: '', mobile: '', fax: '' });
                        setFormVisible(!formVisible);
                    }}
                    className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    + Ajouter
                </button>
            </div>

            {formVisible && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow mb-6 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Prénom"
                            className="border p-2 rounded"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Nom"
                            className="border p-2 rounded"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            required
                        />
                        <input
                            placeholder="Email"
                            className="border p-2 rounded"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                        <input
                            placeholder="Tel (ex: 4185551234)"
                            className="border p-2 rounded"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                        />
                        <input
                            placeholder="Cel (ex: 4185551234)"
                            className="border p-2 rounded"
                            value={formData.mobile}
                            onChange={e => setFormData({ ...formData, mobile: formatPhoneNumber(e.target.value) })}
                        />
                        <input
                            placeholder="Fax"
                            className="border p-2 rounded"
                            value={formData.fax}
                            onChange={e => setFormData({ ...formData, fax: formatPhoneNumber(e.target.value) })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setFormVisible(false); setEditingRepId(null); }} className="text-gray-500 hover:text-gray-700 font-bold px-4">Annuler</button>
                        <button type="submit" className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700">Enregistrer</button>
                    </div>
                </form>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nom</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coordonnées</th>
                            <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reps.map(rep => (
                            <tr key={rep.id}>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <p className="text-gray-900 whitespace-no-wrap font-semibold">{rep.firstName} {rep.lastName}</p>
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{rep.email}</td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    {rep.phone && <div className="text-xs whitespace-no-wrap"><span className="font-bold">Tel:</span> {formatPhoneNumber(rep.phone)}</div>}
                                    {rep.mobile && <div className="text-xs whitespace-no-wrap"><span className="font-bold">Cel:</span> {formatPhoneNumber(rep.mobile)}</div>}
                                    {rep.fax && <div className="text-xs whitespace-no-wrap"><span className="font-bold">Fax:</span> {formatPhoneNumber(rep.fax)}</div>}
                                </td>
                                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <button onClick={() => handleEdit(rep)} className="text-blue-600 hover:text-blue-900 mr-4">Modifier</button>
                                    <button onClick={() => handleDelete(rep.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RepresentativeList;
