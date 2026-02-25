import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { COLORS, FUENTES_PROSPECCION, PLAN_OPTIONS, ETAPAS_OPORTUNIDAD } from '@/utils/constants';
import { EtapaOportunidad } from '@/types';
import { FormField, ModalSectionHeader } from '@/components/ui';
import { apiGetProspectos } from '@/services/api';

// ════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════

export interface NuevaOportunidadForm {
    nombre: string;
    clienteId: number | null;
    cliente: string;
    producto: string;
    plan: number | string;
    fuente: string;
    notas: string;
    etapa: EtapaOportunidad;
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
// MODAL NUEVA OPORTUNIDAD
// ════════════════════════════════════════════════════════════

export const NuevaOportunidadModal: React.FC<Props> = ({ visible, onHide, onSave, saving = false }) => {
    const initial: NuevaOportunidadForm = {
        nombre: '', clienteId: null, cliente: '',
        producto: '', plan: '', fuente: '',
        notas: '', etapa: 'Calificación',
    };
    const [form, setForm] = useState<NuevaOportunidadForm>(initial);
    const [clientes, setClientes] = useState<{ label: string; value: number }[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    // Cargar clientes desde la API al abrir
    useEffect(() => {
        if (!visible) return;
        setLoadingClientes(true);
        apiGetProspectos()
            .then(data =>
                setClientes(data.map(p => ({
                    label: `${p.nombre}${p.apellido ? ' ' + p.apellido : ''}`,
                    value: p.id,
                })))
            )
            .catch(() => {
                // Si la API falla, mostrar lista vacía sin romper la UI
                setClientes([]);
            })
            .finally(() => setLoadingClientes(false));
    }, [visible]);

    const set = <K extends keyof NuevaOportunidadForm>(k: K, v: NuevaOportunidadForm[K]) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleClienteChange = (id: number) => {
        const found = clientes.find(c => c.value === id);
        set('clienteId', id);
        set('cliente', found?.label ?? '');
    };

    const planOpts = PLAN_OPTIONS.map(p => ({ label: planLabel(p), value: p }));

    const handleSubmit = () => {
        if (!form.nombre || !form.clienteId || !form.producto || !form.plan) {
            alert('Complete los campos obligatorios: Nombre, Cliente, Producto y Plan');
            return;
        }
        onSave(form);
        setForm(initial);
    };

    const handleClose = () => { setForm(initial); onHide(); };

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
            <ModalSectionHeader icon="pi-sync" title="Información General" />
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
            </div>

            {/* ── Clasificación ── */}
            <ModalSectionHeader icon="pi-chart-line" title="Clasificación" />
            <div className="grid">
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
                <div className="col-6">
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
