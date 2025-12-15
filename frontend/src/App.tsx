import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import { DatabaseSettings } from './pages/settings/DatabaseSettings';
import ProductionDashboard from './pages/production/ProductionDashboard';
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import EquipmentList from './pages/maintenance/EquipmentList';
import EquipmentForm from './pages/maintenance/EquipmentForm';
import EquipmentCategoryList from './pages/maintenance/EquipmentCategoryList';
import EquipmentCategoryForm from './pages/maintenance/EquipmentCategoryForm';
import PartList from './pages/maintenance/PartList';
import PartForm from './pages/maintenance/PartForm';
import PartCategoryList from './pages/maintenance/PartCategoryList';
import PartCategoryForm from './pages/maintenance/PartCategoryForm';
import RepairList from './pages/maintenance/RepairList';
import RepairForm from './pages/maintenance/RepairForm';
import RHDashboard from './pages/rh/RHDashboard';

// Layout Component (unchanged)
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isTiersOpen, setIsTiersOpen] = useState(true);
    const [isCatalogueOpen, setIsCatalogueOpen] = useState(true);
    const [isProductionOpen, setIsProductionOpen] = useState(true);
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(true); // Added

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-dark text-white flex flex-col">
                <div className="h-40 flex items-center justify-center border-b border-gray-700 bg-gray-900 pr-4">
                    <img src="/logo.jpg" alt="Logo" className="h-32 w-auto rounded" />
                </div>
                <nav className="flex-1 py-6">
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
                                    <Link to="/production?site=RAP" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Production RAP</Link>
                                    <Link to="/production?site=STD" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Production STD</Link>
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
                        {/* Maintenance Accordion */}
                        <li className="px-6 py-2">
                            <button
                                onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
                                className="flex items-center justify-between w-full text-gray-300 hover:text-white group focus:outline-none transition-colors border-l-4 border-transparent hover:border-blue-500"
                            >
                                <span className="flex items-center">
                                    <span className="mr-3 w-5 h-5 flex items-center justify-center">🔧</span>
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
                                    <Link to="/maintenance/repairs" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Réparations</Link>
                                    <Link to="/maintenance/equipment" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200">Équipements</Link>
                                    <Link to="/maintenance/categories" className="block text-gray-500 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200 ml-3 text-xs">Catégories</Link>

                                    <Link to="/maintenance/parts" className="block text-gray-400 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200 mt-2">Pièces</Link>
                                    <Link to="/maintenance/part-categories" className="block text-gray-500 hover:text-white py-1 transition-colors hover:translate-x-1 duration-200 ml-3 text-xs">Catégories(Pce)</Link>
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
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
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

                    <Route path="/maintenance" element={<MaintenanceDashboard />} />
                    <Route path="/maintenance/equipment" element={<EquipmentList />} />
                    <Route path="/maintenance/equipment/new" element={<EquipmentForm />} />
                    <Route path="/maintenance/equipment/:id/edit" element={<EquipmentForm />} />

                    <Route path="/maintenance/categories" element={<EquipmentCategoryList />} />
                    <Route path="/maintenance/categories/new" element={<EquipmentCategoryForm />} />
                    <Route path="/maintenance/categories/:id/edit" element={<EquipmentCategoryForm />} />

                    <Route path="/maintenance/parts" element={<PartList />} />
                    <Route path="/maintenance/parts/new" element={<PartForm />} />
                    <Route path="/maintenance/parts/:id/edit" element={<PartForm />} />

                    <Route path="/maintenance/part-categories" element={<PartCategoryList />} />
                    <Route path="/maintenance/part-categories/new" element={<PartCategoryForm />} />
                    <Route path="/maintenance/part-categories/:id/edit" element={<PartCategoryForm />} />

                    <Route path="/maintenance/repairs" element={<RepairList />} />
                    <Route path="/maintenance/repairs/new" element={<RepairForm />} />
                    <Route path="/maintenance/repairs/:id/edit" element={<RepairForm />} />


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
                        <Route path="currencies" element={<CurrencyList />} />
                        <Route path="locations" element={<ProjectLocationList />} />
                        <Route path="production-sites" element={<ProductionSiteList />} />
                        <Route path="database" element={<DatabaseSettings />} />
                    </Route>
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
