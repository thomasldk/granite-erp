import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        activeQuotes: 0,
        activeClients: 0,
        openWorkOrders: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Bienvenue sur Granite ERP</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Soumissions en cours</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{stats.activeQuotes}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Clients Actifs</h3>
                    <p className="text-3xl font-bold text-secondary mt-2">{stats.activeClients}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">Commandes à livrer</h3>
                    <p className="text-3xl font-bold text-green-600 mt-2">{stats.openWorkOrders}</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
