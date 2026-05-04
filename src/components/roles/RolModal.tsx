import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { RolAPI, PermisoAPI } from '@/services/api';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// ROL MODAL — Crear / Editar Rol
// ═══════════════════════════════════════════════════════════

export interface RolForm {
    nombreRol: string;
}

interface RolModalProps {
    visible: boolean;
    onHide: () => void;
    onSave: (data: RolForm) => Promise<void>;
    rol?: RolAPI | null;
    loading?: boolean;
}

const fieldStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray200}`,
    padding: '10px 14px',
    fontSize: '0.95rem',
    color: COLORS.gray700,
    outline: 'none',
};

export const RolModal: React.FC<RolModalProps> = ({
    visible, onHide, onSave, rol, loading = false,
}) => {
    const [nombreRol, setNombreRol] = useState('');
    const isEdit = !!rol;

    useEffect(() => {
        setNombreRol(rol?.nombreRol ?? '');
    }, [rol, visible]);

    const handleSave = async () => {
        await onSave({ nombreRol });
    };

    const permisos: PermisoAPI[] = rol?.permisos ?? [];

    const footer = (
        <div className="flex justify-content-end gap-2 pt-2">
            <Button label="Cancelar" outlined onClick={onHide} disabled={loading}
                style={{ borderColor: COLORS.gray300, color: COLORS.gray600 }} />
            <Button
                label={isEdit ? 'Guardar cambios' : 'Crear rol'}
                icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                onClick={handleSave}
                disabled={loading || !nombreRol.trim()}
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
                    <i className="pi pi-shield" style={{ color: COLORS.red }} />
                    <span className="font-bold text-900">{isEdit ? 'Editar Rol' : 'Nuevo Rol'}</span>
                </div>
            }
            footer={footer}
            style={{ width: '520px', maxWidth: '95vw' }}
            modal
            draggable={false}
        >
            <div className="flex flex-column gap-4 pt-2">
                {/* Nombre del Rol */}
                <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.gray600 }}>
                        Nombre del rol <span style={{ color: COLORS.red }}>*</span>
                    </label>
                    <InputText
                        value={nombreRol}
                        onChange={e => setNombreRol(e.target.value)}
                        placeholder="Ej: Administrador, Agente, Supervisor..."
                        style={fieldStyle}
                    />
                </div>

                {/* Permisos asignados (solo en modo edición si el rol tiene permisos) */}
                {isEdit && (
                    <div>
                        <div className="text-xs font-bold uppercase mb-3"
                            style={{ color: COLORS.gray400, letterSpacing: '1px' }}>
                            Permisos asignados ({permisos.length})
                        </div>
                        {permisos.length === 0 ? (
                            <div
                                className="text-center py-3"
                                style={{ color: COLORS.gray400, fontSize: '0.85rem', background: COLORS.gray50, borderRadius: '8px' }}
                            >
                                <i className="pi pi-info-circle mr-2" />
                                Sin permisos asignados aún
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {permisos.map(p => (
                                    <span
                                        key={p.id}
                                        className="px-2 py-1 border-round-lg text-xs font-semibold"
                                        title={p.identificadorAccion}
                                        style={{
                                            background: `${COLORS.purple}15`,
                                            color: COLORS.purple,
                                            border: `1px solid ${COLORS.purple}30`,
                                        }}
                                    >
                                        <i className="pi pi-key mr-1" style={{ fontSize: '0.65rem' }} />
                                        {p.nombreAccion}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default RolModal;
