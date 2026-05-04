import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { Messages } from 'primereact/messages';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import {
    PageHeader,
    KPICard,
    SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/hooks';
import { COLORS, MESES_NOMBRES } from '@/utils/constants';
import { useNotification } from '@/context/NotificationContext';
import { MetaModal } from './MetaModal';
import { saveMeta, getMetasByUser } from './services';
import { Meta } from '@/types';
import { apiGetUsersByRole, UsuarioAPI } from '@/services/api';

// ═══════════════════════════════════════════════════════════
// FORECAST PAGE
// ═══════════════════════════════════════════════════════════
export const ForecastPage: React.FC = () => {
    const { user } = useAuth();
    const { showSuccess, showError } = useNotification();
    const msgs = useRef<Messages>(null);
    const isAdminOrJefe = user?.rol === 'Admin' || user?.rol === 'Jefe Comercial' || user?.rol === 'Administrador';

    const [metas, setMetas] = useState<Meta[]>([]);
    const [totals, setTotals] = useState<Meta | null>(null);
    const [agentes, setAgentes] = useState<UsuarioAPI[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(false);

    // Filters state
    const [selectedMes, setSelectedMes] = useState<typeof MESES_NOMBRES[number]>(MESES_NOMBRES[new Date().getMonth()]);
    const [selectedAnio, setSelectedAnio] = useState<string>(new Date().getFullYear().toString());
    const [selectedAgente, setSelectedAgente] = useState<string | null>(null);

    const fetchMetas = async () => {
        setLoading(true);
        try {
            let data: Meta[] = [];
            const params = { mes: selectedMes, anio: selectedAnio };



            if (user?.id) {
                const response = await getMetasByUser(user.id, params);
                
                if (response && !Array.isArray(response) && 'total' in response) {
                    setTotals(response.total);
                    data = response.detalle || [];
                } else {
                    data = (response as Meta[]) || [];
                    // Default behavior: find the one for the current month/year to set totals
                    const current = data.find(m => m.mes === selectedMes && m.anio === parseInt(selectedAnio));
                    setTotals(current || null);
                }
            }

            setMetas(data.sort((a, b) => {
                if (a.anio !== b.anio) return (b.anio || 0) - (a.anio || 0);
                const mesA = MESES_NOMBRES.indexOf(a.mes as any);
                const mesB = MESES_NOMBRES.indexOf(b.mes as any);
                return mesB - mesA;
            }));
        } catch (err: any) {
            console.error("Error fetching metas", err);
            // Manejo específico del error 400: El usuario no tiene un grupo asignado
            const errorMsg = err.response?.data?.message || err.message;
            if (err.response?.status === 400 && errorMsg === "El usuario no tiene un grupo asignado") {
                msgs.current?.clear();
                setTimeout(() => {
                    msgs.current?.show({
                        severity: 'warn',
                        closable: false,
                        summary: 'Advertencia',
                        detail: 'No tienes un grupo de ventas asignado. Contacta a un administrador para que te asigne a un grupo y poder ver tus proyecciones.',
                        sticky: true,
                        pt: {
                            wrapper: {
                                style: {
                                    background: '#FFF7ED',
                                    borderLeft: '6px solid #D97706',
                                    borderRadius: '8px',
                                    boxShadow: 'none',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }
                            },
                            icon: {
                                style: {
                                    color: '#D97706',
                                    fontSize: '1.25rem',
                                    marginRight: '0.75rem'
                                }
                            },
                            summary: { style: { color: '#9A3412', fontWeight: 700, fontSize: '0.95rem', marginRight: '0.5rem' } },
                            detail: { style: { color: '#9A3412', fontWeight: 500, fontSize: '0.95rem' } },
                            button: { style: { display: 'none' } }
                        }
                    });
                }, 0);
                setMetas([]); // Valores en 0
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAgentes = async () => {
        try {
            const agents = await apiGetUsersByRole('Agente Comercial');
            setAgentes(agents);
        } catch (err) {
            console.error("Error fetching agents", err);
        }
    };

    useEffect(() => {
        fetchMetas();
    }, [selectedMes, selectedAnio, selectedAgente, isAdminOrJefe, user?.id]);

    useEffect(() => {
        if (isAdminOrJefe) {
            fetchAgentes();
        }
    }, [isAdminOrJefe]);

    const handleSaveMeta = async (formData: Partial<Meta>) => {
        setLoading(true);
        try {
            // Ensure user_id is present if creating new
            const payload = { ...formData };
            if (!payload.id && !payload.user_id) {
                // Default to selected agent if admin, or current user
                payload.user_id = selectedAgente || user?.id;
            }
            await saveMeta(payload);
            showSuccess(payload.id ? 'Meta actualizada correctamente' : 'Meta guardada correctamente');
            await fetchMetas();
            setModalVisible(false);
        } catch (err) {
            console.error("Error saving meta", err);
            showError('Error al guardar la meta');
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (meta: Meta) => {
        setEditingMeta(meta);
        setModalVisible(true);
    };

    const openCreate = () => {
        setEditingMeta(null);
        setModalVisible(true);
    };

    // Current month data (prefer aggregate totals from API if available)
    const activeMonthName = selectedMes;
    const activeYear = parseInt(selectedAnio);
    
    // metaActualData might be used for history/list, but totals is for the KPI cards
    const metaActualData = totals || metas.find(m => m.mes === activeMonthName && m.anio === activeYear);

    const pipelinePonderado = 0;
    const esperado = 0;
    const cerrado = 0;

    // Using Meta data from service OR defaults to 0 as requested
    const metaCierres = metaActualData?.metaCierres || 0;
    const metaIngresos = metaActualData?.metaIngresos || 0;

    return (
        <div>
            <PageHeader title="Forecast" subtitle="Proyección de ventas">
                {isAdminOrJefe && (
                    <Button
                        label="Definir Meta"
                        icon="pi pi-plus"
                        onClick={openCreate}
                        className="btn-brand"
                    />
                )}
            </PageHeader>

            <Messages ref={msgs} className="mb-4" />

            {/* KPI Cards Row */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <KPICard
                    icon="pi-chart-line"
                    label="PIPELINE PONDERADO"
                    value={`$${pipelinePonderado.toLocaleString()}`}
                    color={COLORS.red}
                />
                <KPICard
                    icon="pi-calendar"
                    label="ESPERADO"
                    value={`$${esperado.toLocaleString()}`}
                    color={COLORS.blue}
                />
                <KPICard
                    icon="pi-dollar"
                    label="CERRADO"
                    value={`$${cerrado.toLocaleString()}`}
                    color={COLORS.green}
                />
                <KPICard
                    icon="pi-bullseye"
                    label="META"
                    value={`${metaActualData?.metaCierres || 0} / ${metaCierres}`}
                    sub={`Meta: $${metaIngresos.toLocaleString()}`}
                    color={COLORS.purple}
                />
            </div>

            <div className="grid mt-4">
                {/* Chart Column (Existing) */}
                <div className="col-12 lg:col-7">
                    <Card className="shadow-1 h-full border-round-xl">
                        <SectionTitle icon="pi-chart-bar" title="Ingresos por Mes" />
                        <div className="flex align-items-end justify-content-between mt-6 px-2" style={{ height: '180px' }}>
                            {[
                                { label: 'Ene', val: 60, active: true },
                                { label: 'Feb', val: 90, active: true },
                                { label: 'Mar', val: 50, active: false },
                                { label: 'Abr', val: 120, active: false },
                                { label: 'May', val: 40, active: false },
                                { label: 'Jun', val: 30, active: false },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-column align-items-center" style={{ width: '14%' }}>
                                    <div
                                        className="w-full border-round-md transition-all transition-duration-300"
                                        style={{
                                            height: `${item.val}px`,
                                            backgroundColor: item.active ? COLORS.red : '#F3F4F6',
                                            boxShadow: item.active ? `0 4px 12px ${COLORS.red}30` : 'none'
                                        }}
                                    />
                                    <span className="text-xs text-500 mt-2 font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Goals Column (Simplified or Hidden based on clarifications - usually agents see their own goals) */}
                <div className="col-12 lg:col-5">
                    <Card className="shadow-1 h-full border-round-xl">
                        <SectionTitle icon="pi-bullseye" title="Historial de Metas" />
                        <div className="flex flex-column gap-3 mt-4">
                            {metas.length > 0 ? metas.map(m => {
                                const metaTarget = m.metaCierres || 1;
                                const actualCierres = Math.min(Math.floor(Math.random() * (metaTarget + 1)), metaTarget); // Placeholder logic for demonstration
                                const isCompleted = actualCierres >= metaTarget;

                                return (
                                    <div key={m.id} className="flex flex-column gap-1 pb-3 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
                                        <div className="flex justify-content-between align-items-center">
                                            <div className="font-bold text-900" style={{ fontSize: '1.05rem' }}>
                                                {m.mes} {m.anio}
                                            </div>
                                            <div
                                                className="px-2 py-1 border-round-lg text-xs font-bold flex align-items-center gap-1"
                                                style={{
                                                    backgroundColor: isCompleted ? COLORS.greenLight : COLORS.redLight,
                                                    color: isCompleted ? COLORS.green : COLORS.red
                                                }}
                                            >
                                                {actualCierres} / {metaTarget}
                                                {isCompleted && <i className="pi pi-check" style={{ fontSize: '0.7rem' }} />}
                                            </div>
                                        </div>
                                        <div className="text-sm text-500">
                                            {m.metaOportunidades} oportunidades • ${m.metaIngresos?.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-5 text-400">
                                    <i className="pi pi-info-circle mb-2" style={{ fontSize: '2rem' }} />
                                    <p>No hay historial disponible</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {isAdminOrJefe && (
                <div className="grid mt-2">
                    <div className="col-12">
                        <Card className="shadow-1 border-round-xl">
                            <div className="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                                <SectionTitle icon="pi-table" title="Listado de Metas" />
                                <div className="flex gap-2 flex-wrap">
                                    <Dropdown
                                        value={selectedMes}
                                        options={MESES_NOMBRES as any}
                                        onChange={(e) => setSelectedMes(e.value)}
                                        placeholder="Mes"
                                        className="w-full md:w-12rem"
                                    />
                                    <Dropdown
                                        value={selectedAnio}
                                        options={[new Date().getFullYear().toString(), (new Date().getFullYear() + 1).toString()]}
                                        onChange={(e) => setSelectedAnio(e.value)}
                                        placeholder="Año"
                                        className="w-full md:w-10rem"
                                    />
                                    <Dropdown
                                        value={selectedAgente}
                                        options={agentes.map(a => ({ label: `${a.nombres} ${a.apellidos}`, value: a.userID }))}
                                        onChange={(e) => setSelectedAgente(e.value)}
                                        placeholder="Filtrar por Agente"
                                        showClear
                                        className="w-full md:w-15rem"
                                        filter
                                        filterPlaceholder="Buscar agente..."
                                    />
                                </div>
                            </div>

                            <DataTable
                                value={metas}
                                loading={loading}
                                className="p-datatable-sm"
                                emptyMessage="No se encontraron metas para el filtro seleccionado"
                                responsiveLayout="stack"
                                rowHover
                                size="small"
                                stripedRows
                                tableStyle={{ minWidth: '50rem' }}
                                pt={{
                                    header: { style: { background: 'transparent', border: 'none', padding: '0' } },
                                    thead: { className: 'text-xs uppercase text-500' }
                                }}
                            >
                                <Column
                                    header="Agente"
                                    className="font-medium"
                                    alignHeader="left"
                                    body={(rowData) => (
                                        <div className="flex align-items-center gap-2">
                                            <div className="w-2rem h-2rem border-circle flex align-items-center justify-content-center text-xs font-bold"
                                                style={{ backgroundColor: COLORS.redLight, color: COLORS.red }}>
                                                {rowData.user?.nombres?.charAt(0) || 'A'}
                                            </div>
                                            <span>{rowData.user?.nombres ? `${rowData.user.nombres} ${rowData.user.apellidos}` : 'N/A'}</span>
                                        </div>
                                    )}
                                />
                                <Column header="Mes" body={(rowData) => <span className="font-bold">{rowData.mes}</span>} alignHeader="left" />
                                <Column field="anio" header="Año" alignHeader="left" />
                                <Column
                                    header="P / O / C"
                                    alignHeader="left"
                                    body={(rowData) => (
                                        <div className="flex gap-2">
                                            <span title="Prospectos" className="text-gray-600">{rowData.metaProspectos}</span>
                                            <span className="text-gray-300">|</span>
                                            <span title="Oportunidades" className="text-gray-600">{rowData.metaOportunidades}</span>
                                            <span className="text-gray-300">|</span>
                                            <span title="Cierres" className="font-bold" style={{ color: COLORS.red }}>{rowData.metaCierres}</span>
                                        </div>
                                    )}
                                />
                                <Column
                                    field="metaIngresos"
                                    header="Monto Meta"
                                    alignHeader="left"
                                    body={(rowData) => (
                                        <div className="font-bold" style={{ color: COLORS.green }}>
                                            ${rowData.metaIngresos?.toLocaleString()}
                                        </div>
                                    )}
                                />
                                <Column
                                    header="Acciones"
                                    alignHeader="left"
                                    body={(rowData) => (
                                        <div className="flex gap-2">
                                            <Button
                                                icon="pi pi-pencil"
                                                className="p-button-text p-button-rounded p-button-sm"
                                                onClick={() => openEdit(rowData)}
                                                style={{ color: COLORS.blue }}
                                            />
                                        </div>
                                    )}
                                />
                            </DataTable>
                        </Card>
                    </div>
                </div>
            )}

            <MetaModal
                visible={modalVisible}
                onHide={() => setModalVisible(false)}
                onSave={handleSaveMeta}
                meta={editingMeta}
                loading={loading}
                agentes={agentes}
            />
        </div>
    );
};

export default ForecastPage;
