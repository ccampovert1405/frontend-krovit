import React, { useState, useCallback, useEffect } from 'react';
import { Button } from 'primereact/button';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { KPICard, PageHeader, IconBox, Avatar } from '@/components/ui';
import { useOportunidades, useFilters, useAuth } from '@/hooks';
import {
    COLORS,
    ETAPA_OPORTUNIDAD_COLORS,
    MESES_NOMBRES,
} from '@/utils/constants';
import { apiGetUsersByRole, UsuarioAPI } from '@/services/api';
import { formatUserDisplayName } from '@/utils/formatters';
import { Oportunidad, EtapaOportunidad, PlanFinancieroData } from '@/types';
import { NuevaOportunidadModal, NuevaOportunidadForm } from './NuevaOportunidadModal';
import { EditarOportunidadModal } from './EditarOportunidadModal';
import { PlanFinanciero } from './PlanFinanciero';
import { apiGetPlanFinanciero } from '@/services/api';
import { TareasOportunidadModal } from './TareasOportunidadModal';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';

// ════════════════════════════════════════════════════════════
// TIPOS DE PRODUCTO — Emojis y Colores
// ════════════════════════════════════════════════════════════
type EtapaKanban = 'Calificación' | 'Propuesta' | 'Negociación' | 'Cierre' | 'Ganada' | 'Perdida';
const ETAPAS_KANBAN: EtapaKanban[] = ['Calificación', 'Propuesta', 'Negociación', 'Cierre', 'Ganada', 'Perdida'];

const ETAPA_DOT: Record<EtapaKanban, string> = {
    'Calificación': COLORS.gray500,
    'Propuesta': COLORS.blue,
    'Negociación': COLORS.yellow,
    'Cierre': COLORS.purple,
    'Ganada': COLORS.green,
    'Perdida': COLORS.red,
};


// ════════════════════════════════════════════════════════════



// ════════════════════════════════════════════════════════════
// OPORTUNIDADES PAGE
// ════════════════════════════════════════════════════════════
export const OportunidadesPage: React.FC = () => {
    const { user } = useAuth();
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
        oportunidades,
        modalVisible,
        openModal,
        closeModal,
        addOportunidad,
        updateOportunidad,
        deleteOportunidad,
        loading,
        error,
    } = useOportunidades({
        mes: selectedMes,
        anio: '2026',
        userId: selectedAgentUser?.userID
    });

    const [editingOp, setEditingOp] = useState<Oportunidad | null>(null);
    const [saving, setSaving] = useState(false);
    const { showSuccess, showError, showWarn } = useNotification();

    // ─── Filtros y Búsqueda ─────────────────────────────────
    const [selectedEtapa, setSelectedEtapa] = useState<EtapaOportunidad | 'Todas'>('Todas');
    const [selectedProducto, setSelectedProducto] = useState<string | 'Todos'>('Todos');
    const [globalFilter, setGlobalFilter] = useState('');

    // ─── Detalle + Plan Financiero ─────────────────────────
    const [detailOp, setDetailOp] = useState<Oportunidad | null>(null);
    const [planData, setPlanData] = useState<PlanFinancieroData | null>(null);
    const [planLoading, setPlanLoading] = useState(false);
    const [selectedOpForTasks, setSelectedOpForTasks] = useState<Oportunidad | null>(null);
    const [showTareasModal, setShowTareasModal] = useState(false);

    useEffect(() => {
        if (!detailOp) { setPlanData(null); return; }

        // Si ya viene el planData mapeado (del listado), lo usamos directo
        if (detailOp.planData) {
            setPlanData(detailOp.planData);
            return;
        }

        setPlanLoading(true);
        apiGetPlanFinanciero(detailOp.id)
            .then((raw: any) => {
                // Mapear los datos que vienen en snake_case
                const mapped: PlanFinancieroData = {
                    producto: detailOp.producto || '',
                    subProducto: raw.subProducto || raw.detalle || detailOp.subProducto || '',
                    montoBase: Number(raw.monto || raw.monto_base || 0),
                    montoFinal: Number(raw.monto_final || raw.monto || 0),
                    inscripcion: Number(raw.valor_inscripcion || raw.inscripcion || 0),
                    cuotaMensual: Number(raw.valor_cuota || raw.cuota_mensual || 0),
                    compromiso: raw.financiamiento ? {
                        tipo: String(raw.financiamiento.tipo || '0'),
                        cuotas: Number(raw.financiamiento.cuotas || 0),
                        valor_financiamiento: Number(raw.valor_financiamiento || 0)
                    } : undefined
                };
                setPlanData(mapped);
            })
            .catch(() => setPlanData(null))
            .finally(() => setPlanLoading(false));
    }, [detailOp]);

    // ─── KPIs ────────────────────────────────────────────────
    const pipeline = oportunidades.filter((o: Oportunidad) => !['Ganada', 'Perdida'].includes(o.etapa));
    const totalForecast = pipeline.reduce((s: number, o: Oportunidad) => s + o.valor, 0);

    const ganadas = oportunidades.filter((o: Oportunidad) => o.etapa === 'Ganada');
    const valorGanado = ganadas.reduce((s: number, o: Oportunidad) => s + o.valor, 0);
    const inscripcionesGanadas = ganadas.reduce((s: number, o: Oportunidad) => s + (o.planData?.inscripcion ?? 0), 0);

    const perdidas = oportunidades.filter((o: Oportunidad) => ['Perdida', 'Caída'].includes(o.etapa));

    // ─── Agrupación por etapa ─────────────────────────────────
    const grouped = ETAPAS_KANBAN.reduce((acc: Record<EtapaKanban, Oportunidad[]>, etapa: EtapaKanban) => {
        acc[etapa] = oportunidades.filter((o: Oportunidad) => {
            if (etapa === 'Perdida') return ['Perdida', 'Caída'].includes(o.etapa);
            return o.etapa === (etapa as EtapaOportunidad);
        });
        return acc;
    }, {} as Record<EtapaKanban, Oportunidad[]>);

    const filteredOportunidades = oportunidades.filter(op => {
        const matchesStage = selectedEtapa === 'Todas' ||
            (selectedEtapa === 'Caída' ? ['Perdida', 'Caída'].includes(op.etapa) : op.etapa === selectedEtapa);

        const matchesProduct = selectedProducto === 'Todos' || op.producto === selectedProducto;

        const search = globalFilter.toLowerCase();
        const matchesSearch = !search ||
            op.nombre.toLowerCase().includes(search) ||
            op.cliente.toLowerCase().includes(search);

        return matchesStage && matchesProduct && matchesSearch;
    });

    // ─── Templates para DataTable ───────────────────────────
    const nombreBodyTemplate = (op: Oportunidad) => (
        <div className="flex flex-column gap-2 py-1">
            <div style={{ fontWeight: 700, color: COLORS.gray800, fontSize: '0.92rem' }}>{op.nombre}</div>
            <div className="flex align-items-center gap-2 flex-wrap">
                {/* Fuente Chip */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: COLORS.gray50, color: COLORS.gray600,
                    padding: '2px 8px', borderRadius: '6px',
                    fontSize: '0.68rem', fontWeight: 600,
                    border: `1px solid ${COLORS.gray200}`
                }}>
                    <i className="pi pi-at mr-1" style={{ fontSize: '0.6rem' }} />
                    {op.fuente}
                </div>

                {/* Categoría Chip */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: op.producto === 'Vehículo' ? '#F0F7FF' : '#F0FDF4',
                    color: op.producto === 'Vehículo' ? '#3B82F6' : '#22C55E',
                    padding: '2px 10px', borderRadius: '6px',
                    fontSize: '0.68rem', fontWeight: 700,
                    border: `1px solid ${op.producto === 'Vehículo' ? '#DBEAFE' : '#DCFCE7'}`
                }}>
                    {op.producto === 'Vehículo' ? <i className="pi pi-car mr-1" style={{ fontSize: '0.65rem' }} /> : <i className="pi pi-home mr-1" style={{ fontSize: '0.65rem' }} />}
                    <span style={{ textTransform: 'uppercase' }}>{op.producto}</span>
                </div>
            </div>
        </div>
    );

    const clienteBodyTemplate = (op: Oportunidad) => (
        <div style={{ color: COLORS.gray500, fontWeight: 500, fontSize: '0.85rem' }}>{op.cliente}</div>
    );

    const etapaBodyTemplate = (op: Oportunidad) => {
        const color = (ETAPA_OPORTUNIDAD_COLORS as Record<string, string>)[op.etapa] ?? COLORS.gray400;
        return (
            <Tag
                value={op.etapa}
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

    const montoBodyTemplate = (op: Oportunidad) => (
        <div style={{ fontWeight: 700, color: COLORS.red, fontSize: '0.95rem' }}>
            ${op.valor.toLocaleString()}
        </div>
    );

    const tiempoBodyTemplate = (op: Oportunidad) => {
        const dateToUse = op.created_at || op.fecha;
        if (!dateToUse) return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>—</div>;

        try {
            const createdDate = new Date(dateToUse);
            if (isNaN(createdDate.getTime())) {
                return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateToUse}</div>;
            }

            const now = new Date();
            const diffTime = now.getTime() - createdDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{diffDays} día{diffDays !== 1 ? 's' : ''}</div>;
        } catch {
            return <div style={{ color: COLORS.gray500, fontWeight: 500 }}>{dateToUse}</div>;
        }
    };

    const actionBodyTemplate = (op: Oportunidad) => (
        <div className="flex align-items-center gap-2">
            <Button
                icon="pi pi-eye"
                text
                rounded
                className="p-button-plain"
                tooltip="Ver Tareas"
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOpForTasks(op);
                    setShowTareasModal(true);
                }}
            />

            <Button
                icon="pi pi-pencil"
                text
                rounded
                className="p-button-plain"
                tooltip="Editar"
                onClick={(e) => {
                    e.stopPropagation();
                    setEditingOp(op);
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
                    handleDelete(op);
                }}
            />
            {['Negociación', 'Cierre'].includes(op.etapa) && (
                <Button
                    icon="pi pi-check-circle"
                    text
                    rounded
                    className="p-button-success"
                    tooltip={op.etapa === 'Cierre' ? 'Cerrar Ganada' : 'Marcar Caída'}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCerrar(op);
                    }}
                />
            )}
        </div>
    );

    const fechaCreacionBodyTemplate = (op: Oportunidad) => {
        const dateStr = op.created_at;
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

    // ─── Handlers ────────────────────────────────────────────
    const handleSave = useCallback(async (data: NuevaOportunidadForm) => {
        const today = new Date();
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        setSaving(true);
        try {
            await addOportunidad({
                nombre: data.nombre,
                cliente: data.cliente,
                clienteId: data.clienteId ?? undefined,
                producto: data.producto,
                plan: data.plan,
                fuente: data.fuente,
                notas: data.notas,
                valor: typeof data.plan === 'number' ? data.plan : 0,
                probabilidad: 20,
                etapa: data.etapa,
                fecha: `${today.getDate()} ${meses[today.getMonth()]} `,
                mes: today.getMonth(),
                agente: '',
                color: (ETAPA_OPORTUNIDAD_COLORS as Record<string, string>)[data.etapa],
                fk_plazo: data.fk_plazo,
                fk_plan: data.fk_plan,
                fk_financiamiento: data.fk_financiamiento,
            });
            closeModal();
            showSuccess(`"${data.nombre}" fue creada correctamente.`, 'Oportunidad creada');
        } catch (err) {
            notifyApiError(err, { showError, showWarn }, 'Error al crear');
        } finally {
            setSaving(false);
        }
    }, [addOportunidad, closeModal, showSuccess, showError]);

    const handleDelete = useCallback((op: Oportunidad) => {
        confirmDialog({
            message: `¿Eliminar "${op.nombre}" ? `,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Eliminar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await deleteOportunidad(op.id);
                    showSuccess(`"${op.nombre}" fue eliminada.`, 'Oportunidad eliminada');
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error al eliminar');
                }
            },
        });
    }, [deleteOportunidad, showSuccess, showError]);

    const handleCerrar = useCallback((op: Oportunidad) => {
        const isCierre = op.etapa === 'Cierre';
        confirmDialog({
            message: `¿Marcar "${op.nombre}" como ${isCierre ? 'Ganada' : 'Perdida'}?`,
            header: isCierre ? '¡Venta Concretada!' : 'Marcar como Caída',
            icon: isCierre ? 'pi pi-check-circle' : 'pi pi-times-circle',
            acceptLabel: isCierre ? '¡Sí, ganada!' : 'Confirmar caída',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    await updateOportunidad(op.id, { etapa: isCierre ? 'Ganada' : 'Perdida', probabilidad: isCierre ? 100 : 0 });
                    showSuccess(`"${op.nombre}" actualizada.`, 'Estado actualizado');
                } catch (err) {
                    notifyApiError(err, { showError, showWarn }, 'Error');
                }
            },
        });
    }, [updateOportunidad, showSuccess, showError]);

    const agenteBodyTemplate = (op: Oportunidad) => {
        const agente = op.user_create;
        const nombreCompleto = agente ? `${agente.nombres} ${agente.apellidos}` : (op.agente || 'Sin asignar');
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
        <div style={{ padding: '0 10px' }}>
            <ConfirmDialog />

            <PageHeader title="Oportunidades" subtitle="Gestión y rastreo de tu pipeline comercial">
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
            </PageHeader>

            {/* KPIs ROW */}
            <div className="flex gap-4 mb-5 overflow-x-auto pb-2">
                <KPICard icon="pi-chart-line" label="FORECAST" value={`$${totalForecast.toLocaleString()}`} color={COLORS.red} />
                <KPICard icon="pi-check-square" label="PLANES VENDIDOS" value={ganadas.length} color={COLORS.green} />
                <KPICard icon="pi-dollar" label="INSCRIPCIONES VENDIDAS" value={`$${inscripcionesGanadas.toLocaleString()}`} color={COLORS.blue} />
                <KPICard icon="pi-wallet" label="MONTOS GANADOS" value={`$${valorGanado.toLocaleString()}`} color={COLORS.purple} />
                <KPICard icon="pi-times" label="VENTAS CAÍDAS" value={perdidas.length} color={COLORS.red} />
            </div>

            {/* Filtros de Etapa Bubble */}
            <div className="flex flex-wrap gap-3 mb-5">
                {ETAPAS_KANBAN.map(etapa => {
                    const count = grouped[etapa]?.length || 0;
                    const isSelected = selectedEtapa === etapa;
                    const color = ETAPA_DOT[etapa];
                    return (
                        <div
                            key={etapa}
                            onClick={() => setSelectedEtapa(isSelected ? 'Todas' : etapa)}
                            style={{
                                cursor: 'pointer',
                                background: COLORS.white,
                                border: `1.5px solid ${isSelected ? color : COLORS.gray100}`,
                                borderRadius: '999px',
                                padding: '8px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.2s',
                                boxShadow: isSelected ? `0 4px 12px ${color}20` : 'none'
                            }}
                        >
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: COLORS.gray700 }}>{etapa}</span>
                            <span style={{
                                background: COLORS.gray50,
                                borderRadius: '999px',
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                color: COLORS.gray500,
                                fontWeight: 700
                            }}>{count}</span>
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
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.black }}>Oportunidades Comerciales</div>
                        <div style={{ color: COLORS.gray400, fontSize: '0.85rem', marginTop: '4px' }}>Gestiona y rastrea el progreso de tus ventas</div>
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
                                placeholder="Buscar por oportunidad o cliente..."
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
                        <Dropdown
                            value={selectedProducto}
                            options={[
                                { label: 'Todas las Categorías', value: 'Todos' },
                                { label: '🚗 Vehículo', value: 'Vehículo' },
                                { label: '🏠 Vivienda', value: 'Vivienda' }
                            ]}
                            onChange={(e) => setSelectedProducto(e.value)}
                            placeholder="Categoría"
                            style={{
                                borderRadius: '12px',
                                border: `1.5px solid ${COLORS.gray100}`,
                                width: '200px',
                                height: '46px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        />
                        <Button
                            label="Nueva Oportunidad"
                            icon="pi pi-plus"
                            className="btn-brand"
                            onClick={openModal}
                            style={{ borderRadius: '12px', background: COLORS.red, border: 'none', fontSize: '0.9rem', fontWeight: 600 }}
                        />
                    </div>
                </div>

                <DataTable
                    value={filteredOportunidades}
                    paginator
                    rows={10}
                    loading={loading}
                    className="datatable-premium"
                    onRowClick={(e) => setDetailOp(e.data as Oportunidad)}
                    rowClassName={() => 'cursor-pointer'}
                    emptyMessage="No se encontraron oportunidades"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
                    paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
                >
                    <Column field="user_create_id" header="AGENTE" body={agenteBodyTemplate} alignHeader="left" align="left" />
                    <Column field="nombre" header="OPORTUNIDAD" body={nombreBodyTemplate} style={{ minWidth: '280px' }} alignHeader="left" align="left" />
                    <Column field="cliente" header="CLIENTE" body={clienteBodyTemplate} alignHeader="left" align="left" />
                    <Column field="etapa" header="ETAPA" body={etapaBodyTemplate} alignHeader="left" align="left" />
                    <Column header="TIEMPO" body={tiempoBodyTemplate} alignHeader="left" align="left" />
                    <Column field="valor" header="MONTO" body={montoBodyTemplate} alignHeader="left" align="left" />
                    <Column field="created_at" header="FECHA CREACIÓN" sortable body={fechaCreacionBodyTemplate} alignHeader="left" align="left" />
                    <Column header="ACCIONES" body={actionBodyTemplate} alignHeader="left" align="left" />
                </DataTable>
            </div>

            {loading ? (
                <div className="flex justify-content-center py-5">
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: COLORS.red }} />
                </div>
            ) : (
                <>
                    {/* Banner de error */}
                    {error && (
                        <div style={{
                            background: '#FEF2F2', border: '1px solid #FECACA',
                            borderRadius: '10px', padding: '12px 16px',
                            color: COLORS.red, fontSize: '0.88rem',
                            marginBottom: '16px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <i className="pi pi-exclamation-triangle" />
                            {error}
                        </div>
                    )}

                    {/* ── Footer Sections: Vendidas & Caídas ── */}
                    <div className="grid mt-2">
                        {/* Vendidas */}
                        <div className="col-12 md:col-6">
                            <div style={{
                                background: COLORS.white,
                                border: `1px solid ${COLORS.gray100}`,
                                borderRadius: '24px',
                                padding: '30px',
                                height: '100%',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
                            }}>
                                <div className="flex align-items-center gap-2 mb-5">
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.green }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.black, letterSpacing: '-0.2px' }}>Planes Vendidos</span>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 700,
                                        color: COLORS.green, backgroundColor: `${COLORS.green}15`,
                                        borderRadius: '999px', padding: '2px 12px', marginLeft: '6px'
                                    }}>{ganadas.length}</span>
                                </div>
                                <div className="flex flex-column gap-0">
                                    {ganadas.length === 0 && <div className="text-400 text-sm py-5 text-center font-medium">No hay ventas registradas</div>}
                                    {ganadas.map((op: Oportunidad) => (
                                        <div key={op.id} className="flex justify-content-between align-items-center py-4"
                                            style={{ borderBottom: `1.5px solid ${COLORS.gray50}` }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: COLORS.black, letterSpacing: '-0.1px' }}>{op.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginTop: '4px', fontWeight: 600 }}>
                                                    {op.cliente} • {op.planData?.subProducto || 'Plan'}
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 700, color: COLORS.green, fontSize: '0.95rem' }}>
                                                ${op.valor.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Caídas */}
                        <div className="col-12 md:col-6">
                            <div style={{
                                background: COLORS.white,
                                border: `1px solid ${COLORS.gray100}`,
                                borderRadius: '24px',
                                padding: '30px',
                                height: '100%',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.01)'
                            }}>
                                <div className="flex align-items-center gap-2 mb-5">
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.red }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.black, letterSpacing: '-0.2px' }}>Ventas Caídas</span>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 700,
                                        color: COLORS.red, backgroundColor: `${COLORS.red}15`,
                                        borderRadius: '999px', padding: '2px 12px', marginLeft: '6px'
                                    }}>{perdidas.length}</span>
                                </div>
                                <div className="flex flex-column gap-0">
                                    {perdidas.length === 0 && <div className="text-400 text-sm py-5 text-center font-medium">No hay ventas caídas</div>}
                                    {perdidas.map((op: Oportunidad) => (
                                        <div key={op.id} className="flex justify-content-between align-items-center py-4"
                                            style={{ borderBottom: `1.5px solid ${COLORS.gray50}` }}
                                        >
                                            <div>
                                                <div style={{
                                                    fontWeight: 700, fontSize: '0.88rem', color: COLORS.gray600,
                                                    textDecoration: 'line-through', letterSpacing: '-0.1px'
                                                }}>{op.nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: COLORS.gray400, marginTop: '4px', fontWeight: 600 }}>
                                                    {op.cliente} • {op.fecha}
                                                </div>
                                            </div>
                                            <span style={{ fontWeight: 700, color: COLORS.red, fontSize: '0.95rem', opacity: 0.9 }}>
                                                ${op.valor.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modales */}
            <NuevaOportunidadModal
                visible={modalVisible}
                onHide={closeModal}
                onSave={handleSave}
                saving={saving}
            />

            {editingOp && (
                <EditarOportunidadModal
                    oportunidad={editingOp}
                    visible={!!editingOp}
                    onHide={() => setEditingOp(null)}
                    onSave={async (id: number | string, changes: Partial<Oportunidad>) => {
                        try {
                            await updateOportunidad(id, changes);
                            showSuccess(`"${changes.nombre || editingOp.nombre}" se actualizó correctamente.`, 'Cambios guardados');
                            setEditingOp(null);
                        } catch (err) {
                            notifyApiError(err, { showError, showWarn }, 'Error al actualizar');
                        }
                    }}
                />
            )}

            {/* ── Detalle de Oportunidad + Plan Financiero ── */}
            <Dialog
                header={
                    <div className="flex align-items-center gap-3">
                        <IconBox
                            icon="pi-eye"
                            size="48px"
                            iconSize="1.3rem"
                            color={COLORS.red}
                            bg={COLORS.redLight}
                        />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.gray800 }}>
                                {detailOp?.nombre}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                                Detalle de la oportunidad
                            </div>
                        </div>
                    </div>
                }
                visible={!!detailOp}
                onHide={() => setDetailOp(null)}
                style={{ width: '720px', borderRadius: '16px', overflow: 'hidden' }}
                breakpoints={{ '960px': '90vw', '641px': '100%' }}
                modal
                headerStyle={{ borderBottom: 'none' }}
                contentStyle={{ borderTop: 'none' }}
            >
                {detailOp && (
                    <div className="flex flex-column gap-4">
                        {/* Info de la oportunidad */}
                        <div style={{
                            background: COLORS.gray50,
                            borderRadius: '12px',
                            padding: '16px 20px',
                        }}>
                            <div className="grid">
                                <div className="col-6">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Cliente</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{detailOp.cliente}</div>
                                </div>
                                <div className="col-6">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Producto</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{detailOp.producto || '—'}</div>
                                </div>
                                <div className="col-6 mt-2">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Etapa</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: (ETAPA_OPORTUNIDAD_COLORS as Record<string, string>)[detailOp.etapa] ?? COLORS.gray800 }}>{detailOp.etapa}</div>
                                </div>
                                <div className="col-6 mt-2">
                                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Valor</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: COLORS.red }}>${detailOp.valor.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Plan Financiero */}
                        {planLoading ? (
                            <PlanFinanciero data={{} as PlanFinancieroData} loading />
                        ) : planData ? (
                            <PlanFinanciero data={planData} />
                        ) : (
                            <div style={{
                                background: COLORS.gray50,
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                            }}>
                                <i className="pi pi-info-circle" style={{ fontSize: '1.4rem', color: COLORS.gray400, marginBottom: '8px', display: 'block' }} />
                                <div style={{ fontSize: '0.88rem', color: COLORS.gray500 }}>
                                    No hay plan financiero asociado a esta oportunidad
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Dialog>

            <TareasOportunidadModal
                oportunidad={selectedOpForTasks}
                visible={showTareasModal}
                onHide={() => {
                    setShowTareasModal(false);
                    setSelectedOpForTasks(null);
                }}
            />
        </div>
    );
};

export default OportunidadesPage;
