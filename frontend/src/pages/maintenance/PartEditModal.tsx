import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Part {
    id: string;
    name: string;
    reference: string | null;
    categoryId: string | null;
    siteId: string | null;
    stockQuantity: number;
    minQuantity: number;
    description: string | null;
    supplier: string | null;
    category?: { id: string, name: string } | null;
    site?: { id: string, name: string } | null;
}

interface PartCategory {
    id: string;
    name: string;
}

interface MaintenanceSite {
    id: string;
    name: string;
}

interface PartEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    part: Part | null;
    onSave: (updatedPart: Partial<Part>) => void;
    categories: PartCategory[];
    sites: MaintenanceSite[];
}

const PartEditModal: React.FC<PartEditModalProps> = ({ isOpen, onClose, part, onSave, categories, sites }) => {
    const [formData, setFormData] = useState<Partial<Part>>({});

    useEffect(() => {
        if (part) {
            setFormData({
                name: part.name,
                reference: part.reference,
                categoryId: part.categoryId || part.category?.id || '',
                siteId: part.siteId || part.site?.id || '',
                stockQuantity: part.stockQuantity,
                minQuantity: part.minQuantity,
                description: part.description,
                supplier: part.supplier,
            });
        } else {
            setFormData({});
        }
    }, [part, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'stockQuantity' || name === 'minQuantity' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Fermer</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                            Modifier la pièce
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <form onSubmit={handleSubmit} className="space-y-4">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        id="name"
                                                        value={formData.name || ''}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">Référence</label>
                                                    <input
                                                        type="text"
                                                        name="reference"
                                                        id="reference"
                                                        value={formData.reference || ''}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Catégorie</label>
                                                        <select
                                                            name="categoryId"
                                                            id="categoryId"
                                                            value={formData.categoryId || ''}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        >
                                                            <option value="">Sélectionner...</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="siteId" className="block text-sm font-medium text-gray-700">Site</label>
                                                        <select
                                                            name="siteId"
                                                            id="siteId"
                                                            value={formData.siteId || ''}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        >
                                                            <option value="">Sélectionner...</option>
                                                            {sites.map(s => (
                                                                <option key={s.id} value={s.id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700">Qté en stock</label>
                                                        <input
                                                            type="number"
                                                            name="stockQuantity"
                                                            id="stockQuantity"
                                                            value={formData.stockQuantity || 0}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700">Qté min.</label>
                                                        <input
                                                            type="number"
                                                            name="minQuantity"
                                                            id="minQuantity"
                                                            value={formData.minQuantity || 0}
                                                            onChange={handleChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">Fournisseur</label>
                                                    <input
                                                        type="text"
                                                        name="supplier"
                                                        id="supplier"
                                                        value={formData.supplier || ''}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                                    <textarea
                                                        name="description"
                                                        id="description"
                                                        rows={3}
                                                        value={formData.description || ''}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    />
                                                </div>
                                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                                    <button
                                                        type="submit"
                                                        className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                                        onClick={onClose}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default PartEditModal;
