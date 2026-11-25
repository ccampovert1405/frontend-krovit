import React, { useState, useMemo, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { PageHeader, IconBox, Avatar } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { useNotification } from '@/context/NotificationContext';
import { apiGetSemaforo, SemaforoAPI, apiGetUsersByRole, UsuarioAPI, apiReasignarOportunidad } from '@/services/api';
import { formatUserDisplayName } from '@/utils/formatters';

export const JefeComercialDashboard: React.FC = () => {
    const { showSuccess, showError } = useNotification();
    const [data, setData] = useState<SemaforoAPI[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Agentes reales para reasignar
    const [agentes, setAgentes] = useState<UsuarioAPI[]>([]);
    
    // Estados de Filtro
    const [globalFilter, setGlobalFilter] = useState('');
    const [hideDiscarded, setHideDiscarded] = useState<boolean>(true);
    
    // Reasignación
    const [reassignDialog, setReassignDialog] = useState(false);
    const [selectedRow, setSelectedRow] = useState<SemaforoAPI | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [savingReassign, setSavingReassign] = useState(false);

    // Cargar datos al montar
    const loadData = async () => {
        setLoading(true);
        try {
            const result = await apiGetSemaforo();
            setData(result);
        } catch (err) {
            showError('Error al cargar el dashboard de semáforos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Cargar agentes disponibles
        apiGetUsersByRole('Agente Comercial')
            .then(setAgentes)
            .catch(err => console.error('Error al cargar agentes', err));
    }, []);

    // Filtrado de datos localmente tras obtenerlos de la API
    const filteredData = useMemo(() => {
        return data.filter(op => {
            // Ocultar descartados (estados del CRM para descarte)
            if (hideDiscarded && op.estadoOportunidad === 'DESCARTADO') {
                return false;
            }

            const search = globalFilter.toLowerCase();
            if (!search) return true;
            
            return (
                (op.prospecto || '').toLowerCase().includes(search) ||
                (op.agente || '').toLowerCase().includes(search) ||
                (op.estadoOportunidad || '').toLowerCase().includes(search)
            );
        });
    }, [data, globalFilter, hideDiscarded]);

    // Manejadores Reasignación
    const handleOpenReassign = (row: SemaforoAPI) => {
        setSelectedRow(row);
        
        // Tratar de encontrar el ID del agente actual si coincide por nombre (opcional)
        const curr = agentes.find(a => formatUserDisplayName(a.nombres, a.apellidos) === row.agente);
        setSelectedAgentId(curr?.userID || null);
        
        setReassignDialog(true);
    };

    const handleConfirmReassign = async () => {
        if (!selectedRow || !selectedAgentId) return;

        setSavingReassign(true);
        try {
            await apiReasignarOportunidad(selectedRow.oportunidadId, selectedAgentId);
            
            showSuccess('La oportunidad ha sido reasignada exitosamente.', 'Asignación Actualizada');
            setReassignDialog(false);
            setSelectedRow(null);
            // Recargar datos para refrescar vista
            loadData();
        } catch (err) {
            showError('No se pudo reasignar la oportunidad.');
            console.error(err);
        } finally {
            setSavingReassign(false);
        }
    };

    // Templates de Tabla
    const clienteBody = (row: SemaforoAPI) => (
        <div className="flex flex-column">
            <span style={{ fontWeight: 700, color: COLORS.gray800 }}>{row.prospecto}</span>
            <span style={{ fontSize: '0.75rem', color: COLORS.gray500, textTransform: 'uppercase' }}>Estado: {row.estadoOportunidad}</span>
        </div>
    );

    const agenteBody = (row: SemaforoAPI) => (
        <div className="flex align-items-center gap-2">
            <Avatar name={row.agente || '?'} size="normal" />
            <span style={{ fontWeight: 600, color: COLORS.gray700, fontSize: '0.85rem' }}>{row.agente || 'Sin Asignar'}</span>
        </div>
    );

    const semaforoBody = (row: SemaforoAPI) => {
        const color = row.semaforo === 'VERDE' ? '#22C55E' : '#EF4444';
        const label = row.semaforo === 'VERDE' ? 'Al día' : 'Sin Gestión > 48h';
        return (
            <Tag 
                value={label} 
                style={{ 
                    backgroundColor: `${color}15`, 
                    color: color, 
                    border: `1px solid ${color}30`,
                    borderRadius: '20px',
                    fontWeight: 700
                }} 
                icon={`pi pi-circle-fill`}
            />
        );
    };

    const seguimientoBody = (row: SemaforoAPI) => {
        const cant = row.cantidadSeguimientos;
        if (cant === 0) {
            return <span style={{ color: COLORS.gray400, fontStyle: 'italic', fontSize: '0.85rem' }}>Sin gestiones previas</span>;
        }

        return (
            <div className="flex flex-column gap-1">
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: COLORS.gray700 }}>Última Actividad</span>
                <span style={{ fontSize: '0.7rem', color: COLORS.gray500 }}>
                    Gestiones: {cant}/3 • Hace {row.horasTranscurridas} horas
                </span>
            </div>
        );
    };

    const actionBody = (row: SemaforoAPI) => (
        <Button 
            icon="pi pi-user-edit" 
            tooltip="Reasignar Asesor"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => handleOpenReassign(row)}
            disabled={row.estadoOportunidad === 'DESCARTADO'}
        />
    );

    // KPIs counts
    const totalClientes = data.length;
    const verdes = data.filter(d => d.semaforo === 'VERDE').length;
    const rojos = data.filter(d => d.semaforo === 'ROJO').length;

    return (
        <div className="p-3">
            <PageHeader 
                title="Control Comercial (Dashboard)" 
                subtitle="Supervisión en tiempo real de seguimientos y reasignación"
            />

            {/* KPIS Rápidos */}
            <div className="grid mb-4">
                <div className="col-12 md:col-4">
                    <div style={{ background: COLORS.white, padding: '20px', borderRadius: '16px', border: `1.5px solid ${COLORS.gray100}` }} className="flex align-items-center gap-3">
                        <IconBox icon="pi-users" bg={COLORS.blueLight} color={COLORS.blue} />
                        <div>
                            <div style={{ color: COLORS.gray500, fontSize: '0.8rem', fontWeight: 600 }}>TOTAL OPORTUNIDADES</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: COLORS.gray800 }}>{totalClientes}</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div style={{ background: COLORS.white, padding: '20px', borderRadius: '16px', border: `1.5px solid ${COLORS.gray100}` }} className="flex align-items-center gap-3">
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: '#DCFCE7', color: '#166534', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <i className="pi pi-check-circle" style={{ fontSize: '1.2rem' }} />
                        </div>
                        <div>
                            <div style={{ color: COLORS.gray500, fontSize: '0.8rem', fontWeight: 600 }}>AL DÍA (VERDE)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534' }}>{verdes}</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div style={{ background: COLORS.white, padding: '20px', borderRadius: '16px', border: `1.5px solid ${COLORS.gray100}` }} className="flex align-items-center gap-3">
                        <div style={{ 
                            width: '40px', height: '40px', borderRadius: '12px', 
                            background: '#FEE2E2', color: '#991B1B', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <i className="pi pi-exclamation-circle" style={{ fontSize: '1.2rem' }} />
                        </div>
                        <div>
                            <div style={{ color: COLORS.gray500, fontSize: '0.8rem', fontWeight: 600 }}>FUERA DE TIEMPO (ROJO)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991B1B' }}>{rojos}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenedor Principal Tabla */}
            <div style={{
                background: COLORS.white,
                borderRadius: '24px',
                padding: '25px',
                border: `1.5px solid ${COLORS.gray100}`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
                
                {/* Cabecera Tabla & Filtros */}
                <div className="flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: COLORS.gray800 }}>Clientes y Control de Tiempos</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: COLORS.gray500 }}>Visualiza el cumplimiento de gestiones por cada asesor</p>
                    </div>

                    <div className="flex align-items-center gap-4 flex-wrap">
                        {/* Checkbox de filtro descartados */}
                        <div className="flex align-items-center gap-2" style={{
                            background: COLORS.gray50,
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: `1px solid ${COLORS.gray200}`
                        }}>
                            <TriStateCheckbox 
                                value={hideDiscarded} 
                                onChange={(e) => setHideDiscarded(e.value ?? false)} 
                            />
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.gray700, cursor: 'pointer' }}>
                                Ocultar clientes descartados
                            </label>
                        </div>

                        {/* Buscador */}
                        <span className="p-input-icon-left">
                            <i className="pi pi-search" style={{ color: COLORS.gray400 }} />
                            <InputText 
                                value={globalFilter} 
                                onChange={(e) => setGlobalFilter(e.target.value)} 
                                placeholder="Buscar prospecto o asesor..."
                                style={{ 
                                    borderRadius: '10px', 
                                    border: `1px solid ${COLORS.gray200}`,
                                    padding: '10px 12px 10px 35px',
                                    width: '250px'
                                }}
                            />
                        </span>

                        <Button icon="pi pi-refresh" rounded text outlined onClick={loadData} tooltip="Refrescar" disabled={loading} />
                    </div>
                </div>

                {/* Tabla Principal */}
                <DataTable 
                    value={filteredData} 
                    paginator 
                    rows={8} 
                    loading={loading}
                    className="p-datatable-sm"
                    rowHover
                    emptyMessage="No se encontraron registros"
                    style={{ borderTop: `1px solid ${COLORS.gray100}` }}
                    pt={{
                        thead: { style: { background: COLORS.gray50 } },
                        headerRow: { style: { background: 'transparent' } }
                    }}
                >
                    <Column 
                        field="prospecto" 
                        header="CLIENTE" 
                        body={clienteBody} 
                        style={{ minWidth: '200px', padding: '16px 10px' }}
                    />
                    <Column 
                        field="agente" 
                        header="ASESOR ACTUAL" 
                        body={agenteBody} 
                        style={{ minWidth: '180px' }}
                    />
                    <Column 
                        header="ESTADO SEMÁFORO" 
                        body={semaforoBody} 
                        sortable 
                        sortField="semaforo"
                        style={{ width: '200px' }}
                    />
                    <Column 
                        header="ÚLTIMO MOVIMIENTO" 
                        body={seguimientoBody} 
                        style={{ minWidth: '220px' }}
                    />
                    <Column 
                        header="ACCIONES" 
                        body={actionBody} 
                        align="center" 
                        style={{ width: '100px' }}
                    />
                </DataTable>
            </div>

            {/* Diálogo de Reasignación */}
            <Dialog 
                header={
                    <div className="flex align-items-center gap-3">
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '10px',
                            backgroundColor: COLORS.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <i className="pi pi-user-edit" style={{ color: COLORS.red, fontSize: '1.2rem' }} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Reasignar Oportunidad</div>
                            <div style={{ fontSize: '0.8rem', color: COLORS.gray500, fontWeight: 500 }}>Cambiar el responsable comercial</div>
                        </div>
                    </div>
                } 
                visible={reassignDialog} 
                onHide={() => setReassignDialog(false)}
                style={{ width: '450px', borderRadius: '16px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2 py-2">
                        <Button label="Cancelar" text onClick={() => setReassignDialog(false)} className="p-button-secondary" />
                        <Button 
                            label="Guardar Cambios" 
                            icon="pi pi-check" 
                            loading={savingReassign}
                            onClick={handleConfirmReassign}
                            className="p-button-danger"
                            style={{ borderRadius: '8px' }}
                            disabled={!selectedAgentId}
                        />
                    </div>
                }
            >
                {selectedRow && (
                    <div className="flex flex-column gap-4 pt-2">
                        <div style={{ background: COLORS.gray50, padding: '15px', borderRadius: '12px', border: `1px solid ${COLORS.gray100}` }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: COLORS.gray500 }}>OPORTUNIDAD</div>
                            <div style={{ fontWeight: 700, color: COLORS.gray800, fontSize: '1rem', marginTop: '2px' }}>
                                {selectedRow.prospecto}
                            </div>
                            <div className="flex gap-1 mt-1">
                                <Tag value={selectedRow.agente || 'Sin Agente'} severity="info" />
                            </div>
                        </div>

                        <div className="flex flex-column gap-2">
                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: COLORS.gray700 }}>Seleccionar Nuevo Asesor</label>
                            <Dropdown 
                                value={selectedAgentId}
                                onChange={(e) => setSelectedAgentId(e.value)}
                                options={agentes.map(a => ({
                                    label: formatUserDisplayName(a.nombres, a.apellidos),
                                    value: a.userID
                                }))}
                                placeholder="Buscar y seleccionar agente..."
                                filter
                                className="w-full"
                                style={{ borderRadius: '10px' }}
                            />
                            <small style={{ color: COLORS.gray500, lineHeight: '1.4' }}>
                                Al guardar, el historial y seguimiento pasarán a estar bajo la supervisión del nuevo asesor asignado.
                            </small>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};
