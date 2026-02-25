import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { COLORS, FUENTES_PROSPECCION, PLAN_OPTIONS, ETAPAS_OPORTUNIDAD } from '@/utils/constants';
import { Oportunidad, EtapaOportunidad } from '@/types';
import { FormField, ModalSectionHeader } from '@/components/ui';
import { apiGetProspectos } from '@/services/api';

// ════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════

const PRODUCTO_OPTS = [
    { label: '🚗 Vehículo', value: 'Vehículo' },
    { label: '🏠 Vivienda', value: 'Vivienda' },
    { label: '🔨 Remodelación', value: 'Remodelación' },
];

const ETAPA_OPTS = ETAPAS_OPORTUNIDAD.map(e => ({ label: e, value: e }));
const FUENTE_OPTS = FUENTES_PROSPECCION.map(f => ({ label: f, value: f }));

const planLabel = (p: number) => {
    const cuota = Math.round(p * 0.01728);
    return `$${p.toLocaleString()} - Cuota $${cuota}/mes`;
};

// ════════════════════════════════════════════════════════════
// PLAN SUMMARY
// ════════════════════════════════════════════════════════════

const PlanSummary: React.FC<{ plan: number | string }> = ({ plan }) => {
    if (!plan || typeof plan !== 'number') return null;
    const cuota = Math.round(plan * 0.01728);
    const inscripcion = Math.round(plan * 0.05178);
    return (
        <div style={{
            background: COLORS.gray50, border: `1px solid ${COLORS.gray200}`,
            borderRadius: '10px', padding: '14px 18px', marginTop: '8px',
        }}>
            <div style={{ fontSize: '0.78rem', color: COLORS.gray500, marginBottom: '8px' }}>
                Resumen del Plan
            </div>
            <div className="flex gap-4">
                <div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray500 }}>Inscripción</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.gray800 }}>
                        ${inscripcion.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray500 }}>Cuota Mensual</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.gray800 }}>
                        ${cuota}/mes
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: COLORS.gray500 }}>Monto Total</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: COLORS.red }}>
                        ${plan.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════
// MODAL EDITAR OPORTUNIDAD
// ════════════════════════════════════════════════════════════

interface Props {
    oportunidad: Oportunidad;
    visible: boolean;
    onHide: () => void;
    onSave: (id: number, changes: Partial<Oportunidad>) => void;
}

export const EditarOportunidadModal: React.FC<Props> = ({ oportunidad, visible, onHide, onSave }) => {
    const [form, setForm] = useState({
        nombre: oportunidad.nombre,
        clienteId: oportunidad.clienteId ?? null as number | null,
        cliente: oportunidad.cliente,
        producto: oportunidad.producto ?? '',
        plan: oportunidad.plan ?? '' as number | string,
        fuente: oportunidad.fuente ?? '',
        notas: oportunidad.notas ?? '',
        etapa: oportunidad.etapa,
    });
    const [clientes, setClientes] = useState<{ label: string; value: number }[]>([]);

    // Inicializar form cuando cambia la oportunidad
    useEffect(() => {
        setForm({
            nombre: oportunidad.nombre,
            clienteId: oportunidad.clienteId ?? null,
            cliente: oportunidad.cliente,
            producto: oportunidad.producto ?? '',
            plan: oportunidad.plan ?? '',
            fuente: oportunidad.fuente ?? '',
            notas: oportunidad.notas ?? '',
            etapa: oportunidad.etapa,
        });
    }, [oportunidad]);

    // Cargar clientes desde la API
    useEffect(() => {
        if (!visible) return;
        apiGetProspectos()
            .then(data =>
                setClientes(data.map(p => ({
                    label: `${p.nombre}${p.apellido ? ' ' + p.apellido : ''}`,
                    value: p.id,
                })))
            )
            .catch(() => setClientes([]));
    }, [visible]);

    const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleClienteChange = (id: number) => {
        const found = clientes.find(c => c.value === id);
        set('clienteId', id);
        set('cliente', found?.label ?? '');
    };

    const planOpts = PLAN_OPTIONS.map(p => ({ label: planLabel(p), value: p }));

    const handleSave = () => {
        if (!form.nombre || !form.producto || !form.plan) {
            alert('Complete los campos obligatorios: Nombre, Producto y Plan');
            return;
        }
        const valor = typeof form.plan === 'number' ? form.plan : oportunidad.valor;
        onSave(oportunidad.id, {
            nombre: form.nombre,
            clienteId: form.clienteId ?? undefined,
            cliente: form.cliente,
            producto: form.producto,
            plan: form.plan,
            fuente: form.fuente,
            notas: form.notas,
            etapa: form.etapa,
            valor,
        });
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
                        <i className="pi pi-pencil" style={{ color: COLORS.red, fontSize: '1.3rem' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                            Editar Oportunidad
                        </div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                            Modifica los datos de la oportunidad
                        </div>
                    </div>
                </div>
            }
            visible={visible}
            onHide={onHide}
            footer={
                <div className="flex justify-content-end gap-3" style={{ padding: '8px 0' }}>
                    <Button
                        label="Cancelar"
                        onClick={onHide}
                        outlined
                        style={{ borderColor: COLORS.red, color: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
                    />
                    <Button
                        label="Guardar Cambios"
                        icon="pi pi-save"
                        iconPos="left"
                        onClick={handleSave}
                        style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
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
            <div className="grid">
                <div className="col-6">
                    <FormField label="Nombre de la Oportunidad" required>
                        <InputText
                            value={form.nombre}
                            onChange={e => set('nombre', e.target.value)}
                            placeholder="Ej: SUV Familiar"
                        />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Cliente" required>
                        <Dropdown
                            value={form.clienteId}
                            options={clientes}
                            onChange={e => handleClienteChange(e.value)}
                            placeholder="Seleccione..."
                            filter
                            filterPlaceholder="Buscar cliente..."
                            emptyMessage="Sin clientes disponibles"
                        />
                    </FormField>
                </div>
            </div>

            {/* ── Producto y Plan ── */}
            <ModalSectionHeader icon="pi-tag" title="Producto y Plan" />
            <div className="grid">
                <div className="col-6">
                    <FormField label="Producto" required>
                        <Dropdown
                            value={form.producto}
                            options={PRODUCTO_OPTS}
                            onChange={e => set('producto', e.value)}
                            placeholder="Seleccione..."
                        />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Plan" required>
                        <Dropdown
                            value={form.plan}
                            options={planOpts}
                            onChange={e => set('plan', e.value)}
                            placeholder="Seleccione plan..."
                            filter
                        />
                    </FormField>
                </div>
                <div className="col-12">
                    <PlanSummary plan={form.plan} />
                </div>
            </div>

            {/* ── Estado ── */}
            <ModalSectionHeader icon="pi-chart-line" title="Estado" />
            <div className="grid">
                <div className="col-6">
                    <FormField label="Etapa">
                        <Dropdown
                            value={form.etapa}
                            options={ETAPA_OPTS}
                            onChange={e => set('etapa', e.value as EtapaOportunidad)}
                        />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Fuente">
                        <Dropdown
                            value={form.fuente}
                            options={FUENTE_OPTS}
                            onChange={e => set('fuente', e.value)}
                            placeholder="¿Cómo llegó?"
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
