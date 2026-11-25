import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { COLORS, FUENTES_PROSPECCION, ETAPAS_OPORTUNIDAD, MESES_NOMBRES } from '@/utils/constants';
import { EtapaOportunidad, PlanFinancieroData } from '@/types';
import { FormField, ModalSectionHeader } from '@/components/ui';
import { apiGetProspectos, apiGetListaPrecio, apiGetListaPrecioPorProducto, apiGetPlazoPorProducto, apiGetDetallePlazo, apiGetDetalleFinanciamiento, apiGetListaPrecioDetalles, apiGetFinanciamientoPorProducto } from '@/services/api';
import type { DetalleListaPrecio, Plazo, Financiamiento, DetallePlazo, DetalleFinanciamiento, ProspectoAPI } from '@/services/api';
import { PlanFinanciero } from './PlanFinanciero';
import { useNotification } from '@/context/NotificationContext';

// ════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════

export interface NuevaOportunidadForm {
    nombre: string;
    clienteId: number | string | null;
    cliente: string;
    producto: string;
    plan: number | string;
    subProducto: string;
    compromiso: string;
    fuente: string;
    notas: string;
    etapa: EtapaOportunidad;
    fk_plazo?: number | null;
    fk_plan?: number | null;
    fk_financiamiento?: number | null;
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: NuevaOportunidadForm) => void | Promise<void>;
    saving?: boolean;
}

// ════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════

const PRODUCTO_OPTS = [
    { label: '🚗 Vehículo', value: 'Vehiculo' },
    { label: '🏠 Vivienda', value: 'Vivienda' },
];

// ════════════════════════════════════════════════════════════
// MODAL NUEVA OPORTUNIDAD
// ════════════════════════════════════════════════════════════

export const NuevaOportunidadModal: React.FC<Props> = ({ visible, onHide, onSave, saving = false }) => {
    const initial: NuevaOportunidadForm = {
        nombre: '', clienteId: null, cliente: '',
        producto: '', plan: '', subProducto: '', compromiso: '', fuente: '',
        notas: '', etapa: 'Calificación',
    };
    const [form, setForm] = useState<NuevaOportunidadForm>(initial);
    const [clientes, setClientes] = useState<{ label: string; value: string | number }[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    // Dynamic data state
    const [detallesListaPrecio, setDetallesListaPrecio] = useState<DetalleListaPrecio[]>([]);
    const [plazos, setPlazos] = useState<Plazo[]>([]);
    const [financiamientos, setFinanciamientos] = useState<Financiamiento[]>([]);

    // Selection IDs (internal)
    const [selDetalleId, setSelDetalleId] = useState<number | null>(null);
    const [selPlazoId, setSelPlazoId] = useState<number | null>(null);
    const [selFinanciamientoId, setSelFinanciamientoId] = useState<number | null>(null);

    // Fetched details
    const [detallePlazo, setDetallePlazo] = useState<DetallePlazo | null>(null);
    const [detalleFin, setDetalleFin] = useState<DetalleFinanciamiento | null>(null);

    // ─── Templates ───
    const itemTemplateProducto = (option: any) => {
        const [emoji, ...textParts] = option.label.split(' ');
        const text = textParts.join(' ');
        return (
            <div className="flex align-items-center gap-3">
                <span style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>{emoji}</span>
                <span>{text}</span>
            </div>
        );
    };

    const valueTemplateProducto = (option: any, props: any) => {
        if (!option) return <span>{props.placeholder}</span>;
        const [emoji, ...textParts] = option.label.split(' ');
        const text = textParts.join(' ');
        return (
            <div className="flex align-items-center gap-3">
                <span style={{ fontSize: '1.1rem', width: '22px', textAlign: 'center' }}>{emoji}</span>
                <span>{text}</span>
            </div>
        );
    };

    // Cargar datos iniciales
    useEffect(() => {
        if (!visible) return;
        setLoadingClientes(true);
        Promise.all([
            apiGetProspectos({ mes: MESES_NOMBRES[new Date().getMonth()], anio: '2026' }),
            apiGetListaPrecio()
        ])
            .then(([prosepctosData]) => {
                setClientes(prosepctosData.map((p: ProspectoAPI) => ({
                    label: `${p.nombre}${p.apellido ? ' ' + p.apellido : ''}`,
                    value: p.id,
                })));
            })
            .catch(err => {
                console.error("Error loading initial data", err);
            })
            .finally(() => setLoadingClientes(false));
    }, [visible]);

    // Al cambiar producto, cargar planes y plazos
    useEffect(() => {
        if (!form.producto) {
            setDetallesListaPrecio([]);
            setPlazos([]);
            return;
        }

        // Cargar Planes
        apiGetListaPrecioPorProducto(form.producto)
            .then(data => {
                const priceList = Array.isArray(data) ? data[0] : data;

                if (priceList && priceList.id) {
                    apiGetListaPrecioDetalles(priceList.id)
                        .then(dets => {
                            setDetallesListaPrecio(dets);
                        });
                }
            })
            .catch(err => console.error("Error fetching detalles", err));

        // Cargar Plazos
        apiGetPlazoPorProducto(form.producto)
            .then(data => {
                setPlazos(data);
            })
            .catch(err => console.error("Error fetching plazos", err));

        // Cargar Financiamientos (Compromiso de Oferta)
        apiGetFinanciamientoPorProducto(form.producto)
            .then(data => {
                setFinanciamientos(data);
            })
            .catch(err => console.error("Error fetching financiamientos", err));

    }, [form.producto]);

    // Al cambiar detalle + plazo
    useEffect(() => {
        if (!selDetalleId || !selPlazoId) {
            setDetallePlazo(null);
            return;
        }
        // No mostramos loading en todo el modal, quizás solo en el recuadro si fuera necesario
        apiGetDetallePlazo(selPlazoId, selDetalleId)
            .then(data => {
                const finalData = Array.isArray(data) ? data[0] : data;
                setDetallePlazo(finalData);
            })
            .catch(err => console.error("Error fetching detalle plazo", err));
    }, [selDetalleId, selPlazoId]);

    // Al cambiar detalle + financiamiento
    useEffect(() => {
        if (!selDetalleId || !selFinanciamientoId) {
            setDetalleFin(null);
            return;
        }
        apiGetDetalleFinanciamiento(selFinanciamientoId, selDetalleId)
            .then(data => {
                const finalData = Array.isArray(data) ? data[0] : data;
                setDetalleFin(finalData);
            })
            .catch(err => console.error("Error fetching detalle financiamiento", err));
    }, [selDetalleId, selFinanciamientoId]);

    const set = <K extends keyof NuevaOportunidadForm>(k: K, v: NuevaOportunidadForm[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleClienteChange = (id: string | number) => {
        const found = clientes.find(c => c.value === id);
        set('clienteId', id);
        set('cliente', found?.label ?? '');
    };

    const handleProductoChange = (val: string) => {
        set('producto', val);
        // Reset dependant selections
        setSelDetalleId(null);
        setSelPlazoId(null);
        setSelFinanciamientoId(null);
        set('plan', '');
        set('subProducto', '');
        set('compromiso', '');
    };

    const handlePlanChange = (id: number) => {
        setSelDetalleId(id);
        const det = detallesListaPrecio.find(d => d.id === id);
        set('plan', det?.monto ?? 0);
    };

    const handlePlazoChange = (id: number) => {
        setSelPlazoId(id);
        const p = plazos.find(x => x.id === id);
        set('subProducto', p?.tipo ?? '');
    };

    const handleFinChange = (id: number) => {
        setSelFinanciamientoId(id);
        const f = financiamientos.find(x => x.id === id);
        set('compromiso', f?.tipo ?? '');
    };

    const planOpts = detallesListaPrecio.map(d => ({
        label: `${d.monto}`,
        value: d.id
    }));
    const plazoOpts = plazos.map(p => ({ label: p.tipo, value: p.id }));
    const finOpts = [
        { label: 'Sin Compromiso', value: null },
        ...financiamientos.map(f => ({ label: f.tipo, value: f.id }))
    ];

    const FUENTE_OPTS = FUENTES_PROSPECCION.map(f => ({ label: f, value: f }));
    const ETAPA_OPTS = ETAPAS_OPORTUNIDAD.map(e => ({ label: e, value: e }));

    // ── Resumen del plan data ──
    const getPlanData = (): PlanFinancieroData | null => {
        if (!selDetalleId) return null;
        const det = detallesListaPrecio.find(d => d.id === selDetalleId);
        if (!det) return null;

        const finMaster = financiamientos.find(f => f.id === selFinanciamientoId);
        const selectedPlazo = plazos.find(p => p.id === selPlazoId);

        const cuota = detallePlazo ? Number(detallePlazo.valor_cuota) : 0;
        const numPlazo = selectedPlazo?.num_plazo ?? 0;
        const calculatedMontoFinal = cuota * numPlazo;

        return {
            producto: form.producto || 'Vehículo',
            subProducto: form.subProducto,
            montoBase: det.monto,
            montoFinal: calculatedMontoFinal || det.monto_final,
            inscripcion: det.valor_inscripcion,
            cuotaMensual: cuota,
            compromiso: detalleFin ? {
                tipo: finMaster ? String(finMaster.tipo) : '0',
                cuotas: finMaster?.cuotas ?? 0,
                valor_financiamiento: Number(detalleFin.valor_financiamiento || 0),
            } : undefined
        };
    };
    const currentPlanData = getPlanData();

    const { showWarn } = useNotification();

    const handleSubmit = () => {
        if (!form.nombre || !form.clienteId || !form.producto || !selDetalleId || !selPlazoId) {
            showWarn('Complete los campos obligatorios: Nombre, Cliente, Producto, Plan y Sub-Producto', 'Campos incompletos');
            return;
        }
        onSave({
            ...form,
            fk_plazo: selPlazoId,
            fk_plan: selDetalleId,
            fk_financiamiento: selFinanciamientoId
        });
        setForm(initial);
        setSelDetalleId(null);
        setSelPlazoId(null);
        setSelFinanciamientoId(null);
    };

    const handleClose = () => {
        setForm(initial);
        setSelDetalleId(null);
        setSelPlazoId(null);
        setSelFinanciamientoId(null);
        onHide();
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-3">
                    <div style={{
                        width: '52px', height: '52px', borderRadius: '14px',
                        backgroundColor: COLORS.redLight, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <i className="pi pi-sync" style={{ color: COLORS.red, fontSize: '1.4rem' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                            Nueva Oportunidad
                        </div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                            Registra una nueva oportunidad de venta
                        </div>
                    </div>
                </div>
            }
            visible={visible}
            onHide={handleClose}
            footer={
                <div className="flex justify-content-end gap-3" style={{ padding: '8px 0' }}>
                    <Button
                        label="Cancelar"
                        onClick={handleClose}
                        outlined
                        style={{ borderColor: COLORS.red, color: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
                    />
                    <Button
                        label={saving ? 'Guardando...' : 'Guardar'}
                        icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-plus'}
                        iconPos="left"
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, color: COLORS.white, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
                        pt={{ icon: { style: { fontSize: '1rem' } } }}
                    />
                </div>
            }
            style={{ width: '680px', borderRadius: '16px', overflow: 'hidden' }}
            modal
            className="p-fluid"
            headerStyle={{ borderBottom: 'none' }}
            contentStyle={{ borderTop: 'none' }}
        >
            {/* ── Información General ── */}
            <ModalSectionHeader icon="pi-sync" title="Información General" />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <FormField label="Nombre de la Oportunidad" required>
                        <InputText
                            value={form.nombre}
                            onChange={e => set('nombre', e.target.value)}
                            placeholder="Ej: SUV Familiar"
                        />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Cliente" required>
                        <Dropdown
                            value={form.clienteId}
                            options={clientes}
                            onChange={e => handleClienteChange(e.value)}
                            placeholder={loadingClientes ? 'Cargando...' : 'Seleccione...'}
                            filter
                            filterPlaceholder="Buscar cliente..."
                            emptyMessage="Sin clientes"
                        />
                    </FormField>
                </div>
            </div>

            {/* ── Producto y Plan ── */}
            <ModalSectionHeader icon="pi-tag" title="Producto y Plan" />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <FormField label="Producto" required>
                        <Dropdown
                            value={form.producto}
                            options={PRODUCTO_OPTS}
                            onChange={e => handleProductoChange(e.value)}
                            itemTemplate={itemTemplateProducto}
                            valueTemplate={valueTemplateProducto}
                            placeholder="Seleccione..."
                        />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Sub-Producto" required>
                        <Dropdown
                            value={selPlazoId}
                            options={plazoOpts}
                            onChange={e => handlePlazoChange(e.value)}
                            placeholder="Seleccione..."
                            disabled={!form.producto}
                        />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Plan (Monto)" required>
                        <Dropdown
                            value={selDetalleId}
                            options={planOpts}
                            onChange={e => handlePlanChange(e.value)}
                            placeholder="Seleccione plan..."
                            filter
                            disabled={!form.producto}
                        />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Compromiso de Oferta">
                        <Dropdown
                            value={selFinanciamientoId}
                            options={finOpts}
                            onChange={e => handleFinChange(e.value)}
                            placeholder="Seleccione..."
                            style={{
                                border: `1.5px solid ${COLORS.red}40`,
                                color: COLORS.red,
                                fontWeight: 600,
                            }}
                            disabled={!form.producto}
                        />
                    </FormField>
                </div>
            </div>

            {/* ── Resumen del Plan ── */}
            {currentPlanData && (
                <PlanFinanciero data={currentPlanData} />
            )}

            {/* ── Clasificación ── */}
            <ModalSectionHeader icon="pi-chart-line" title="Clasificación" />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <FormField label="Fuente">
                        <Dropdown
                            value={form.fuente}
                            options={FUENTE_OPTS}
                            onChange={e => set('fuente', e.value)}
                            placeholder="¿Cómo llegó?"
                        />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Etapa">
                        <Dropdown
                            value={form.etapa}
                            options={ETAPA_OPTS}
                            onChange={e => set('etapa', e.value)}
                        />
                    </FormField>
                </div>
                <div className="col-12">
                    <FormField label="Notas">
                        <InputTextarea
                            value={form.notas}
                            onChange={e => set('notas', e.target.value)}
                            placeholder="Observaciones adicionales..."
                            rows={3}
                            style={{ resize: 'none' }}
                        />
                    </FormField>
                </div>
            </div>
        </Dialog>
    );
};
