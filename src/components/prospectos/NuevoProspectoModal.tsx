import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { COLORS } from '@/utils/constants';
import { FormField, ModalSectionHeader } from '@/components/ui';

// ═══════════════════════════════════════════════════════════
// TIPO DEL FORM
// ═══════════════════════════════════════════════════════════

export interface NuevoProspectoForm {
    nombre: string;
    apellido: string;
    empresa: string;
    cargo: string;
    email: string;
    telefono: string;
    celular: string;
    ciudad: string;
}

// ═══════════════════════════════════════════════════════════
// MODAL NUEVO PROSPECTO
// ═══════════════════════════════════════════════════════════

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (data: NuevoProspectoForm) => void;
}

export const NuevoProspectoModal: React.FC<Props> = ({ visible, onHide, onSave }) => {
    const initialState: NuevoProspectoForm = {
        nombre: '',
        apellido: '',
        empresa: '',
        cargo: '',
        email: '',
        telefono: '',
        celular: '',
        ciudad: '',
    };

    const [form, setForm] = useState<NuevoProspectoForm>(initialState);

    const set = (field: keyof NuevoProspectoForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!form.nombre || !form.email || !form.telefono) {
            alert('Por favor complete los campos obligatorios: Nombre, Email y Teléfono');
            return;
        }
        onSave(form);
        setForm(initialState);
    };

    const handleClose = () => {
        setForm(initialState);
        onHide();
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-3">
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: COLORS.redLight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <i className="pi pi-user-plus" style={{ color: COLORS.red, fontSize: '1.3rem' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.gray800 }}>Nuevo Prospecto</div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>Registra un nuevo lead en el sistema</div>
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
                        style={{
                            borderColor: COLORS.red,
                            color: COLORS.red,
                            borderRadius: '10px',
                            fontWeight: 600,
                            padding: '12px 28px',
                            fontSize: '0.95rem',
                        }}
                    />
                    <Button
                        label="Guardar Prospecto"
                        icon="pi pi-plus"
                        iconPos="left"
                        onClick={handleSubmit}
                        style={{
                            backgroundColor: COLORS.red,
                            borderColor: COLORS.red,
                            borderRadius: '10px',
                            fontWeight: 600,
                            padding: '12px 28px',
                            fontSize: '0.95rem',
                        }}
                        pt={{ icon: { style: { fontSize: '1.1rem' }, className: 'p-button-icon' } }}
                    />
                </div>
            }
            style={{ width: '600px', borderRadius: '16px', overflow: 'hidden' }}
            modal
            className="p-fluid"
            headerStyle={{ padding: '24px 28px 16px', borderBottom: 'none' }}
            contentStyle={{ padding: '0 28px 8px' }}
        >
            {/* ── Información Personal ── */}
            <ModalSectionHeader icon="pi-user" title="Información Personal" />
            <div className="grid" style={{ rowGap: '4px' }}>
                <div className="col-6">
                    <FormField label="Nombre" required>
                        <InputText value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Apellido">
                        <InputText value={form.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Apellido" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Empresa">
                        <InputText value={form.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Empresa" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Cargo">
                        <InputText value={form.cargo} onChange={(e) => set('cargo', e.target.value)} placeholder="Cargo" />
                    </FormField>
                </div>
            </div>

            {/* ── Datos de Contacto ── */}
            <ModalSectionHeader icon="pi-phone" title="Datos de Contacto" />
            <div className="grid" style={{ rowGap: '4px' }}>
                <div className="col-6">
                    <FormField label="Email" required>
                        <InputText value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@ejemplo.com" type="email" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Teléfono" required>
                        <InputText value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+593 99 999 9999" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Celular">
                        <InputText value={form.celular} onChange={(e) => set('celular', e.target.value)} placeholder="+593 99 999 9999" />
                    </FormField>
                </div>
                <div className="col-6">
                    <FormField label="Ciudad">
                        <InputText value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Ciudad" />
                    </FormField>
                </div>
            </div>
        </Dialog>
    );
};
