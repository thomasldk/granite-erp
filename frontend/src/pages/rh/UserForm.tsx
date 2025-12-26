
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatPhoneNumber } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface EmployeeProfile {
    employeeNumber?: string;
    gender?: string;
    maritalStatus?: string;
    dob?: string;
    nationality?: string;
    nas?: string;
    sex?: string;
    addressLine1?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    country?: string;
    phoneWork?: string;
    phoneDirect?: string;
    phoneMobile?: string;
    phoneHome?: string;
    emailWork?: string;
    emailPersonal?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyEmail?: string;
    site?: string;
    department?: string; // Bureau, Usine...
    jobTitle?: string;
    supervisor?: string;
    dateHired?: string;
    dateDeparted?: string;
    vacationDays?: number;
    vacationBalance?: number;
    paymentMethod?: string; // Paiement direct
    bankName?: string;
    bankBranch?: string;
    bankAccount?: string;
    institutionCode?: string;
    branchCode?: string;
    printerLabel?: string;
    printerOffice?: string;
}

interface User {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password?: string;
    employeeProfile?: EmployeeProfile;
}

interface UserFormProps {
    existingUser?: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ existingUser, onClose, onSuccess }) => {
    const { user: currentUser, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'contact' | 'func' | 'payment'>('info');

    const [hrSites, setHrSites] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [jobTitles, setJobTitles] = useState<any[]>([]);

    const [roles, setRoles] = useState<any[]>([]);
    const [printers, setPrinters] = useState<any[]>([]);

    const [formData, setFormData] = useState<User>({
        firstName: '',
        lastName: '',
        email: '',
        role: 'USER',
        password: '',
        employeeProfile: {
            nationality: 'Canadienne',
            country: 'Canada',
            province: 'Québec'
        }
    });

    useEffect(() => {
        if (existingUser) {
            setFormData({
                ...existingUser,
                password: '', // Don't populate password
                employeeProfile: existingUser.employeeProfile || {}
            });
        }

        // Fetch auxiliary data
        const fetchData = async () => {
            try {
                const [sitesRes, deptsRes, jobsRes, rolesRes, printerRes] = await Promise.all([
                    api.get('/hr-settings/sites'),
                    api.get('/hr-settings/departments'),
                    api.get('/hr-settings/job-titles'),
                    api.get('/hr-settings/roles'),
                    api.get('/hr-settings/printers')
                ]);
                setHrSites(sitesRes.data);
                setDepartments(deptsRes.data);
                setJobTitles(jobsRes.data);
                setRoles(rolesRes.data);
                setPrinters(printerRes.data);
            } catch (err) {
                console.error("Error fetching form data", err);
            }
        };
        fetchData();
    }, [existingUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let val: any = value;

        if (type === 'number') {
            const parsed = parseFloat(value);
            val = isNaN(parsed) ? null : parsed;
        }

        if (type === 'date' && value === '') val = null;

        // Auto-format phone numbers
        if (['phoneWork', 'phoneDirect', 'phoneMobile', 'phoneHome', 'emergencyPhone'].includes(name)) {
            val = formatPhoneNumber(value);
        }

        setFormData(prev => ({
            ...prev,
            employeeProfile: {
                ...prev.employeeProfile,
                [name]: val
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // sanitize profile data
            const profilePayload = { ...formData.employeeProfile };
            delete (profilePayload as any).id;
            delete (profilePayload as any).userId;
            delete (profilePayload as any).createdAt;
            delete (profilePayload as any).updatedAt;

            const payload = {
                ...formData,
                employeeProfile: profilePayload
            };

            if (existingUser) {
                if (!payload.password) delete payload.password;
                await api.put(`/users/${existingUser.id}`, payload);

                // If updating self, refresh context
                if (currentUser && currentUser.id === existingUser.id) {
                    await refreshUser();
                }

            } else {
                await api.post('/users', payload);
            }
            onSuccess();
        } catch (error: any) {
            console.error("Failed to save user", error);
            const msg = error.response?.data?.error || "Erreur lors de la sauvegarde de l'utilisateur.";
            alert(msg);
        }
    };

    const tabs = [
        { id: 'info', label: '1. Informations Personnelles' },
        { id: 'contact', label: '2. Coordonnées' },
        { id: 'func', label: '3. Fonctions et Droits' },
        { id: 'payment', label: '4. Paiement' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl mx-4 my-8 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center bg-gray-100 rounded-t-lg">
                    <h3 className="text-lg font-bold text-gray-800">
                        {existingUser ? `Fiche Employé: ${existingUser.firstName} ${existingUser.lastName}` : 'Nouvel Employé'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-gray-50">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {/* Tab 1: Info Personnelles (System + Employee) */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                <h4 className="font-bold text-blue-800 mb-3 border-b border-blue-200 pb-1">Identité & Accès Système</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Prénom</label>
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Nom de famille</label>
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Rôle (Accès ERP)</label>
                                        <select name="role" value={formData.role} onChange={handleChange} className="w-full border rounded p-1">
                                            {/* Default/Fallback options if empty or new system */}
                                            {roles.length === 0 && (
                                                <>
                                                    <option value="USER">Utilisateur</option>
                                                    <option value="ADMIN">Administrateur</option>
                                                    <option value="AGENT">Agent</option>
                                                </>
                                            )}
                                            {/* Dynamic Options */}
                                            {roles.map(r => (
                                                <option key={r.id} value={r.name}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Identifiant de Connexion (Login)</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded p-1" required />
                                    </div>                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Mot de Passe</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={existingUser ? "(inchangé)" : ""} required={!existingUser} className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Numéro Employé</label>
                                        <input type="text" name="employeeNumber" value={formData.employeeProfile?.employeeNumber || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Genre</label>
                                    <select name="gender" value={formData.employeeProfile?.gender || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">-</option>
                                        <option value="Monsieur">Monsieur</option>
                                        <option value="Madame">Madame</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">État Civil</label>
                                    <select name="maritalStatus" value={formData.employeeProfile?.maritalStatus || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">-</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                        <option value="Séparé(e)">Séparé(e)</option>
                                        <option value="Divorcé(e)">Divorcé(e)</option>
                                        <option value="Conjoint de fait">Conjoint de fait</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Date de Naissance</label>
                                    <input type="date" name="dob" value={formData.employeeProfile?.dob ? String(formData.employeeProfile.dob).split('T')[0] : ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Sexe</label>
                                    <select name="sex" value={formData.employeeProfile?.sex || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">-</option>
                                        <option value="Masculin">Masculin</option>
                                        <option value="Féminin">Féminin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Nationalité</label>
                                    <select name="nationality" value={formData.employeeProfile?.nationality || 'Canadienne'} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="Canadienne">Canadienne</option>
                                        <option value="Française">Française</option>
                                        <option value="Américaine">Américaine</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">N° Assurance Sociale</label>
                                    <input type="text" name="nas" value={formData.employeeProfile?.nas || ''} onChange={handleProfileChange} className="w-full border rounded p-1" placeholder="XXX XXX XXX" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Coordonnées */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Address */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-1">Adresse Domicile</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Numéro et Voie</label>
                                        <input type="text" name="addressLine1" value={formData.employeeProfile?.addressLine1 || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase">Ville</label>
                                            <input type="text" name="city" value={formData.employeeProfile?.city || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase">Code Postal</label>
                                            <input type="text" name="zipCode" value={formData.employeeProfile?.zipCode || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase">Province</label>
                                            <select name="province" value={formData.employeeProfile?.province || 'Québec'} onChange={handleProfileChange} className="w-full border rounded p-1">
                                                <option value="Québec">Québec</option>
                                                <option value="Ontario">Ontario</option>
                                                <option value="Nouveau-Brunswick">Nouveau-Brunswick</option>
                                                <option value="Nouvelle-Écosse">Nouvelle-Écosse</option>
                                                <option value="Manitoba">Manitoba</option>
                                                <option value="Colombie-Britannique">Colombie-Britannique</option>
                                                <option value="Alberta">Alberta</option>
                                                <option value="Saskatchewan">Saskatchewan</option>
                                                <option value="Terre-Neuve-et-Labrador">Terre-Neuve-et-Labrador</option>
                                                <option value="Île-du-Prince-Édouard">Île-du-Prince-Édouard</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase">Pays</label>
                                            <select name="country" value={formData.employeeProfile?.country || 'Canada'} onChange={handleProfileChange} className="w-full border rounded p-1">
                                                <option value="Canada">Canada</option>
                                                <option value="États-Unis">États-Unis</option>
                                                <option value="Autre">Autre</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Google Map Integration */}
                                    {formData.employeeProfile?.addressLine1 && (
                                        <div className="mt-4">
                                            <div className="rounded border overflow-hidden shadow-sm h-48 bg-gray-100 flex items-center justify-center">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    style={{ border: 0 }}
                                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                                                        [
                                                            formData.employeeProfile?.addressLine1,
                                                            formData.employeeProfile?.city,
                                                            formData.employeeProfile?.province,
                                                            formData.employeeProfile?.zipCode,
                                                            formData.employeeProfile?.country
                                                        ].filter(Boolean).join(', ')
                                                    )}&t=&z=15&ie=UTF8&iwloc=A&output=embed`}
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                            <div className="mt-2 text-right">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        [
                                                            formData.employeeProfile?.addressLine1,
                                                            formData.employeeProfile?.city,
                                                            formData.employeeProfile?.province,
                                                            formData.employeeProfile?.zipCode,
                                                            formData.employeeProfile?.country
                                                        ].filter(Boolean).join(', ')
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-center justify-end"
                                                >
                                                    <span className="mr-1">🗺️</span> Vérifier sur Google Maps
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Methods */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-800 border-b pb-1">Téléphones & Emails</h4>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Cellulaire</label>
                                        <input type="tel" name="phoneMobile" value={formData.employeeProfile?.phoneMobile || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Téléphone Domicile</label>
                                        <input type="tel" name="phoneHome" value={formData.employeeProfile?.phoneHome || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Email Professionnel (Contact / Notifications)</label>
                                        <div className="text-xs text-gray-500 mb-1">Utilisé pour les communications et les notifications.</div>
                                        <input
                                            type="email"
                                            name="emailWork"
                                            value={formData.employeeProfile?.emailWork || ''}
                                            onChange={handleProfileChange}
                                            className="w-full border rounded p-1"
                                            placeholder="exemple@granite.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Courriel Personnel</label>
                                        <input type="email" name="emailPersonal" value={formData.employeeProfile?.emailPersonal || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Téléphone Bureau (Ligne Directe)</label>
                                        <input type="tel" name="phoneDirect" value={formData.employeeProfile?.phoneDirect || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Emergency */}
                            <div className="bg-red-50 p-4 rounded border border-red-100">
                                <h4 className="font-bold text-red-800 mb-3 border-b border-red-200 pb-1">En Cas d'Urgence</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Personne à contacter</label>
                                        <input type="text" name="emergencyName" value={formData.employeeProfile?.emergencyName || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Téléphone Urgence</label>
                                        <input type="tel" name="emergencyPhone" value={formData.employeeProfile?.emergencyPhone || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Courriel Urgence</label>
                                        <input type="email" name="emergencyEmail" value={formData.employeeProfile?.emergencyEmail || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Fonctions */}
                    {activeTab === 'func' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Site (Lieu de travail)</label>
                                    <select name="site" value={formData.employeeProfile?.site || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">Sélectionner...</option>
                                        {hrSites.map(site => (
                                            <option key={site.id} value={site.name}>{site.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Département</label>
                                    <select name="department" value={formData.employeeProfile?.department || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">- Sélectionner -</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.name}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Titre de poste</label>
                                    <select name="jobTitle" value={formData.employeeProfile?.jobTitle || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">- Sélectionner -</option>
                                        {jobTitles.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Responsable immédiat (Superviseur)</label>
                                    <input type="text" name="supervisor" value={formData.employeeProfile?.supervisor || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Date d'arrivée</label>
                                    <input type="date" name="dateHired" value={formData.employeeProfile?.dateHired ? String(formData.employeeProfile.dateHired).split('T')[0] : ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Date de départ</label>
                                    <input type="date" name="dateDeparted" value={formData.employeeProfile?.dateDeparted ? String(formData.employeeProfile.dateDeparted).split('T')[0] : ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Vacances (Jours / An)</label>
                                    <input type="number" name="vacationDays" value={formData.employeeProfile?.vacationDays || 0} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Solde Vacances</label>
                                    <input type="number" step="0.5" name="vacationBalance" value={formData.employeeProfile?.vacationBalance || 0} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 border-t pt-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Imprimante Étiquette</label>
                                        <select name="printerLabel" value={formData.employeeProfile?.printerLabel || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                            <option value="">- Sélectionner -</option>
                                            {printers.filter(p => !p.type || p.type === 'Label').map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase">Imprimante Bureau</label>
                                        <select name="printerOffice" value={formData.employeeProfile?.printerOffice || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                            <option value="">- Sélectionner -</option>
                                            {printers.filter(p => !p.type || p.type === 'Office').map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Paiement */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Mode de paiement</label>
                                    <select name="paymentMethod" value={formData.employeeProfile?.paymentMethod || ''} onChange={handleProfileChange} className="w-full border rounded p-1">
                                        <option value="">-</option>
                                        <option value="Paiement direct">Paiement Direct (Virement)</option>
                                        <option value="Chèque">Chèque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Nom de l'institution</label>
                                    <input type="text" name="bankName" value={formData.employeeProfile?.bankName || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Numéro Institution (3 chiffres)</label>
                                    <input type="text" name="institutionCode" value={formData.employeeProfile?.institutionCode || ''} onChange={handleProfileChange} className="w-full border rounded p-1" maxLength={3} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Numéro Succursale (5 chiffres)</label>
                                    <input type="text" name="branchCode" value={formData.employeeProfile?.branchCode || ''} onChange={handleProfileChange} className="w-full border rounded p-1" maxLength={5} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase">Numéro de Compte</label>
                                    <input type="text" name="bankAccount" value={formData.employeeProfile?.bankAccount || ''} onChange={handleProfileChange} className="w-full border rounded p-1" />
                                </div>
                            </div>
                        </div>
                    )}

                </form>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100">Annuler</button>
                    <button onClick={handleSubmit} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Enregistrer Fiche</button>
                </div>
            </div>
        </div>
    );
};

export default UserForm;
