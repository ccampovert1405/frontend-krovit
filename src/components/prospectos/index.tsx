import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { useProspectos, useFilters, useAuth } from '@/hooks';
import { apiGetUsersByRole, UsuarioAPI, apiExportProspectosExcel } from '@/services/api';
import { COLORS, ETAPAS_AIDA, ETAPA_COLORS, MESES_NOMBRES } from '@/utils/constants';
import { formatUserDisplayName } from '@/utils/formatters';
import { Prospecto, EtapaAIDA } from '@/types';
import { PageHeader, IconBox } from '@/components/ui';
import { NuevoProspectoModal, NuevoProspectoForm } from './NuevoProspectoModal';
import { EditarProspectoModal } from './ProspectoEditor';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';

// ═══════════════════════════════════════════════════════════
// PROSPECTOS PAGE — Reemplazo de Kanban por DataTable
// ═══════════════════════════════════════════════════════════


export const ProspectosPage: React.FC = () => {
    const { user, hasPermission } = useAuth();
    const {
        selectedMes,
        setSelectedMes,
        selectedAgente,
        setSelectedAgente,
        mesActual,
    } = useFilters();

    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial';

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

    const {
        prospectos,
        modalVisible,
        addProspecto,
        openModal,
        closeModal,
        deleteProspecto,
        updateProspecto,
        loading
    } = useProspectos({
        mes: selectedMes,
        anio: '2026',
        userId: selectedAgentUser?.userID
    });

    const [editingProspecto, setEditingProspecto] = useState<Prospecto | null>(null);
    const [selectedEtapa, setSelectedEtapa] = useState<EtapaAIDA | 'Todas'>('Todas');

    const [globalFilter, setGlobalFilter] = useState('');
    const { showSuccess, showError, showWarn } = useNotification();
    const [exportingExcel, setExportingExcel] = useState(false);

    const handleExportExcel = async () => {
        try {
            setExportingExcel(true);
            await apiExportProspectosExcel();
            showSuccess('Archivo de prospectos descargado correctamente.', 'Exportación exitosa');
        } catch (err: any) {
            notifyApiError(err, { showError, showWarn }, 'Error al exportar a Excel');
        } finally {
            setExportingExcel(false);
        }
    };

    // ─── Agrupación y Filtros (Locales) ────────────────────────────────
    const grouped = ETAPAS_AIDA.reduce((acc, etapa) => {
        // En prospectos, etapa se guarda en Mayúsculas (ATENCION, etc)
        acc[etapa] = prospectos.filter(p => (p.etapa as string).toUpperCase() === etapa);
        return acc;
    }, {} as Record<string, Prospecto[]>);

    const filteredProspectos = prospectos.filter(p => {
        const pEtapa = (p.etapa as string).toUpperCase();
        const matchesStage = selectedEtapa === 'Todas' || pEtapa === selectedEtapa;
        const search = globalFilter.toLowerCase();
        const matchesSearch = !search ||
            p.nombre.toLowerCase().includes(search) ||
            (p.apellido?.toLowerCase().includes(search)) ||
            (p.empresa?.toLowerCase().includes(search)) ||
            p.email.toLowerCase().includes(search);

        return matchesStage && matchesSearch;
    });

    // ─── Templates para DataTable ───────────────────────────
    const empresaBodyTemplate = (p: Prospecto) => (
        <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
            {p.empresa || '—'}
        </div>
    );


    const etapaBodyTemplate = (p: Prospecto) => {
        const color = (ETAPA_COLORS as Record<string, string>)[p.etapa] ?? COLORS.gray400;
        return (
            <Tag
                value={p.etapa}
                style={{
                    backgroundColor: `${color}15`,
                    color: color,
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '4px 12px'
                }}
            />
        );
    };

    const fechaCreacionBodyTemplate = (p: Prospecto) => {
        const dateStr = p.created_at;
        if (!dateStr) return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>—</div>;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return (
                <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
                    {`${day}-${month}-${year}`}
                </div>
            );
        } catch {
            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
        }
    };

    const fechaActualizacionBodyTemplate = (p: Prospecto) => {
        const dateStr = p.updated_at;
        if (!dateStr) return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>—</div>;

        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return (
                <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
                    {`${day}-${month}-${year}`}
                </div>
            );
        } catch {
            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateStr}</div>;
        }
    };

    const actionBodyTemplate = (p: Prospecto) => (
        <div className="flex align-items-center gap-2">
            <Button
                icon="pi pi-pencil"
                text
                rounded
                className="p-button-plain"
                tooltip="Editar"
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingProspecto(p);
                }}
            />
            <Button
                icon="pi pi-trash"
                text
                rounded
                className="p-button-danger"
                tooltip="Eliminar"
                onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p);
                }}
            />
        </div>
    );


    // ─── Handlers ────────────────────────────────────────────
    const handleSave = async (formData: NuevoProspectoForm) => {
        try {
            await addProspecto({
                nombre: formData.nombre,
                apellido: formData.apellido,
                empresa: formData.empresa,
                cargo: (formData as any).cargo,
                email: formData.email,
                telefono: formData.telefono,
                celular: formData.celular,
                ciudad: formData.ciudad,
                etapa: 'ATENCION',
                user_create_id: formData.user_create_id,
                fuente: 'Directo',
                mes: new Date().getMonth(),
            } as any);
            closeModal();
            showSuccess(`${formData.nombre} fue registrado correctamente.`, 'Prospecto creado');
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al crear');
        }
    };

    const handleDelete = (prospecto: Prospecto) => {
        confirmDialog({
            message: `¿Estás seguro de que deseas eliminar a ${prospecto.nombre}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteProspecto(prospecto.id);
                    showSuccess(`${prospecto.nombre} fue eliminado.`, 'Prospecto eliminado');
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    };

    const nombreBodyTemplate = (p: Prospecto) => (
        <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
            {p.nombre + ' ' + p.apellido}
        </div>
    );

    const userBodyTemplate = (p: Prospecto) => {
        const name = p.user_create
            ? `${p.user_create.nombres} ${p.user_create.apellidos}`.trim()
            : (p.agente || '—');

        return (
            <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>
                {name}
            </div>
        );
    };

    return (
        <div style={{ padding: '0 10px' }}>
            <ConfirmDialog />

            <PageHeader title="Prospectos" subtitle="Gestión de leads y prospección comercial">
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
                {/* Botón Exportar Excel */}
            {(user?.rol === 'Admin' || user?.rol === 'Administrador' || hasPermission('prospect.export')) && (
                <Button
                    label="Exportar Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success p-button-outlined ml-2"
                    onClick={handleExportExcel}
                    loading={exportingExcel}
                />
            )}
            </PageHeader>

            <div className="flex flex-wrap gap-4 mb-5">
                {ETAPAS_AIDA.map(etapa => {
                    const count = grouped[etapa]?.length || 0;
                    const isSelected = selectedEtapa === etapa;
                    const color = (ETAPA_COLORS as any)[etapa];
                    return (
                        <div
                            key={etapa}
                            onClick={() => setSelectedEtapa(isSelected ? 'Todas' : etapa)}
                            style={{
                                cursor: 'pointer',
                                flex: 1,
                                minWidth: '200px',
                                background: COLORS.white,
                                border: `1.5px solid ${isSelected ? color : COLORS.gray100}`,
                                borderRadius: '24px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                transition: 'all 0.2s',
                                boxShadow: isSelected ? `0 8px 24px ${color}20` : 'none'
                            }}
                        >
                            <div className="flex align-items-center justify-content-between">
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }} />
                                <span style={{
                                    background: `${color}15`,
                                    borderRadius: '999px',
                                    padding: '4px 12px',
                                    fontSize: '0.8rem',
                                    color: color,
                                    fontWeight: 700
                                }}>{count}</span>
                            </div>
                            <div>
                                <div style={{ color: COLORS.gray400, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{etapa}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.5rem', color: COLORS.black, marginTop: '4px' }}>{count}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Barra de Búsqueda y Título */}
            <div style={{
                background: COLORS.white,
                borderRadius: '24px',
                padding: '30px',
                border: `1.5px solid ${COLORS.gray100}`,
                marginBottom: '40px'
            }}>
                <div className="flex justify-content-between align-items-center mb-5">
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.black }}>Prospectos Directos</div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.85rem', marginTop: '4px' }}>Gestiona y califica tus leads potenciales</div>
                    </div>
                    <div className="flex gap-3">
                        <span className="p-input-icon-left" style={{
                            width: '280px',
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
                            <InputText
                                placeholder="Buscar prospectos..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
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
                            label="Nuevo Prospecto"
                            icon="pi pi-plus"
                            className="btn-brand"
                            onClick={openModal}
                            style={{ borderRadius: '12px', background: COLORS.red, border: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                    </div>
                </div>

                <DataTable
                    value={filteredProspectos}
                    paginator
                    rows={10}
                    loading={loading}
                    className="datatable-premium"
                    emptyMessage="No se encontraron prospectos"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                    paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                >
                    <Column field="nombre" header="NOMBRE" body={nombreBodyTemplate} alignHeader="left" align="left" />
                    <Column field="empresa" header="EMPRESA" body={empresaBodyTemplate} alignHeader="left" align="left" />
                    <Column field="user_create" header="Asignado a" body={userBodyTemplate} style={{ minWidth: '220px' }} alignHeader="left" align="left" />
                    <Column field="etapa" header="ETAPA" body={etapaBodyTemplate} alignHeader="left" align="left" />
                    <Column field="created_at" header="FECHA CREACIÓN" sortable body={fechaCreacionBodyTemplate} alignHeader="left" align="left" />
                    <Column field="updated_at" header="FECHA ACTUALIZACIÓN" sortable body={fechaActualizacionBodyTemplate} alignHeader="left" align="left" />
                    <Column header="ACCIONES" body={actionBodyTemplate} alignHeader="left" align="left" />
                </DataTable>
            </div>

            <NuevoProspectoModal visible={modalVisible} onHide={closeModal} onSave={handleSave} />

            {editingProspecto && (
                <EditarProspectoModal
                    prospecto={editingProspecto}
                    visible={!!editingProspecto}
                    onHide={() => setEditingProspecto(null)}
                    onSave={async (id, changes) => {
                        try {
                            await updateProspecto(id, changes);
                            setEditingProspecto(null);
                            showSuccess('Los datos del prospecto fueron actualizados.', 'Prospecto actualizado');
                        } catch (err) {
                            notifyApiError(err, { showError, showWarn }, 'Error al actualizar');
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ProspectosPage;

