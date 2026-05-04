import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { apiGetTareasPorOportunidad, TareaAPI } from '@/services/api';
import { COLORS } from '@/utils/constants';
import { Oportunidad } from '@/types';

interface TareasOportunidadModalProps {
    oportunidad: Oportunidad | null;
    visible: boolean;
    onHide: () => void;
}

export const TareasOportunidadModal: React.FC<TareasOportunidadModalProps> = ({ oportunidad, visible, onHide }) => {
    const [tareas, setTareas] = useState<TareaAPI[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && oportunidad) {
            setLoading(true);
            apiGetTareasPorOportunidad(oportunidad.id)
                .then(setTareas)
                .catch(err => {
                    console.error('Error fetching tasks for opportunity:', err);
                    setTareas([]);
                })
                .finally(() => setLoading(false));
        }
    }, [visible, oportunidad]);

    const headerElement = (
        <div className="flex align-items-center gap-3">
            <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: `${COLORS.blue}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <i className="pi pi-list" style={{ color: COLORS.blue, fontSize: '1.2rem' }} />
            </div>
            <div>
                <h3 className="m-0 text-900 font-bold text-lg">Tareas: {oportunidad?.nombre}</h3>
                <span className="text-500 text-xs font-medium">Listado de tareas asociadas</span>
            </div>
        </div>
    );

    const prioridadBodyTemplate = (tarea: TareaAPI) => {
        const color = tarea.prioridad === 'alta' ? COLORS.red : tarea.prioridad === 'media' ? COLORS.yellow : COLORS.green;
        return (
            <Tag 
                value={tarea.prioridad?.toUpperCase()} 
                style={{ backgroundColor: `${color}15`, color: color, fontSize: '0.7rem' }} 
            />
        );
    };

    const estadoBodyTemplate = (tarea: TareaAPI) => {
        return (
            <Tag 
                value={tarea.estado} 
                severity={tarea.estado === 'FINALIZADO' ? 'success' : tarea.estado === 'PENDIENTE' ? 'warning' : 'info'}
                style={{ fontSize: '0.7rem' }}
            />
        );
    };

    const fechaBodyTemplate = (tarea: TareaAPI) => {
        return <span style={{ fontSize: '0.85rem', color: COLORS.gray600 }}>{tarea.fecha}</span>;
    };

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerElement}
            style={{ width: '700px' }}
            breakpoints={{ '960px': '75vw', '641px': '100%' }}
            modal
            className="p-fluid"
        >
            <DataTable 
                value={tareas} 
                loading={loading} 
                emptyMessage="No se encontraron tareas para esta oportunidad"
                className="datatable-premium mt-3"
                size="small"
            >
                <Column field="titulo" header="TÍTULO" style={{ fontWeight: 600 }} />
                <Column field="fecha" header="FECHA" body={fechaBodyTemplate} />
                <Column field="prioridad" header="PRIORIDAD" body={prioridadBodyTemplate} />
                <Column field="estado" header="ESTADO" body={estadoBodyTemplate} />
            </DataTable>
        </Dialog>
    );
};
