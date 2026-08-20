import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { FormField, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { AgenciaAPI, UsuarioAPI } from '@/services/api';

export interface AgenciaForm {
    nombre: string;
    direccion: string;
    telefono: string;
    encargadoId: string | null;
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (form: AgenciaForm) => Promise<void>;
    agencia?: AgenciaAPI | null;
    usuarios: UsuarioAPI[];
    loading?: boolean;
}

export const AgenciaModal: React.FC<Props> = ({
    visible,
    onHide,
    onSave,
    agencia,
    usuarios,
    loading = false
}) => {
    const [form, setForm] = useState<AgenciaForm>({
        nombre: '',
        direccion: '',
        telefono: '',
        encargadoId: null
    });

    useEffect(() => {
        if (agencia) {
            setForm({
                nombre: agencia.nombre || '',
                direccion: agencia.direccion || '',
                telefono: agencia.telefono || '',
                encargadoId: agencia.encargadoId || null
            });
        } else {
            setForm({
                nombre: '',
                direccion: '',
                telefono: '',
                encargadoId: null
            });
        }
    }, [agencia, visible]);

    const handleChange = (field: keyof AgenciaForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    // Filter only managers with role "Gerente Comercial"
    const managerOptions = usuarios
        .filter(u => u.rol?.nombreRol === 'Gerente Comercial')
        .map(u => ({
            label: `${u.nombres} ${u.apellidos} (${u.correo || u.email || ''})`,
            value: u.userID
        }));

    const handleClose = () => {
        setForm({ nombre: '', direccion: '', telefono: '', encargadoId: null });
        onHide();
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-3">
                    <IconBox 
                        icon="pi-building" 
                        size="52px" 
                        iconSize="1.4rem" 
                        color={COLORS.red} 
                        bg={COLORS.redLight} 
                        rounded={true}
                        style={{ borderRadius: '14px' }}
                    />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                            {agencia ? 'Editar Agencia' : 'Nueva Agencia'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                            {agencia ? 'Actualiza la información de la sucursal' : 'Crea una nueva agencia para el equipo comercial'}
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
                        label={loading ? (agencia ? 'Actualizando...' : 'Creando...') : (agencia ? 'Guardar Cambios' : 'Crear Agencia')}
                        icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                        iconPos="left"
                        onClick={handleSubmit}
                        disabled={loading || !form.nombre}
                        style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
                    />
                </div>
            }
            style={{ width: '500px', borderRadius: '16px', overflow: 'hidden' }}
            modal
            className="p-fluid"
            headerStyle={{ borderBottom: 'none' }}
            contentStyle={{ borderTop: 'none', padding: '0 28px 8px' }}
            draggable={false}
            resizable={false}
        >
            <form onSubmit={handleSubmit} className="flex flex-column gap-3 mt-3">
                <FormField label="Nombre de la Agencia" required>
                    <InputText
                        value={form.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        placeholder="Ej: Agencia Garzota / Sucursal Centro"
                        autoFocus
                    />
                </FormField>

                <FormField label="Encargado (Gerente Comercial)">
                    <Dropdown
                        value={form.encargadoId}
                        options={managerOptions}
                        onChange={(e) => handleChange('encargadoId', e.value)}
                        placeholder="Selecciona un gerente comercial"
                        filter
                        showClear
                        emptyMessage="No hay gerentes comerciales registrados"
                    />
                </FormField>

                <FormField label="Teléfono de Contacto">
                    <InputText
                        value={form.telefono}
                        onChange={(e) => handleChange('telefono', e.target.value)}
                        placeholder="Ej: 0999999999 / (04) 222-3333"
                    />
                </FormField>

                <FormField label="Dirección">
                    <InputTextarea
                        value={form.direccion}
                        onChange={(e) => handleChange('direccion', e.target.value)}
                        placeholder="Dirección física completa..."
                        rows={3}
                        style={{ resize: 'none' }}
                    />
                </FormField>
            </form>
        </Dialog>
    );
};
