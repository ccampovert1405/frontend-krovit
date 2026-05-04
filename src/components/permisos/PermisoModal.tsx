import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { PermisoAPI, RolAPI } from '@/services/api';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// PERMISO MODAL — Crear / Editar Permiso
// ═══════════════════════════════════════════════════════════

export interface PermisoForm {
    nombreAccion: string;
    identificadorAccion: string;
    roleId: string;
}

interface PermisoModalProps {
    visible: boolean;
    onHide: () => void;
    onSave: (data: PermisoForm) => Promise<void>;
    permiso?: PermisoAPI | null;
    roles: RolAPI[];
    loading?: boolean;
}

const EMPTY_FORM: PermisoForm = {
    nombreAccion: '',
    identificadorAccion: '',
    roleId: '',
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

export const PermisoModal: React.FC<PermisoModalProps> = ({
    visible, onHide, onSave, permiso, roles, loading = false,
}) => {
    const [form, setForm] = useState<PermisoForm>(EMPTY_FORM);
    const isEdit = !!permiso;

    useEffect(() => {
        if (permiso) {
            setForm({
                nombreAccion: permiso.nombreAccion || '',
                identificadorAccion: permiso.identificadorAccion || '',
                roleId: permiso.role?.rolId || permiso.role?.id || permiso.roleId || permiso.rolId || '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [permiso, visible]);

    const set = (field: keyof PermisoForm, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        await onSave(form);
    };

    const rolOptions = roles.map(r => ({ label: r.nombreRol, value: r.rolId || r.id }));

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="Cancelar" outlined onClick={onHide} disabled={loading}
                style={{ borderColor: COLORS.gray300, color: COLORS.gray600 }} />
            <Button
                label={isEdit ? 'Guardar cambios' : 'Crear permiso'}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                onClick={handleSave}
                disabled={loading || !form.nombreAccion.trim() || !form.identificadorAccion.trim() || !form.roleId}
                style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-key" style={{ color: COLORS.red }} />
                    <span className="font-bold text-900">{isEdit ? 'Editar Permiso' : 'Nuevo Permiso'}</span>
                </div>
            }
            footer={footer}
            style={{ width: '520px', maxWidth: '95vw' }}
            modal
            draggable={false}
        >
            <div className="flex flex-column gap-4 pt-2">
                {/* Información del permiso */}
                <div>
                    <div className="text-xs font-bold uppercase mb-3"
                        style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                        Información del permiso
                    </div>
                    <div className="flex flex-column gap-3">
                        <div>
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Nombre de la acción <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <InputText
                                value={form.nombreAccion}
                                onChange={e => set('nombreAccion', e.target.value)}
                                placeholder="Ej: Ver prospectos"
                                style={fieldStyle}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                                Identificador de acción <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <InputText
                                value={form.identificadorAccion}
                                onChange={e => set('identificadorAccion', e.target.value)}
                                placeholder="Ej: prospect.read"
                                style={fieldStyle}
                            />
                            <p className="text-xs mt-1 m-0" style={{ color: COLORS.gray400 }}>
                                Usa formato <code>modulo.accion</code>, ej: <code>prospect.read</code>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Rol asignado */}
                <div>
                    <div className="text-xs font-bold uppercase mb-3"
                        style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                        Asignación de rol
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                            Rol <span style={{ color: COLORS.red }}>*</span>
                        </label>
                        <Dropdown
                            value={form.roleId}
                            onChange={e => set('roleId', e.value)}
                            options={rolOptions}
                            placeholder="Seleccionar rol"
                            style={{ width: '100%', borderRadius: '8px' }}
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default PermisoModal;
