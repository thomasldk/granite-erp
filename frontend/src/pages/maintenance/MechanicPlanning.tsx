import React, { useEffect, useState } from 'react';
import Timeline, { TimelineHeaders, SidebarHeader, DateHeader } from 'react-calendar-timeline';
import 'react-calendar-timeline/lib/Timeline.css';
import moment from 'moment';
import 'moment/locale/fr';

// Set moment locale to french
moment.locale('fr');

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
}

const MechanicPlanning: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/repairs')
            .then(res => res.json())
            .then((data: Repair[]) => {
                // 1. Extract mechanics
                const mechanics = Array.from(new Set(data.map(r => r.mechanic).filter(Boolean))) as string[];
                const newGroups = mechanics.map((mech, index) => ({
                    id: index + 1, // Store ID
                    title: mech,
                    rightTitle: mech
                }));

                setGroups(newGroups);

                // 2. Map repairs to items (Only with mechanic)
                const newItems = data
                    .filter(r => r.mechanic)
                    .map((r) => {
                        // Find group id
                        const group = newGroups.find(g => g.title === (r.mechanic || 'Non assigné'));
                        if (!group) return null;

                        // Determine start and end
                        // Start: Detection Date or Created At
                        const start = r.detectionDate ? moment(r.detectionDate) : moment(r.createdAt);
                        // End: Due Date (end of day) or Start + 2 hours default
                        let end = r.dueDate ? moment(r.dueDate).endOf('day') : start.clone().add(4, 'hours');

                        if (end.isBefore(start)) end = start.clone().add(1, 'hour');

                        // Color based on priority or status
                        let color = '#2196f3'; // blue default
                        if (r.priority === 'Urgent') color = '#f44336'; // red
                        if (r.priority === 'High') color = '#ff9800'; // orange
                        if (r.status === 'Completed') color = '#4caf50'; // green

                        return {
                            id: r.id,
                            group: group.id,
                            title: r.title || 'Réparation',
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

    if (loading) return <div className="p-6">Chargement du planning...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Planning par Mécanicien</h1>
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
                    sidebarWidth={200}
                >
                    <TimelineHeaders className="bg-gray-100 text-gray-700">
                        <SidebarHeader>
                            {({ getRootProps }) => {
                                // Extract style to avoid type error if strict
                                const { style, ...rest } = getRootProps();
                                return (
                                    <div {...rest} style={style} className="sidebar-header flex items-center justify-center font-semibold border-r border-gray-300">
                                        Mécanicien
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
                <span className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span> Normale</span>
                <span className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span> Terminé</span>
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

export default MechanicPlanning;
