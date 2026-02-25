import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import {
    PageHeader,
    CustomBadge,
    FilterTabs
} from '@/components/ui';
import { TAREAS } from '@/data/sampleData';
import {
    COLORS,
    PRIORIDAD_COLORS,
    TIPO_TAREA_ICONS
} from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// TAREAS PAGE
// ═══════════════════════════════════════════════════════════
export const TareasPage: React.FC = () => {
    const [filter, setFilter] = useState('Todas');
    const pendientes = TAREAS.filter(t => !t.completada);
    const completadas = TAREAS.filter(t => t.completada);
    const vencidas = pendientes.filter(() => true); // Simular todas vencidas

    return (
        <div>
            <PageHeader title="Tareas" subtitle="Gestiona todas tus tareas y seguimientos">
                <Button label="Nueva Tarea" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
            </PageHeader>

            <div className="flex gap-3 mb-4 flex-wrap">
                <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
                    <div className="text-3xl font-bold" style={{ color: COLORS.red }}>{pendientes.length}</div>
                    <div className="text-sm text-500">Pendientes</div>
                </Card>
                <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
                    <div className="text-3xl font-bold" style={{ color: COLORS.green }}>{completadas.length}</div>
                    <div className="text-sm text-500">Completadas</div>
                </Card>
                <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
                    <div className="text-3xl font-bold" style={{ color: COLORS.yellow }}>{vencidas.length}</div>
                    <div className="text-sm text-500">Vencidas</div>
                </Card>
            </div>

            <Card className="mb-4 shadow-1">
                <div className="flex align-items-center gap-3 flex-wrap">
                    <span className="p-input-icon-left flex-grow-1" style={{ minWidth: '200px' }}>
                        <i className="pi pi-search" />
                        <InputText placeholder="Buscar tareas..." className="w-full" />
                    </span>
                    <FilterTabs tabs={['Todas', 'Pendientes', 'Hoy', 'Esta Semana', 'Vencidas', 'Completadas']} active={filter} setActive={setFilter} />
                </div>
            </Card>

            <Card className="shadow-1">
                {TAREAS.map(tarea => (
                    <div key={tarea.id} className="flex align-items-start gap-3 py-3 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
                        <input type="checkbox" checked={tarea.completada} readOnly className="mt-1" style={{ accentColor: COLORS.red, width: '18px', height: '18px' }} />
                        <div className="flex-1">
                            <div className="font-semibold text-900">{tarea.titulo}</div>
                            <div className="text-sm text-500 mb-2">{tarea.descripcion}</div>
                            <div className="flex gap-2 align-items-center flex-wrap">
                                <CustomBadge color={PRIORIDAD_COLORS[tarea.prioridad].color} bg={PRIORIDAD_COLORS[tarea.prioridad].bg}>
                                    {tarea.prioridad}
                                </CustomBadge>
                                <span className="text-xs text-400 flex align-items-center gap-1">
                                    <i className="pi pi-clock" style={{ fontSize: '0.7rem' }} /> {tarea.fecha}
                                </span>
                                <span className="text-xs text-400 flex align-items-center gap-1">
                                    <i className={`pi ${TIPO_TAREA_ICONS[tarea.tipo]}`} style={{ fontSize: '0.7rem' }} /> {tarea.contacto}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
};

export default TareasPage;
