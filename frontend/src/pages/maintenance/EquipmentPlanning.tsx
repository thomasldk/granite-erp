import React, { useEffect, useState } from 'react';
import Timeline, { TimelineHeaders, SidebarHeader, DateHeader } from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';
import 'moment/locale/fr';

// Set moment locale to french
moment.locale('fr');

interface Equipment {
    id: string;
    name: string;
    internalId: string;
}

interface Repair {
    id: string;
    title: string | null;
    description: string;
    mechanic: string | null;
    priority: string;
    status: string;
    detectionDate: string | null;
    dueDate: string | null;
    createdAt: string;
    equipment?: Equipment | null;
}

const EquipmentPlanning: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/repairs')
            .then(res => res.json())
            .then((data: Repair[]) => {
                // Filter only UNASSIGNED (no mechanic)
                const unassignedData = data.filter(r => !r.mechanic);

                // 1. Extract equipments from unassigned tasks
                // We should probably fetch ALL equipments? Or just those with unassigned tasks?
                // "Planning par équipement" implies seeing status of equipment. 
                // But specifically for unassigned: lets show equipments that have unassigned tasks.

                const uniqueEquipments = new Map<string, Equipment>();
                unassignedData.forEach(r => {
                    if (r.equipment) {
                        uniqueEquipments.set(r.equipment.id, r.equipment);
                    } else {
                        // Handle repairs without equipment? Maybe put in a "No Equipment" group
                    }
                });

                const equipmentList = Array.from(uniqueEquipments.values());
                const newGroups = equipmentList.map((eq) => ({
                    id: eq.id,
                    title: eq.name,
                    rightTitle: eq.internalId
                }));

                // Add "Aucun Equipement" group if needed
                if (unassignedData.some(r => !r.equipment)) {
                    newGroups.unshift({ id: 'no-eq', title: 'Aucun Équipement', rightTitle: '' });
                }

                setGroups(newGroups);

                // 2. Map repairs to items
                const newItems = unassignedData.map((r) => {
                    // Find group id
                    const groupId = r.equipment ? r.equipment.id : 'no-eq';
                    const group = newGroups.find(g => g.id === groupId);
                    if (!group) return null;

                    // Determine start and end
                    const start = r.detectionDate ? moment(r.detectionDate) : moment(r.createdAt);
                    let end = r.dueDate ? moment(r.dueDate).endOf('day') : start.clone().add(4, 'hours');
                    if (end.isBefore(start)) end = start.clone().add(1, 'hour');

                    let color = '#9c27b0'; // purple for unassigned maintenance
                    if (r.priority === 'Urgent') color = '#f44336';
                    if (r.priority === 'High') color = '#ff9800';

                    return {
                        id: r.id,
                        group: groupId,
                        title: r.title || 'Non assigné',
                        start_time: start,
                        end_time: end,
                        itemProps: {
                            style: {
                                background: color,
                                borderRadius: '4px',
                                border: 'none'
                            }
                        }
                    };
                }).filter(Boolean);

                setItems(newItems);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-6">Chargement du planning équipement...</div>;

    if (groups.length === 0) {
        return <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Planning par Équipement (Non assigné)</h1>
            <div className="bg-white p-6 rounded shadow text-gray-500">
                Aucune tâche non assignée.
            </div>
        </div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Planning par Équipement (Non assigné)</h1>
            <div className="bg-white p-4 rounded shadow">
                <Timeline
                    groups={groups}
                    items={items}
                    defaultTimeStart={moment().add(-12, 'hour')}
                    defaultTimeEnd={moment().add(12, 'hour')}
                    canMove={false}
                    canResize={false}
                    lineHeight={50}
                    itemHeightRatio={0.75}
                    sidebarWidth={250}
                >
                    <TimelineHeaders className="bg-gray-100 text-gray-700">
                        <SidebarHeader>
                            {({ getRootProps }) => {
                                const { style, ...rest } = getRootProps();
                                return (
                                    <div {...rest} style={style} className="sidebar-header flex items-center justify-center font-semibold border-r border-gray-300">
                                        Équipement
                                    </div>
                                );
                            }}
                        </SidebarHeader>
                        <DateHeader unit="primaryHeader" className="bg-gray-800 text-white" />
                        <DateHeader />
                    </TimelineHeaders>
                </Timeline>
            </div>
            <div className="mt-4 flex space-x-4 text-sm text-gray-600">
                <span className="flex items-center"><span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span> Urgent</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-orange-500 rounded-full mr-1"></span> Haute</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-purple-500 rounded-full mr-1"></span> En attente d'assignation</span>
            </div>
            <style>{`
                .react-calendar-timeline .rct-header-root {
                    background: #f3f4f6;
                    border-bottom: 1px solid #e5e7eb;
                }
                .react-calendar-timeline .rct-calendar-header {
                    border: none;
                }
            `}</style>
        </div>
    );
};

export default EquipmentPlanning;
