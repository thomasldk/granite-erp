import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (!token) {
            setError('Token manquant. Veuillez recliquer sur le lien du courriel.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, newPassword });
            setMessage('Mot de passe modifié avec succès ! Redirection...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Erreur lors de la réinitialisation.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 text-center">
                <h3 className="text-xl font-bold text-red-600">Lien invalide</h3>
                <p>Le lien de réinitialisation est manquant ou incomplet.</p>
                <button onClick={() => navigate('/login')} className="mt-4 text-indigo-600 font-semibold">Retour à la connexion</button>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <h2 className="mt-10 text-center text-3xl font-bold leading-9 tracking-tight text-gray-900">
                    Réinitialisation
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Entrez votre nouveau mot de passe
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white p-8 shadow-md rounded-lg">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="pass" className="block text-sm font-medium leading-6 text-gray-900">
                            Nouveau mot de passe
                        </label>
                        <div className="mt-2">
                            <input
                                id="pass"
                                type="password"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirm" className="block text-sm font-medium leading-6 text-gray-900">
                            Confirmer le mot de passe
                        </label>
                        <div className="mt-2">
                            <input
                                id="confirm"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm text-center font-semibold">
                            {error}
                        </div>
                    )}
                    {message && (
                        <div className="text-green-600 text-sm text-center font-semibold">
                            {message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-400"
                        >
                            {loading ? 'Modification...' : 'Changer le mot de passe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
