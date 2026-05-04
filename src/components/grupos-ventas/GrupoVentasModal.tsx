import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { FormField, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { GrupoVentasAPI, UsuarioAPI } from '@/services/api';

// ═══════════════════════════════════════════════════════════
// MODAL PARA CREAR/EDITAR GRUPOS DE VENTAS
// ═══════════════════════════════════════════════════════════

export interface GrupoVentasForm {
    nombre: string;
    descripcion: string;
    jefeComercialId: string;
    agenteIds: string[];
}

interface Props {
    visible: boolean;
    onHide: () => void;
    onSave: (form: GrupoVentasForm) => Promise<void>;
    grupo?: GrupoVentasAPI | null;
    usuarios: UsuarioAPI[];
    loading?: boolean;
}

export const GrupoVentasModal: React.FC<Props> = ({
    visible,
    onHide,
    onSave,
    grupo,
    usuarios,
    loading = false
}) => {
    const [form, setForm] = useState<GrupoVentasForm>({
        nombre: '',
        descripcion: '',
        jefeComercialId: '',
        agenteIds: []
    });

    useEffect(() => {
        if (grupo) {
            setForm({
                nombre: grupo.nombre || '',
                descripcion: grupo.descripcion || '',
                jefeComercialId: grupo.jefeComercialId || '',
                agenteIds: grupo.agentes?.map(a => a.userID) || []
            });
        } else {
            setForm({
                nombre: '',
                descripcion: '',
                jefeComercialId: '',
                agenteIds: []
            });
        }
    }, [grupo, visible]);

    const handleChange = (field: keyof GrupoVentasForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    // Filtrar solo usuarios que pueden ser agentes (ej: Agente Comercial, Jefe Comercial)
    // O simplemente mostrar todos los usuarios si el backend lo permite
    // En este CRM, solemos mostrar todos y el admin elige.
    const agentOptions = usuarios.map(u => ({
        label: `${u.nombres} ${u.apellidos}`,
        value: u.userID
    }));



    const handleClose = () => {
        setForm({ nombre: '', descripcion: '', jefeComercialId: '', agenteIds: [] });
        onHide();
    };

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-3">
                    <IconBox 
                        icon="pi-sitemap" 
                        size="52px" 
                        iconSize="1.4rem" 
                        color={COLORS.red} 
                        bg={COLORS.redLight} 
                        rounded={true}
                        style={{ borderRadius: '14px' }}
                    />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.gray800 }}>
                            {grupo ? 'Editar Grupo de Ventas' : 'Nuevo Grupo de Ventas'}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                            {grupo ? 'Actualiza la información del equipo comercial' : 'Crea un nuevo equipo para gestionar prospectos'}
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
                        label={loading ? (grupo ? 'Actualizando...' : 'Creando...') : (grupo ? 'Guardar Cambios' : 'Crear Grupo')}
                        icon={loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
                        iconPos="left"
                        onClick={handleSubmit}
                        disabled={loading || !form.nombre}
                        style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '10px', fontWeight: 600, padding: '12px 28px', fontSize: '0.95rem' }}
                        pt={{ icon: { style: { fontSize: '1rem' } } }}
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
                <FormField label="Nombre del Grupo" required>
                    <InputText
                        value={form.nombre}
                        onChange={(e) => handleChange('nombre', e.target.value)}
                        placeholder="Ej: Grupo Norte / Equipo A"
                        autoFocus
                    />
                </FormField>

                <FormField label="Jefe Comercial" required>
                    <Dropdown
                        value={form.jefeComercialId}
                        options={agentOptions}
                        onChange={(e) => handleChange('jefeComercialId', e.value)}
                        placeholder="Selecciona un jefe comercial"
                        filter
                        showClear
                    />
                </FormField>

                <FormField label="Descripción">
                    <InputTextarea
                        value={form.descripcion}
                        onChange={(e) => handleChange('descripcion', e.target.value)}
                        placeholder="Breve descripción del grupo..."
                        rows={3}
                        style={{ resize: 'none' }}
                    />
                </FormField>

                <div className="mt-2">
                    <FormField label="Asignar Agentes">
                        <MultiSelect
                            value={form.agenteIds}
                            options={agentOptions}
                            onChange={(e) => handleChange('agenteIds', e.value)}
                            placeholder="Selecciona los agentes"
                            filter
                            display="chip"
                            maxSelectedLabels={3}
                            emptyMessage="No se encontraron usuarios"
                        />
                        <small className="text-500 mt-2 block" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                            <i className="pi pi-info-circle mr-1" style={{ fontSize: '0.7rem' }} />
                            Los usuarios seleccionados podrán ser asignados a este grupo comercial.
                        </small>
                    </FormField>
                </div>
            </form>
        </Dialog>
    );
};
