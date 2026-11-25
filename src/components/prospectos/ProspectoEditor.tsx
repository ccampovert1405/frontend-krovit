import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { COLORS, ETAPAS_AIDA } from '@/utils/constants';
import { Prospecto, EtapaAIDA } from '@/types';
import { FormField, ModalSectionHeader } from '@/components/ui';
import { apiGetUsersByRole, UsuarioAPI } from '@/services/api';
import { useAuth } from '@/hooks';

// ═══════════════════════════════════════════════════════════
// TIPO DEL FORM
// ═══════════════════════════════════════════════════════════

interface EditarProspectoFullForm {
    nombre: string;
    apellido: string;
    empresa: string;
    cedula: string;
    email: string;
    telefono: string;
    celular: string;
    ciudad: string;
    etapa: EtapaAIDA;
    producto: string;
    user_create_id: number | string;
    created_at: string;
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
    const { user } = useAuth();
    const isJefe = user?.rol === 'Jefe Comercial' || user?.rol === 'jefe' || user?.rol === 'Administrador' || user?.rol === 'Admin' || user?.rol === 'Gerente Comercial';

    const etapaOptions = ETAPAS_AIDA.map(e => ({ label: e, value: e }));

    const [usuarios, setUsuarios] = useState<UsuarioAPI[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (visible && isJefe) {
            setLoadingUsers(true);
            // Si es jefe/admin, podemos ver todos los usuarios para asignar
            apiGetUsersByRole('Agente Comercial')
                .then(setUsuarios)
                .catch(err => console.error("Error fetching users", err))
                .finally(() => setLoadingUsers(false));
        }
    }, [visible, isJefe]);

    // Separar nombre completo en nombre y apellido
    const partes = (prospecto.nombre || '').split(' ');
    const nombreInicial = partes[0] || '';
    const apellidoInicial = partes.slice(1).join(' ') || prospecto.apellido || '';

    const [form, setForm] = useState<EditarProspectoFullForm>({
        nombre: nombreInicial,
        apellido: apellidoInicial,
        empresa: prospecto.empresa || '',
        cedula: prospecto.cedula || '',
        email: prospecto.email || '',
        telefono: prospecto.telefono || '',
        celular: prospecto.celular || '',
        ciudad: prospecto.ciudad || '',
        etapa: prospecto.etapa,
        producto: prospecto.producto || 'Vehículo',
        user_create_id: prospecto.user_create_id || prospecto.user_create?.userID || '',
        created_at: prospecto.created_at ? prospecto.created_at.split('T')[0] : '',
    });

    const set = (field: keyof EditarProspectoFullForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!form.nombre || !form.email || !form.telefono) {
            alert('Nombre, Email y Teléfono son obligatorios');
            return;
        }

        // Si es agente, no alteramos el user_create_id original.
        // Si es jefe, enviamos el que haya seleccionado.
        const changes: any = {
            nombre: form.nombre,
            apellido: form.apellido,
            empresa: form.empresa,
            cedula: form.cedula,
            email: form.email,
            telefono: form.telefono,
            celular: form.celular,
            ciudad: form.ciudad,
            etapa: form.etapa,
            producto: form.producto,
            created_at: form.created_at ? new Date(`${form.created_at}T00:00:00`).toISOString() : undefined,
        };

        if (isJefe) {
            changes.user_create_id = form.user_create_id;
        }

        onSave(prospecto.id, changes);
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
                <div className="col-12 md:col-6">
                    <FormField label="Nombre" required>
                        <InputText value={form.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Apellido">
                        <InputText value={form.apellido} onChange={(e) => set('apellido', e.target.value)} placeholder="Apellido" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Empresa">
                        <InputText value={form.empresa} onChange={(e) => set('empresa', e.target.value)} placeholder="Empresa" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Cédula">
                        <InputText value={form.cedula} onChange={(e) => set('cedula', e.target.value)} placeholder="Número de identificación" />
                    </FormField>
                </div>
            </div>

            {/* ── Datos de Contacto ── */}
            <ModalSectionHeader icon="pi-phone" title="Datos de Contacto" />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <FormField label="Email" required>
                        <InputText value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="correo@ejemplo.com" type="email" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Teléfono" required>
                        <InputText value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+593 99 999 9999" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Celular">
                        <InputText value={form.celular} onChange={(e) => set('celular', e.target.value)} placeholder="+593 99 999 9999" />
                    </FormField>
                </div>
                <div className="col-12 md:col-6">
                    <FormField label="Ciudad">
                        <InputText value={form.ciudad} onChange={(e) => set('ciudad', e.target.value)} placeholder="Ciudad" />
                    </FormField>
                </div>
            </div>

            {/* ── Estado ── */}
            <ModalSectionHeader icon="pi-chart-line" title="Estado" />
            <div className="grid">
                <div className="col-12 md:col-6">
                    <FormField label="Etapa AIDA">
                        <Dropdown
                            value={form.etapa}
                            options={etapaOptions}
                            onChange={(e) => set('etapa', e.value)}
                            placeholder="Seleccione etapa..."
                        />
                    </FormField>
                </div>

                <div className="col-12 md:col-6">
                    <FormField label="Categoría de Interés">
                        <Dropdown
                            value={form.producto}
                            options={[
                                { label: '🚗 Vehículo', value: 'Vehículo' },
                                { label: '🏠 Vivienda', value: 'Vivienda' }
                            ]}
                            onChange={(e) => set('producto', e.value)}
                            placeholder="Seleccione categoría"
                        />
                    </FormField>
                </div>

                <div className="col-12 md:col-6">
                    <FormField label="Fecha de creacion">
                        <Calendar
                            value={form.created_at ? new Date(form.created_at + 'T12:00:00') : null}
                            onChange={(e) => {
                                const val = e.value as Date;
                                if (val) {
                                    const y = val.getFullYear();
                                    const m = String(val.getMonth() + 1).padStart(2, '0');
                                    const d = String(val.getDate()).padStart(2, '0');
                                    set('created_at', `${y}-${m}-${d}`);
                                } else {
                                    set('created_at', '');
                                }
                            }}
                            dateFormat="yy-mm-dd"
                            placeholder="AAAA-MM-DD"
                            showIcon
                        />
                    </FormField>
                </div>

                {/* Solo perfiles que sean Jefe Comercial pueden ver/editar el agente asignado */}
                {isJefe && (
                    <div className="col-12 md:col-6">
                        <FormField label="Agente">
                            <Dropdown
                                value={form.user_create_id}
                                options={usuarios.map(u => ({
                                    label: `${u.nombres} ${u.apellidos} `,
                                    value: u.userID
                                }))}
                                onChange={(e) => set('user_create_id', e.value)}
                                placeholder={loadingUsers ? 'Cargando...' : 'Seleccione Agente...'}
                                filter
                                filterBy="label"
                                showClear
                            />
                        </FormField>
                    </div>
                )}
            </div>

            {/* Log de control invisible para debugging visual */}
            <div style={{ display: 'none' }}>v2.2.0-pixel-perfect</div>
        </Dialog>
    );
};
