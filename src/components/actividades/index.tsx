import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import {
    PageHeader,
    CustomBadge,
    EmptyState
} from '@/components/ui';
import { ACTIVIDADES } from '@/data/sampleData';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// ACTIVIDADES PAGE
// ═══════════════════════════════════════════════════════════
export const ActividadesPage: React.FC = () => {
    const [view, setView] = useState<'Día' | 'Semana' | 'Mes'>('Mes');
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    // Calendar data
    const calendarRows = [
        [26, 27, 28, 29, 30, 31, 1],
        [2, 3, 4, 5, 6, 7, 8],
        [9, 10, 11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20, 21, 22],
        [23, 24, 25, 26, 27, 28, 1],
    ];

    return (
        <div>
            <PageHeader title="Actividades" subtitle="Calendario de actividades planificadas">
                <Button label="Nueva Actividad" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
            </PageHeader>

            <Card className="shadow-1">
                <div className="flex justify-content-between align-items-center mb-4">
                    <div className="flex align-items-center gap-2">
                        <Button icon="pi pi-chevron-left" text className="p-button-sm" />
                        <Button label="Hoy" outlined className="p-button-sm" />
                        <Button icon="pi pi-chevron-right" text className="p-button-sm" />
                        <span className="ml-3 text-xl font-bold text-900">Febrero 2026</span>
                    </div>
                    <div className="flex gap-1">
                        {(['Día', 'Semana', 'Mes'] as const).map(v => (
                            <Button
                                key={v}
                                label={v}
                                className="p-button-sm"
                                outlined={view !== v}
                                onClick={() => setView(v)}
                                style={view === v ? { backgroundColor: COLORS.gray800, borderColor: COLORS.gray800 } : {}}
                            />
                        ))}
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid mb-4" style={{ borderBottom: `1px solid ${COLORS.gray200}` }}>
                    {days.map(d => (
                        <div key={d} className="col text-center py-2 font-semibold text-500 text-sm" style={{ borderBottom: `1px solid ${COLORS.gray200}` }}>
                            {d}
                        </div>
                    ))}
                </div>

                {calendarRows.map((row, ri) => (
                    <div key={ri} className="grid" style={{ minHeight: '80px', borderBottom: `1px solid ${COLORS.gray100}` }}>
                        {row.map((day, di) => {
                            const isCurrentMonth = (ri === 0 && day > 20) || (ri === 4 && day === 1) ? false : true;
                            const isToday = day === 2 && ri === 1;
                            return (
                                <div
                                    key={di}
                                    className="col p-2"
                                    style={{
                                        backgroundColor: isToday ? COLORS.redLight : 'transparent',
                                        borderRight: di < 6 ? `1px solid ${COLORS.gray100}` : 'none'
                                    }}
                                >
                                    <span
                                        className={`text-sm ${isCurrentMonth ? 'text-900' : 'text-300'}`}
                                        style={{
                                            fontWeight: isToday ? 700 : 400,
                                            color: isToday ? COLORS.red : undefined
                                        }}
                                    >
                                        {day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}

                <div className="mt-4 pt-3 border-top-1" style={{ borderColor: COLORS.gray200 }}>
                    <div className="font-semibold text-900 mb-2">Lunes 2 De Febrero</div>
                    <EmptyState message="Sin actividades programadas para este día" icon="pi-calendar" />
                </div>
            </Card>
        </div>
    );
};

export default ActividadesPage;
