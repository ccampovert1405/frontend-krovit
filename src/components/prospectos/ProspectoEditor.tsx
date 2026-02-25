import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { COLORS, ETAPAS_AIDA, ETAPA_COLORS } from '@/utils/constants';
import { Prospecto, EtapaAIDA } from '@/types';
import { FormField, ModalSectionHeader } from '@/components/ui';

// ═══════════════════════════════════════════════════════════
// TIPO DEL FORM
// ═══════════════════════════════════════════════════════════

interface EditarProspectoFullForm {
    nombre: string;
    apellido: string;
    empresa: string;
    cargo: string;
    email: string;
    telefono: string;
    celular: string;
    ciudad: string;
    etapa: EtapaAIDA;
}

// ═══════════════════════════════════════════════════════════
// MODAL EDITAR PROSPECTO — ProspectoEditor.tsx
// ═══════════════════════════════════════════════════════════

interface EditarProspectoModalProps {
    prospecto: Prospecto;
    visible: boolean;
    onHide: () => void;
    onSave: (id: string | number, changes: Partial<Prospecto>) => void;
}

export const EditarProspectoModal: React.FC<EditarProspectoModalProps> = ({ prospecto, visible, onHide, onSave }) => {
    const etapaOptions = ETAPAS_AIDA.map(e => ({ label: e, value: e }));

    // Separar nombre completo en nombre y apellido
    const partes = (prospecto.nombre || '').split(' ');
    const nombreInicial = partes[0] || '';
    const apellidoInicial = partes.slice(1).join(' ') || prospecto.apellido || '';

    const [form, setForm] = useState<EditarProspectoFullForm>({
        nombre: nombreInicial,
        apellido: apellidoInicial,
        empresa: prospecto.empresa || '',
        cargo: prospecto.cargo || '',
        email: prospecto.email || '',
        telefono: prospecto.telefono || '',
        celular: prospecto.celular || '',
        ciudad: prospecto.ciudad || '',
        etapa: prospecto.etapa,
    });

    const set = (field: keyof EditarProspectoFullForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!form.nombre || !form.email || !form.telefono) {
            alert('Nombre, Email y Teléfono son obligatorios');
            return;
        }
        onSave(prospecto.id, {
            nombre: `${form.nombre} ${form.apellido}`.trim(),
            apellido: form.apellido,
            empresa: form.empresa,
            cargo: form.cargo,
            email: form.email,
            telefono: form.telefono,
            celular: form.celular,
            ciudad: form.ciudad,
            etapa: form.etapa,
            color: ETAPA_COLORS[form.etapa],
        });
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
                        <i className="pi pi-pencil" style={{ color: COLORS.red, fontSize: '1.2rem' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.gray800 }}>Editar Prospecto</div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>Modifica los datos del prospecto</div>
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
                        label="Guardar Cambios"
                        icon="pi pi-save"
                        iconPos="left"
                        onClick={handleSave}
                        style={{
                            backgroundColor: COLORS.red,
                            borderColor: COLORS.red,
                            borderRadius: '10px',
                            fontWeight: 600,
                            padding: '12px 28px',
                            fontSize: '0.95rem',
                        }}
                        pt={{ icon: { style: { fontSize: '1rem' } } }}
                    />
                </div>
            }
            style={{ width: '600px' }}
            modal
            className="p-fluid"
            headerStyle={{ borderBottom: 'none' }}
            contentStyle={{ borderTop: 'none' }}
        >
            {/* ── Información Personal ── */}
            <ModalSectionHeader icon="pi-user" title="Información Personal" />
            <div className="grid">
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
            <div className="grid">
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

            {/* ── Estado ── */}
            <ModalSectionHeader icon="pi-chart-line" title="Estado" />
            <div className="grid">
                <div className="col-12">
                    <FormField label="Etapa AIDA">
                        <Dropdown
                            value={form.etapa}
                            options={etapaOptions}
                            onChange={(e) => set('etapa', e.value)}
                            placeholder="Seleccione etapa..."
                        />
                    </FormField>
                </div>
            </div>

            {/* Log de control invisible para debugging visual */}
            <div style={{ display: 'none' }}>v2.2.0-pixel-perfect</div>
        </Dialog>
    );
};
