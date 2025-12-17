import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface Repair {
    id: string;
    reference: string;
    title: string | null;
    description: string;
    priority: string;
    status: string;
    requester: string | null;
    mechanic: string | null;
    type: string;
    isFunctional: boolean;
    detectionDate: string;
    dueDate: string | null;
    equipmentId: string | null;
    equipment?: { id: string, name: string, internalId: string, siteId?: string } | null;
    parts?: {
        partId: string,
        quantity: number,
        action: string,
        part?: { name: string, reference: string }
    }[];
}

const RepairPrintView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [repair, setRepair] = useState<Repair | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/repairs/${id}`)
            .then(res => res.json())
            .then(data => {
                setRepair(data);
                setLoading(false);
                // Auto-print when loaded
                // setTimeout(() => window.print(), 500); 
            })
            .catch(err => {
                console.error('Error fetching repair:', err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div>Chargement...</div>;
    if (!repair) return <div>Demande introuvable</div>;

    // Helper for formatting date
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('fr-FR');
    };

    // Placeholder for "Numéro du bon" - using ID or generating one
    const bonNumber = `BREP${repair.reference.replace('REP-', '')}`;

    return (
        <div className="bg-white min-h-screen p-8 text-black print:p-0">
            <style>
                {`
                    @media print {
                        @page { size: portrait; margin: 1cm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .no-print { display: none; }
                    }
                    .border-black { border-color: black !important; }
                    .bg-black { background-color: black !important; color: white !important; }
                `}
            </style>

            <div className="max-w-[21cm] mx-auto border-2 border-black">
                {/* Header Title */}
                <div className="text-center font-bold text-3xl py-4 border-b-2 border-black uppercase">
                    Bon d'entretien / réparation
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-[150px_1fr_200px_1fr] border-b-2 border-black">
                    {/* Row 1 */}
                    <div className="bg-black text-white font-bold p-2 flex items-center justify-center text-sm border-r border-b border-white">USINE</div>
                    <div className="p-2 border-r border-black border-b text-center italic">{/* Placeholder for Site Name if available, or static "Usine 3" style */}
                        {/* We don't have site name easily accessible on repair without deeper include, using Equipment Name/Loc as proxy or blank */}
                        Trevi
                    </div>
                    <div className="bg-black text-white font-bold p-1 text-center text-xs flex items-center justify-center border-b border-black leading-tight">
                        DATE PLANIFIÉ DE LA RÉPARATION
                    </div>
                    <div className="p-2 border-b border-black text-center italic">
                        {formatDate(repair.dueDate)}
                    </div>

                    {/* Row 2 */}
                    <div className="bg-black text-white font-bold p-2 flex items-center justify-center text-sm border-r border-b border-white">NOM DU DEMANDEUR</div>
                    <div className="p-2 border-r border-black border-b text-center italic">{repair.requester}</div>
                    <div className="bg-black text-white font-bold p-1 text-center text-xs flex items-center justify-center border-b border-black leading-tight">
                        NUMÉRO DE LA DEMANDE RÉPARATION
                    </div>
                    <div className="p-2 border-b border-black text-center italic">{repair.reference}</div>

                    {/* Row 3 */}
                    <div className="bg-black text-white font-bold p-2 flex items-center justify-center text-sm border-r border-white">ÉQUIPEMENT</div>
                    <div className="p-2 border-r border-black text-center italic">{repair.equipment?.name}</div>
                    <div className="bg-black text-white font-bold p-1 text-center text-xs flex items-center justify-center leading-tight">
                        NUMÉRO DU BON
                    </div>
                    <div className="p-2 text-center italic">{bonNumber}</div>
                </div>

                {/* Description du Problème */}
                <div className="grid grid-cols-[150px_1fr] border-b-2 border-black min-h-[150px]">
                    <div className="bg-black text-white font-bold p-4 flex items-center justify-center text-center text-sm">
                        DESCRIPTION DU PROBLÈME
                    </div>
                    <div className="p-4 italic flex flex-col items-center justify-center text-center gap-4">
                        {repair.title && <div className="font-bold uppercase">{repair.title}</div>}
                        <div>{repair.description}</div>
                    </div>
                </div>

                {/* Note de la réparation */}
                <div className="grid grid-cols-[150px_1fr] border-b-2 border-black min-h-[150px]">
                    <div className="bg-black text-white font-bold p-4 flex items-center justify-center text-center text-sm">
                        NOTE DE LA RÉPARATION
                    </div>
                    <div className="p-4">
                        {/* Blank space for mechanic notes */}
                    </div>
                </div>

                {/* Réparation Possible */}
                <div className="grid grid-cols-[1fr_100px_100px_100px_100px] border-b-2 border-black bg-black text-white font-bold">
                    <div className="p-2 flex items-center justify-end pr-4 text-sm">RÉPARATION POSSIBLE?</div>
                    <div className="bg-white text-black border-l border-r border-black flex items-center justify-center text-sm">OUI</div>
                    <div className="bg-white text-black border-r border-black"></div>
                    <div className="bg-white text-black border-r border-black flex items-center justify-center text-sm">NON</div>
                    <div className="bg-white text-black"></div>
                </div>

                {/* Pièces Headers */}
                <div className="grid grid-cols-[1fr_2fr] border-b-2 border-black bg-black text-white font-bold text-center text-sm">
                    <div className="p-2 border-r border-white">PIÈCE UTILISÉ OU À COMMANDER</div>
                    <div className="p-2">DESCRIPTION ET NUMÉRO DE PIÈCE</div>
                </div>

                {/* Pièces Grid */}
                {(() => {
                    const minRows = 6;
                    const parts = repair.parts || [];
                    const rowsToRender = Math.max(parts.length, minRows);

                    return [...Array(rowsToRender)].map((_, i) => {
                        const partItem = parts[i];
                        return (
                            <div key={i} className="grid grid-cols-[1fr_2fr] border-b-2 border-black text-sm min-h-[32px]">
                                <div className="border-r-2 border-black flex items-center justify-center p-1 font-semibold">
                                    {partItem ? (
                                        partItem.action === 'ORDER' ? 'À COMMANDER' : 'UTILISÉ'
                                    ) : ''}
                                </div>
                                <div className="flex items-center p-1 pl-2">
                                    {partItem ? (
                                        `${partItem.part?.name || 'Inconnu'} (Ref: ${partItem.part?.reference || '-'}) - Qté: ${partItem.quantity}`
                                    ) : ''}
                                </div>
                            </div>
                        );
                    });
                })()}

                {/* Mechanic Footer */}
                <div className="grid grid-cols-[2fr_1fr_1fr] border-b-2 border-black bg-black text-white font-bold text-center text-sm mt-0">
                    <div className="p-2 border-r border-white">MÉCANICIEN</div>
                    <div className="p-2 border-r border-white">HEURE DÉBUT</div>
                    <div className="p-2">HEURE FIN</div>
                </div>

                {/* Mechanic Content Row 1 */}
                <div className="grid grid-cols-[2fr_1fr_1fr] border-b-2 border-black h-10 text-sm">
                    <div className="border-r-2 border-black flex items-center justify-center italic">{repair.mechanic}</div>
                    <div className="border-r-2 border-black"></div>
                    <div></div>
                </div>
                {/* Mechanic Content Row 2 */}
                <div className="grid grid-cols-[2fr_1fr_1fr] border-b-2 border-black h-10 text-sm">
                    <div className="border-r-2 border-black"></div>
                    <div className="border-r-2 border-black"></div>
                    <div></div>
                </div>

                {/* Durée */}
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-black text-white font-bold text-sm">
                    <div className="p-2 flex items-center justify-center">DURÉE ESTIMÉE</div>
                    <div className="bg-white text-black border-l-2 border-r-2 border-black flex items-center justify-center italic">
                        {/* Placeholder for duration */}
                        24:00:00
                    </div>
                    <div className="p-2 flex items-center justify-center">DURÉE RÉELLE</div>
                    <div className="bg-white text-black border-l-2 border-black"></div>
                </div>

            </div>

            <div className="mt-8 text-center no-print">
                <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-bold">
                    IMPRIMER
                </button>
            </div>
        </div>
    );
};

export default RepairPrintView;
