import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const ProjectForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Check for edit mode
    const [locations, setLocations] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        reference: '', // Added
        locationId: '',
        measureSystem: 'Imperial',
        status: 'Prospect',
        estimatedWeeks: '',
        numberOfLines: ''
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch locations
                const locRes = await api.get('/project-locations');
                setLocations(locRes.data);

                // If editing, fetch project
                if (id) {
                    const projRes = await api.get('/soumissions');
                    const found = projRes.data.find((p: any) => p.id === id);
                    if (found) {
                        setFormData({
                            name: found.name,
                            reference: found.reference, // Set existing
                            locationId: found.locationId || '',
                            measureSystem: found.measureSystem || 'Imperial',
                            status: found.status || 'Prospect',
                            estimatedWeeks: found.estimatedWeeks ? String(found.estimatedWeeks) : '',
                            numberOfLines: found.numberOfLines ? String(found.numberOfLines) : ''
                        });
                    }
                } else {
                    // Fetch next reference for new project
                    const refRes = await api.get('/soumissions/next-reference');
                    setFormData(prev => ({ ...prev, reference: refRes.data.reference }));
                }
            } catch (error) { console.error("Error loading data", error); }
        };
        loadData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (id) {
                await api.put(`/soumissions/${id}`, formData);
                navigate(`/soumissions/${id}`);
            } else {
                const response = await api.post('/soumissions', formData);
                navigate(`/soumissions/${response.data.id}`);
            }
        } catch (error) {
            console.error('Error saving project', error);
            alert('Erreur lors de la sauvegarde du projet');
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <button onClick={() => navigate('/soumissions')} className="text-gray-500 hover:text-gray-700 mb-4">
                &larr; Retour à la liste
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{id ? 'Modifier le Projet' : 'Nouveau Projet'}</h1>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border border-gray-100">
                <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Nom du Projet
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="name"
                            type="text"
                            placeholder="Ex: Rénovation Cuisine M. Dupont"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Référence
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none"
                            name="reference"
                            type="text"
                            value={formData.reference}
                            readOnly
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Lieu du Projet (Paramètres)
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="locationId" // Bind to locationId
                            value={formData.locationId}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- Sélectionner un lieu --</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Liste gérée dans les paramètres.
                        </p>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Système de Mesure
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="measureSystem"
                            value={formData.measureSystem}
                            onChange={handleChange}
                        >
                            <option value="Imperial">Impérial (pieds/pouces)</option>
                            <option value="Metric">Métrique (mm/cm)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Semaines de Prod. (Estimé)
                        </label>
                        <select
                            className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="estimatedWeeks"
                            value={formData.estimatedWeeks || ''}
                            onChange={handleChange}
                        >
                            <option value="">-- Choisir --</option>
                            <option value="0">À déterminer</option>
                            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                <option key={num} value={num}>{num} semaines</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Nombre de Lignes
                        </label>
                        <input
                            type="number"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary"
                            name="numberOfLines"
                            value={formData.numberOfLines || ''}
                            onChange={handleChange}
                            placeholder="Ex: 5"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        type="submit"
                    >
                        {id ? 'Mettre à jour' : 'Créer le Projet'}
                    </button>
                    <button
                        className="inline-block align-baseline font-bold text-sm text-primary hover:text-blue-800"
                        type="button"
                        onClick={() => navigate('/soumissions')}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectForm;
