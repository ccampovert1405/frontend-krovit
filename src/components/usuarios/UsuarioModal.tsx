import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { UsuarioAPI, RolAPI } from '@/services/api';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// USUARIO MODAL — Crear / Editar Usuario
// ═══════════════════════════════════════════════════════════

export interface UsuarioForm {
    nombres: string;
    apellidos: string;
    correo: string;
    password: string;
    estado: 'activo' | 'inactivo';
    rolId: string;
}

interface UsuarioModalProps {
    visible: boolean;
    onHide: () => void;
    onSave: (data: UsuarioForm) => Promise<void>;
    usuario?: UsuarioAPI | null;
    roles: RolAPI[];
    loading?: boolean;
}

const ESTADO_OPTS = [
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
];

const EMPTY_FORM: UsuarioForm = {
    nombres: '',
    apellidos: '',
    correo: '',
    password: '',
    estado: 'activo',
    rolId: '',
};

const fieldStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray200}`,
    padding: '10px 14px',
    fontSize: '0.95rem',
    color: COLORS.gray700,
    outline: 'none',
};

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
    visible, onHide, onSave, usuario, roles, loading = false,
}) => {
    const [form, setForm] = useState<UsuarioForm>(EMPTY_FORM);
    const isEdit = !!usuario;

    useEffect(() => {
        if (usuario) {
            setForm({
                nombres: usuario.nombres || '',
                apellidos: usuario.apellidos || '',
                correo: usuario.correo || usuario.email || '',
                password: '',
                estado: (usuario.estado as 'activo' | 'inactivo') || 'activo',
                rolId: usuario.rol?.rolId || usuario.rol?.id || usuario.rolId || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [usuario, visible]);

    const set = (field: keyof UsuarioForm, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        const payload = { ...form };
        if (isEdit && !payload.password) {
            delete (payload as any).password;
        }
        await onSave(payload);
    };

    const rolOptions = roles.map(r => ({ label: r.nombreRol, value: r.rolId || r.id }));

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="Cancelar" outlined onClick={onHide} disabled={loading}
                style={{ borderColor: COLORS.gray300, color: COLORS.gray600 }} />
            <Button
                label={isEdit ? 'Guardar cambios' : 'Crear usuario'}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                onClick={handleSave}
                disabled={loading || !form.nombres || !form.apellidos || !form.correo || !form.rolId || (!isEdit && !form.password)}
                style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, color: COLORS.white }}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-user" style={{ color: COLORS.red }} />
                    <span className="font-bold text-900">{isEdit ? 'Editar Usuario' : 'Nuevo Usuario'}</span>
                </div>
            }
            footer={footer}
            style={{ width: '520px', maxWidth: '95vw' }}
            modal
            draggable={false}
        >
            <div className="flex flex-column gap-4 pt-2">
                {/* Sección: Información personal */}
                <div>
                    <div className="text-xs font-bold uppercase mb-3"
                        style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                        Información personal
                    </div>
                    <div className="flex flex-column sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Nombres <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <InputText
                                value={form.nombres}
                                onChange={e => set('nombres', e.target.value)}
                                placeholder="Nombres"
                                style={fieldStyle}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Apellidos <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <InputText
                                value={form.apellidos}
                                onChange={e => set('apellidos', e.target.value)}
                                placeholder="Apellidos"
                                style={fieldStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Sección: Acceso */}
                <div>
                    <div className="text-xs font-bold uppercase mb-3"
                        style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                        Acceso y seguridad
                    </div>
                    <div className="flex flex-column gap-3">
                        <div>
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Correo electrónico <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <InputText
                                value={form.correo}
                                onChange={e => set('correo', e.target.value)}
                                placeholder="correo@ejemplo.com"
                                type="email"
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Contraseña {isEdit ? <span style={{ color: COLORS.gray400, fontWeight: 400 }}>(dejar en blanco para no cambiar)</span> : <span style={{ color: COLORS.red }}>*</span>}
                            </label>
                            <InputText
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                                type="password"
                                style={fieldStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* Sección: Rol y estado */}
                <div>
                    <div className="text-xs font-bold uppercase mb-3"
                        style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                        Rol y estado
                    </div>
                    <div className="flex flex-column sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Rol <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <Dropdown
                                value={form.rolId}
                                onChange={e => set('rolId', e.value)}
                                options={rolOptions}
                                placeholder="Seleccionar rol"
                                style={{ width: '100%', borderRadius: '8px' }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Estado <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <Dropdown
                                value={form.estado}
                                onChange={e => set('estado', e.value)}
                                options={ESTADO_OPTS}
                                style={{ width: '100%', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default UsuarioModal;
