import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
    PageHeader,
    IconBox,
    Avatar
} from '@/components/ui';
import { NuevaTareaModal } from './NuevaTareaModal';
import { EditarTareaModal } from './EditarTareaModal';
import { COLORS, MESES_NOMBRES } from '@/utils/constants';
import { apiGetProspectos, apiGetOportunidades, apiGetUsersByRole, UsuarioAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';
import { useAuth, useTareas, useFilters } from '@/hooks';
import { notifyApiError } from '@/utils/errorHelpers';
import { formatUserDisplayName } from '@/utils/formatters';
import { Tarea } from '@/types';

// ═══════════════════════════════════════════════════════════
// TAREAS PAGE
// ═══════════════════════════════════════════════════════════

export const TareasPage: React.FC = () => {
    const { user } = useAuth();
    const { showError, showWarn } = useNotification();
    const {
        selectedMes,
        setSelectedMes,
        selectedAgente,
        setSelectedAgente,
        mesActual,
    } = useFilters();

    const [selectedPrioridad, setSelectedPrioridad] = useState<string>('Todas');

    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial';

    // ─── State ───
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [prospectos, setProspectos] = useState<any[]>([]);
    const [oportunidades, setOportunidades] = useState<any[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = useState<(string | number)[]>([]);

    // Agentes Reales
    const [agentes, setAgentes] = React.useState<UsuarioAPI[]>([]);
    useEffect(() => {
        if (isPrivileged) {
            apiGetUsersByRole('Agente Comercial')
                .then(setAgentes)
                .catch(console.error);
        }
    }, [isPrivileged]);

    const selectedAgentUser = agentes.find(a => formatUserDisplayName(a.nombres, a.apellidos) === selectedAgente);

    const { tareas, loading, addTarea, updateTarea, deleteTarea } = useTareas({
        mes: selectedMes,
        anio: '2026',
        userId: selectedAgentUser?.userID
    });


    const loadData = () => {
        const fetchId = isPrivileged ? selectedAgentUser?.userID : user?.id;
        const mesNombre = MESES_NOMBRES[selectedMes];

        Promise.all([
            apiGetProspectos({ userId: fetchId }),
            apiGetOportunidades({ mes: mesNombre, anio: '2026', userId: fetchId })
        ]).then(([prosData, oporData]) => {
            setProspectos(prosData.map((p: any) => ({ label: `${p.nombre} ${p.apellido || ''}`, value: p.id })));
            setOportunidades(oporData.map((o: any) => ({ label: o.nombre_oportunidad || 'Sin nombre', value: o.id })));
        }).catch((err) => notifyApiError(err, { showError, showWarn }, 'Error al cargar datos adicionales'));
    };

    React.useEffect(() => {
        loadData();
    }, [selectedAgentUser?.userID, selectedMes]);

    // ─── Computed Data ───
    const filteredTareas = tareas.filter(t => {
        const matchesSearch = !searchQuery ||
            t.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.contacto?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPrioridad = selectedPrioridad === 'Todas' ||
            t.prioridad?.toLowerCase() === selectedPrioridad.toLowerCase();

        return matchesSearch && matchesPrioridad;
    });

    // Mapeo dinámico de colores por prioridad para bordes y badges
    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'alta': return COLORS.red;
            case 'media': return COLORS.yellow;
            case 'baja': return COLORS.green;
            default: return COLORS.gray400;
        }
    };

    const getPriorityBg = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'alta': return `${COLORS.red}15`;
            case 'media': return `${COLORS.yellow}15`;
            case 'baja': return `${COLORS.green}15`;
            default: return `${COLORS.gray400}15`;
        }
    };

    // ─── DataTable Templates ───
    const priorityTemplate = (rowData: any) => {
        const priority = rowData.prioridad || 'Baja';
        return (
            <span
                className="px-2 py-1 border-round-3xl text-xs font-semibold"
                style={{
                    backgroundColor: getPriorityBg(priority),
                    color: getPriorityColor(priority)
                }}
            >
                {priority.toLowerCase()}
            </span>
        );
    };

    const statusTemplate = (rowData: any) => {
        const estado = rowData.estado || 'PENDIENTE';
        const color = estado === 'FINALIZADO' ? COLORS.green : 
                      estado === 'EN SEGUIMIENTO' ? COLORS.blue : 
                      COLORS.yellow;
        const bgColor = `${color}15`;

        return (
            <span
                className="px-2 py-1 border-round-3xl text-xs font-semibold"
                style={{ backgroundColor: bgColor, color: color }}
            >
                {estado.replace('_', ' ')}
            </span>
        );
    };

    const actionsTemplate = (rowData: any) => {
        return (
            <div className="flex gap-2 justify-content-end">
                <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-sm"
                    tooltip="Editar"
                    onClick={() => {
                        setEditingTask(rowData);
                        setEditModalVisible(true);
                    }}
                />
                <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    tooltip="Eliminar"
                    onClick={() => deleteTarea(rowData.id)}
                />
            </div>
        );
    };

    const contactTemplate = (rowData: any) => {
        return (
            <div className="flex flex-column gap-1 py-1">
                <div style={{ fontWeight: 700, color: COLORS.gray800, fontSize: '0.92rem' }}>
                    {rowData.contacto || 'Sin contacto'}
                </div>
                <div className="text-500 text-xs overflow-hidden text-overflow-ellipsis" style={{ maxWidth: '300px', whiteSpace: 'nowrap' }}>
                    {rowData.descripcion}
                </div>
            </div>
        );
    };

    const dateTemplate = (rowData: any) => {
        return (
            <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }} className="flex align-items-center gap-2">
                <i className="pi pi-calendar" style={{ fontSize: '0.75rem', color: COLORS.gray400 }} />
                <span>{rowData.fecha}</span>
            </div>
        );
    };

    const titleTemplate = (rowData: any) => {
        return (
            <div style={{ color: COLORS.gray600, fontWeight: 600, fontSize: '0.88rem' }}>
                {rowData.titulo}
            </div>
        );
    };

    const agenteBodyTemplate = (rowData: Tarea) => {
        const agente = rowData.user_create;
        const nombreCompleto = agente ? `${agente.nombres} ${agente.apellidos}` : (rowData.agente || 'Sin asignar');
        return (
            <div className="flex align-items-center gap-2">
                <Avatar
                    name={nombreCompleto}
                    size="normal"
                    style={{ backgroundColor: COLORS.gray100, color: COLORS.gray700 }}
                />
                <span className="text-xs font-medium text-600">{nombreCompleto}</span>
            </div>
        );
    };

    return (
        <div>
            {/* ─── Header Section ─── */}
            <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <PageHeader title="Tareas" subtitle="Gestiona tus pendientes">
                    <div className="flex gap-2 align-items-center flex-wrap">
                        {/* Filtro Agente - SOLO PARA JEFE COMERCIAL Y ADMIN */}
                        {isPrivileged && (
                            <div className="flex align-items-center gap-2">
                                    <IconBox icon="pi-users" color={COLORS.red} bg={COLORS.redLight} />
                                <Dropdown
                                    value={selectedAgente}
                                    options={[
                                        { label: 'Todos los agentes', value: 'Todos' },
                                        ...agentes.map(a => {
                                            const name = formatUserDisplayName(a.nombres, a.apellidos);
                                            return { label: name, value: name };
                                        })
                                    ]}
                                    onChange={(e) => setSelectedAgente(e.value)}
                                    className="w-12rem"
                                    placeholder="Seleccionar agente"
                                />
                            </div>
                        )}

                        {/* Filtro Prioridad */}
                        <div className="flex align-items-center gap-2">
                                <IconBox icon="pi-flag" color="#F97316" bg="#FFF7ED" />
                            <Dropdown
                                value={selectedPrioridad}
                                options={[
                                    { label: 'Todas las prioridades', value: 'Todas' },
                                    { label: 'Alta', value: 'alta' },
                                    { label: 'Media', value: 'media' },
                                    { label: 'Baja', value: 'baja' },
                                ]}
                                onChange={(e) => setSelectedPrioridad(e.value)}
                                className="w-12rem"
                                placeholder="Prioridad"
                            />
                        </div>

                        {/* Filtro Mes */}
                        <div className="flex align-items-center gap-2">
                                <IconBox icon="pi-calendar" color={COLORS.blue} bg={COLORS.blueLight} />
                            <Dropdown
                                value={selectedMes}
                                options={MESES_NOMBRES.slice(0, mesActual + 1).map((mes, i) => ({
                                    label: `${mes} 2026`,
                                    value: i,
                                }))}
                                onChange={(e) => setSelectedMes(e.value)}
                                className="w-10rem"
                                placeholder="Seleccionar mes"
                            />
                        </div>
                    </div>
                </PageHeader>

                <div className="flex align-items-center gap-4">
                    <Button
                        className="btn-brand p-0 border-round-lg overflow-hidden"
                        onClick={() => setModalVisible(true)}
                    >
                        <div className="flex align-items-center gap-2 px-4 py-2">
                            <i className="pi pi-plus font-bold" style={{ fontSize: '1.2rem' }} />
                            <div className="flex flex-column text-left" style={{ lineHeight: '1.1' }}>
                                <span className="font-bold text-sm tracking-wide">Nueva Tarea</span>
                            </div>
                        </div>
                    </Button>
                </div>
            </div>

            {/* ─── KPI Cards Row ─── */}
            <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                {/* KPI: Pendientes */}
                <Card className="flex-1 shadow-1 border-round-xl" pt={{ content: { className: 'p-0' } }} style={{ minWidth: '220px' }}>
                    <div className="flex justify-content-between align-items-start mb-4">
                        <span className="text-500 font-semibold text-xs uppercase tracking-wide">PENDIENTES</span>
                        <IconBox icon="pi-clock" color={COLORS.yellow} bg={`${COLORS.yellow}15`} rounded={false} className="border-round-circle" />
                    </div>
                    <div className="text-4xl font-bold text-900">{tareas.filter(t => t.estado !== 'FINALIZADO').length}</div>
                </Card>

                {/* KPI: Completadas */}
                <Card className="flex-1 shadow-1 border-round-xl" pt={{ content: { className: 'p-0' } }} style={{ minWidth: '220px' }}>
                    <div className="flex justify-content-between align-items-start mb-4">
                        <span className="text-500 font-semibold text-xs uppercase tracking-wide">COMPLETADAS</span>
                        <IconBox icon="pi-check-square" color={COLORS.green} bg={`${COLORS.green}15`} rounded={false} className="border-round-circle" />
                    </div>
                    <div className="text-4xl font-bold text-900">{tareas.filter(t => t.estado === 'FINALIZADO').length}</div>
                </Card>

                {/* KPI: Con Recordatorio */}
                <Card className="flex-1 shadow-1 border-round-xl" pt={{ content: { className: 'p-0' } }} style={{ minWidth: '220px' }}>
                    <div className="flex justify-content-between align-items-start mb-4">
                        <span className="text-500 font-semibold text-xs uppercase tracking-wide">CON RECORDATORIO</span>
                        <IconBox icon="pi-bell" color={COLORS.blue} bg={`${COLORS.blue}15`} rounded={false} className="border-round-circle" />
                    </div>
                    <div className="text-4xl font-bold text-900">{tareas.filter(t => t.recordatorio && t.recordatorio !== 'Sin recordatorio').length}</div>
                </Card>

                {/* KPI: Total */}
                <Card className="flex-1 shadow-1 border-round-xl" pt={{ content: { className: 'p-0' } }} style={{ minWidth: '220px' }}>
                    <div className="flex justify-content-between align-items-start mb-4">
                        <span className="text-500 font-semibold text-xs uppercase tracking-wide">TOTAL</span>
                        <IconBox icon="pi-bullseye" color={COLORS.purple} bg={`${COLORS.purple}15`} rounded={false} className="border-round-circle" />
                    </div>
                    <div className="text-4xl font-bold text-900">{tareas.length}</div>
                </Card>
            </div>

            {/* ─── Premium DataTable Section ─── */}
            <div style={{
                background: COLORS.white,
                borderRadius: '24px',
                padding: '30px',
                border: `1.5px solid ${COLORS.gray100}`,
                marginBottom: '40px'
            }}>
                <div className="flex justify-content-between align-items-center mb-5">
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.black }}>Listado de Tareas</div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.85rem', marginTop: '4px' }}>Gestiona tus pendientes y compromisos comerciales</div>
                    </div>
                    <div className="flex gap-3">
                        <span className="p-input-icon-left" style={{
                            width: '320px',
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative'
                        }}>
                            <i className="pi pi-search" style={{
                                color: COLORS.gray400,
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                zIndex: 1
                            }} />
                            <input
                                type="text"
                                className="p-inputtext"
                                placeholder="Buscar por cliente o contacto..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    borderRadius: '12px',
                                    border: `1.5px solid ${COLORS.gray100}`,
                                    padding: '12px 12px 12px 40px',
                                    width: '100%',
                                    fontSize: '0.9rem'
                                }}
                            />
                        </span>
                        <Button
                            label="Nueva Tarea"
                            icon="pi pi-plus"
                            className="btn-brand"
                            onClick={() => setModalVisible(true)}
                            style={{ borderRadius: '12px', background: COLORS.red, border: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                    </div>
                </div>

                <DataTable
                    value={filteredTareas}
                    loading={loading}
                    className="datatable-premium"
                    emptyMessage="No hay tareas creadas."
                    selectionMode="multiple"
                    selection={selectedTaskIds.map(id => tareas.find(t => t.id === id)).filter(t => !!t) as any[]}
                    onSelectionChange={(e: any) => {
                        setSelectedTaskIds(e.value.map((t: any) => t.id));
                    }}
                    dataKey="id"
                    responsiveLayout="scroll"
                    rowHover
                    paginator
                    rows={10}
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                    paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column header="Agente" body={agenteBodyTemplate} style={{ minWidth: '180px' }} />
                    <Column header="Contacto y Descripción" body={contactTemplate} sortable field="contacto" style={{ minWidth: '250px' }} />
                    <Column header="Título" body={titleTemplate} sortable field="titulo" />
                    <Column header="Prioridad" body={priorityTemplate} sortable field="prioridad" />
                    <Column header="Estado" body={statusTemplate} sortable field="estado" />
                    <Column header="Fecha" body={dateTemplate} sortable field="fecha" />
                    <Column header="Acciones" body={actionsTemplate} style={{ width: '8rem' }} align="right" />
                </DataTable>
            </div>

            <NuevaTareaModal
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                prospectos={prospectos}
                oportunidades={oportunidades}
                onSave={(newTarea) => {
                    addTarea(newTarea).then(() => setModalVisible(false));
                }}
            />

            <EditarTareaModal
                visible={editModalVisible}
                onHide={() => {
                    setEditModalVisible(false);
                    setEditingTask(null);
                }}
                initialData={editingTask}
                prospectos={prospectos}
                oportunidades={oportunidades}
                onSave={(updatedTarea) => {
                    if (!editingTask?.id) return;
                    updateTarea(editingTask.id, updatedTarea).then(() => {
                        setEditModalVisible(false);
                        setEditingTask(null);
                    });
                }}
            />
        </div>
    );
};

export default TareasPage;
