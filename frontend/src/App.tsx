import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SystemConfigPage } from './pages/settings/SystemConfigPage';
import { UsersIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ClientDetail from './pages/clients/ClientDetail';
import CatalogueList from './pages/catalogue/CatalogueList';
import StoneForm from './pages/catalogue/StoneForm';

import QuoteList from './pages/soumissions/QuoteList';
import QuoteForm from './pages/soumissions/QuoteForm';
import SoumissionList from './pages/soumissions/SoumissionList';
import ProjectDetail from './pages/soumissions/ProjectDetail';
import ProjectForm from './pages/soumissions/ProjectForm';
import SettingsLayout from './pages/settings/SettingsLayout';
import RepresentativeList from './pages/settings/RepresentativeList';
import ContactTypeList from './pages/settings/ContactTypeList';
import LanguageList from './pages/settings/LanguageList';
import CurrencyList from './pages/settings/CurrencyList';
import ProjectLocationList from './pages/settings/ProjectLocationList';
import ProductionSiteList from './pages/settings/ProductionSiteList';
import MaintenanceSiteList from './pages/settings/MaintenanceSiteList';
import IncotermList from './pages/settings/IncotermList'; // Added
import SystemConfig from './pages/settings/GlobalParameters'; // Added V8
import { DatabaseSettings } from './pages/settings/DatabaseSettings';
import ProductionDashboard from './pages/production/ProductionDashboard';
import ProductionOrderDetail from './pages/production/ProductionOrderDetail'; // Added
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import RHDashboard from './pages/rh/RHDashboard';
import EquipmentList from './pages/maintenance/EquipmentList';
import CategoryList from './pages/maintenance/CategoryList';
import PartList from './pages/maintenance/PartList';
import PartCategoryList from './pages/maintenance/PartCategoryList'; // Added
import RepairList from './pages/maintenance/RepairList';
import RepairForm from './pages/maintenance/RepairForm';
import MechanicPlanning from './pages/maintenance/MechanicPlanning'; // Added
import EquipmentPlanning from './pages/maintenance/EquipmentPlanning';
import RepairPrintView from './pages/maintenance/RepairPrintView'; // Added

// Layout Component (unchanged)
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import { Outlet } from 'react-router-dom';

// Layout Component using Outlet and Logout Button
const Layout: React.FC = () => {
    const [isTiersOpen, setIsTiersOpen] = useState(true);
    const [isCatalogueOpen, setIsCatalogueOpen] = useState(true);
    const [isProductionOpen, setIsProductionOpen] = useState(true);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(true);
    const [isPlanningSubOpen, setIsPlanningSubOpen] = useState(true);
    const [isEquipmentsSubOpen, setIsEquipmentsSubOpen] = useState(true);
    const [isPartsSubOpen, setIsPartsSubOpen] = useState(true);
    const { logout, user } = useAuth(); // Access Logout

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-dark text-white flex flex-col">
                <div className="h-40 flex items-center justify-center border-b border-gray-700 bg-gray-900 pr-4 flex-col gap-2">
                    <img src="/logo.jpg" alt="Logo" className="h-24 w-auto rounded" />
                    <div className="text-xs text-gray-400">Connecté: {user?.firstName}</div>
                </div>
                <nav className="flex-1 py-6 overflow-y-auto">
                    <ul>
                        <li className="px-6 py-2 hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white transition-colors border-l-4 border-transparent hover:border-blue-500">
                            <Link to="/" className="block">Tableau de Bord</Link>
                        </li>
                        <li className="px-6 py-2 hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white transition-colors border-l-4 border-transparent hover:border-blue-500">
                            <Link to="/soumissions" className="block">Projets</Link>
                        </li>
                        {/* Production Accordion */}
                        <li className="px-6 py-2">
                            <button
                                onClick={() => setIsProductionOpen(!isProductionOpen)}
                                className="flex items-center justify-between w-full text-gray-300 hover:text-white group focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                            >
                                <span className="flex items-center">
                                    <span className="w-5 h-5 mr-3 flex items-center justify-center">🛠️</span>
                                    Production
                                </span>
                                {isProductionOpen ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                )}
                            </button>
                            {isProductionOpen && (
                                <div className="ml-8 mt-2 space-y-1 text-sm border-l-2 border-gray-700 pl-4">
                                    <Link to="/production/list" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Liste des BT</Link>
                                    <Link to="/production/line" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Ligne de production</Link>
                                </div>
                            )}
                        </li>
                        <li className="px-6 py-2">
                            <button
                                onClick={() => setIsTiersOpen(!isTiersOpen)}
                                className="flex items-center justify-between w-full text-gray-300 hover:text-white group focus:outline-none transition-colors"
                            >
                                <span className="flex items-center">
                                    <UsersIcon className="w-5 h-5 mr-3" />
                                    Tiers
                                </span>
                                {isTiersOpen ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                )}
                            </button>
                            {isTiersOpen && (
                                <div className="ml-8 mt-2 space-y-1 text-sm border-l-2 border-gray-700 pl-4">
                                    <Link to="/clients" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Clients</Link>
                                    <Link to="/suppliers" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Fournisseurs</Link>
                                </div>
                            )}
                        </li>
                        {/* Catalogue Accordion */}
                        <li className="px-6 py-2">
                            <button
                                onClick={() => setIsCatalogueOpen(!isCatalogueOpen)}
                                className="flex items-center justify-between w-full text-gray-300 hover:text-white group focus:outline-none transition-colors"
                            >
                                <span className="flex items-center">
                                    <span className="w-5 h-5 mr-3">🪨</span> {/* You can replace with an icon later */}
                                    Catalogue
                                </span>
                                {isCatalogueOpen ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                )}
                            </button>
                            {isCatalogueOpen && (
                                <div className="ml-8 mt-2 space-y-1 text-sm border-l-2 border-gray-700 pl-4">
                                    <Link to="/catalogue/stone" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Achat Pierre</Link>
                                    <Link to="/catalogue/standard" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Produits Standards</Link>
                                </div>
                            )}
                        </li>
                        <li className="px-6 py-2">
                            <button
                                onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
                                className="flex items-center justify-between w-full text-gray-300 hover:text-white group focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                            >
                                <span className="flex items-center">
                                    <span className="w-5 h-5 mr-3 flex items-center justify-center">🔧</span>
                                    Maintenance
                                </span>
                                {isMaintenanceOpen ? (
                                    <ChevronDownIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                ) : (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                )}
                            </button>
                            {isMaintenanceOpen && (
                                <div className="ml-8 mt-2 space-y-1 text-sm border-l-2 border-gray-700 pl-4">
                                    {/* Planning Sub-Menu (Added) */}
                                    <button
                                        onClick={() => setIsPlanningSubOpen(!isPlanningSubOpen)}
                                        className="flex items-center justify-between w-full text-gray-400 hover:text-white py-1 group focus:outline-none transition-colors mb-2"
                                    >
                                        <span>Planning</span>
                                        {isPlanningSubOpen ? (
                                            <ChevronDownIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        ) : (
                                            <ChevronRightIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        )}
                                    </button>
                                    {isPlanningSubOpen && (
                                        <div className="ml-4 space-y-1 border-l border-gray-600 pl-3 mb-2">
                                            <Link to="/maintenance/planning/mechanic" className="block text-gray-500 hover:text-white py-1 transition-colors">Planning par mécanicien</Link>
                                            <Link to="/maintenance/planning/equipment" className="block text-gray-500 hover:text-white py-1 transition-colors">Planning par équipement</Link>
                                        </div>
                                    )}

                                    {/* Equipments Sub-Menu */}
                                    <button
                                        onClick={() => setIsEquipmentsSubOpen(!isEquipmentsSubOpen)}
                                        className="flex items-center justify-between w-full text-gray-400 hover:text-white py-1 group focus:outline-none transition-colors"
                                    >
                                        <span>Équipements</span>
                                        {isEquipmentsSubOpen ? (
                                            <ChevronDownIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        ) : (
                                            <ChevronRightIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        )}
                                    </button>
                                    {isEquipmentsSubOpen && (
                                        <div className="ml-4 space-y-1 border-l border-gray-600 pl-3">
                                            <Link to="/maintenance/equipment" className="block text-gray-500 hover:text-white py-1 transition-colors">Liste</Link>
                                            <Link to="/maintenance/categories" className="block text-gray-500 hover:text-white py-1 transition-colors">Catégories</Link>
                                        </div>
                                    )}

                                    {/* Parts Sub-Menu */}

                                    <button
                                        onClick={() => setIsPartsSubOpen(!isPartsSubOpen)}
                                        className="flex items-center justify-between w-full text-gray-400 hover:text-white py-1 group focus:outline-none transition-colors mt-2"
                                    >
                                        <span>Pièces</span>
                                        {isPartsSubOpen ? (
                                            <ChevronDownIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        ) : (
                                            <ChevronRightIcon className="w-3 h-3 text-gray-500 group-hover:text-white" />
                                        )}
                                    </button>
                                    {isPartsSubOpen && (
                                        <div className="ml-4 space-y-1 border-l border-gray-600 pl-3">
                                            <Link to="/maintenance/parts" className="block text-gray-500 hover:text-white py-1 transition-colors">Liste</Link>
                                            <Link to="/maintenance/part-categories" className="block text-gray-500 hover:text-white py-1 transition-colors">Catégories</Link>
                                        </div>
                                    )}

                                    {/* Repairs Direct Link */}
                                    <Link
                                        to="/maintenance/repairs"
                                        className="flex items-center justify-between w-full text-left text-gray-400 hover:text-white py-2 transition-colors mt-2"
                                    >
                                        <span>Entretiens et réparations</span>
                                    </Link>

                                </div>
                            )}
                        </li>
                        <li className="px-6 py-2 hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white transition-colors border-l-4 border-transparent hover:border-blue-500">
                            <Link to="/rh" className="flex items-center">
                                <span className="mr-3 w-5 h-5 flex items-center justify-center">👥</span>
                                RH
                            </Link>
                        </li>
                        <li className="px-6 py-2 hover:bg-gray-700 cursor-pointer text-gray-300 hover:text-white mt-8 border-t border-gray-700 pt-4">
                            <Link to="/settings" className="flex items-center">
                                <span className="mr-2">⚙️</span> Paramètres
                            </Link>
                        </li>
                    </ul>
                    <div className="px-6 pt-6 mt-4 border-t border-gray-700">
                        <button onClick={logout} className="flex items-center text-red-400 hover:text-red-300">
                            <span className="mr-2">🚪</span> Déconnexion
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <Outlet />
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Route */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes inside Layout */}
                    <Route element={<Layout />}>
                        <Route path="/" element={
                            <div className="p-8">
                                <h2 className="text-2xl font-bold mb-4">Bienvenue sur Granite ERP</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700">Soumissions en cours</h3>
                                        <p className="text-3xl font-bold text-primary mt-2">12</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700">Clients Actifs</h3>
                                        <p className="text-3xl font-bold text-secondary mt-2">45</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-700">Commandes à livrer</h3>
                                        <p className="text-3xl font-bold text-green-600 mt-2">8</p>
                                    </div>
                                </div>
                            </div>
                        } />

                        <Route path="/clients" element={<ClientList type="Client" />} />
                        <Route path="/clients/new" element={<ClientForm defaultType="Client" />} />
                        <Route path="/clients/:id" element={<ClientDetail />} />
                        <Route path="/clients/:id/edit" element={<ClientForm defaultType="Client" />} />

                        <Route path="/suppliers" element={<ClientList type="Supplier" />} />
                        <Route path="/suppliers/new" element={<ClientForm defaultType="Supplier" />} />
                        <Route path="/suppliers/:id" element={<ClientDetail />} />
                        <Route path="/suppliers/:id/edit" element={<ClientForm defaultType="Supplier" />} />

                        <Route path="/catalogue" element={<CatalogueList />} />
                        <Route path="/catalogue/stone" element={<CatalogueList category="Stone" />} />
                        <Route path="/catalogue/standard" element={<CatalogueList category="Standard" />} />
                        <Route path="/catalogue/new" element={<StoneForm />} />
                        <Route path="/catalogue/stone/new" element={<StoneForm defaultCategory="Stone" />} />
                        <Route path="/catalogue/standard/new" element={<StoneForm defaultCategory="Standard" />} />
                        <Route path="/catalogue/edit/:id" element={<StoneForm />} />
                        <Route path="/soumissions" element={<SoumissionList />} />
                        <Route path="/soumissions/new-project" element={<ProjectForm />} />
                        <Route path="/soumissions/projects/:id/edit" element={<ProjectForm />} /> {/* Added */}
                        <Route path="/soumissions/:id" element={<ProjectDetail />} />
                        <Route path="/soumissions/:projectId/new-quote" element={<QuoteForm />} />

                        <Route path="/production" element={<ProductionDashboard />} />
                        <Route path="/production/list" element={<ProductionDashboard />} />
                        <Route path="/production/line" element={<ProductionDashboard />} />
                        <Route path="/production/:id" element={<ProductionOrderDetail />} /> {/* Added Detail Route */}

                        <Route path="/maintenance" element={<MaintenanceDashboard />} />
                        <Route path="/maintenance" element={<MaintenanceDashboard />} />
                        <Route path="/maintenance/equipment" element={<EquipmentList />} />
                        <Route path="/maintenance/categories" element={<CategoryList />} />
                        <Route path="/maintenance/parts" element={<PartList />} />
                        <Route path="/maintenance/part-categories" element={<PartCategoryList />} />
                        <Route path="/maintenance/repairs" element={<RepairList />} />
                        <Route path="/maintenance/repairs/new" element={<RepairForm />} />
                        <Route path="/maintenance/repairs/edit/:id" element={<RepairForm />} />
                        <Route path="/maintenance/repairs/print/:id" element={<RepairPrintView />} /> {/* Added */}
                        <Route path="/maintenance/planning/mechanic" element={<MechanicPlanning />} />
                        <Route path="/maintenance/planning/equipment" element={<EquipmentPlanning />} />


                        {/* Added */}

                        <Route path="/rh" element={<RHDashboard />} />

                        {/* Keeping /quotes for direct access or legacy if needed, but main flow is via Project */}
                        <Route path="/quotes" element={<QuoteList />} />
                        <Route path="/quotes/:id" element={<QuoteForm />} />

                        <Route path="/settings" element={<SettingsLayout />}>
                            <Route index element={<div className="text-gray-500">Sélectionnez une option</div>} />
                            <Route path="representatives" element={<RepresentativeList />} />
                            <Route path="contact-types" element={<ContactTypeList />} />
                            <Route path="languages" element={<LanguageList />} />
                            <Route path="currencies" element={<CurrencyList />} />
                            <Route path="locations" element={<ProjectLocationList />} />
                            <Route path="incoterms" element={<IncotermList />} /> {/* Added */}
                            <Route path="system-config" element={<SystemConfig />} /> {/* Added V8 */}
                            <Route path="production-sites" element={<ProductionSiteList />} />
                            <Route path="maintenance-sites" element={<MaintenanceSiteList />} />
                            <Route path="system" element={<SystemConfigPage />} />
                            <Route path="database" element={<DatabaseSettings />} />
                        </Route>
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
