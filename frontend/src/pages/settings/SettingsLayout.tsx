import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const SettingsLayout: React.FC = () => {
    return (
        <div className="flex h-full">
            <aside className="w-64 bg-white border-r border-gray-200 pt-8">
                <h3 className="px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Paramètres
                </h3>
                <nav className="flex-1">
                    <NavLink
                        to="/settings/representatives"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Représentants
                    </NavLink>
                    <NavLink
                        to="/settings/contact-types"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Types de Contact
                    </NavLink>
                    <NavLink
                        to="/settings/languages"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Langues
                    </NavLink>
                    <NavLink
                        to="/settings/currencies"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Devises
                    </NavLink>
                    <NavLink
                        to="/settings/locations"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Lieux de Projets
                    </NavLink>
                    <NavLink
                        to="/settings/production-sites"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Lieux de Production
                    </NavLink>
                    {/* Add other sub-tabs here later */}
                    <NavLink
                        to="/settings/database"
                        className={({ isActive }) =>
                            `flex items-center px-6 py-2 text-sm font-medium ${isActive
                                ? 'bg-blue-50 text-primary border-r-4 border-primary'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        Base de Données
                    </NavLink>
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default SettingsLayout;
