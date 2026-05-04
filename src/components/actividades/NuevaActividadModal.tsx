import React, { useState, useEffect } from 'react';
import { IconBox } from '@/components/ui';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { COLORS } from '@/utils/constants';
import { apiCreateActividad, apiUpdateActividad, ActividadAPI } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';

interface NuevaActividadModalProps {
    visible: boolean;
    onHide: () => void;
    onSave?: (actividad: any) => void;
    actividadToEdit?: ActividadAPI | null;
}

export const NuevaActividadModal: React.FC<NuevaActividadModalProps> = ({ 
    visible, 
    onHide, 
    onSave,
    actividadToEdit 
}) => {
    const { showSuccess, showError } = useNotification();
    const [actividad, setActividad] = useState({
        titulo: '',
        tipo: 'LLAMADA',
        fecha_inicio: null as Date | null,
        fecha_fin: null as Date | null,
        hora_inicio: null as Date | null,
        hora_fin: null as Date | null,
        contacto: '',
        ubicacion_link: '',
        notas: '',
    });

    useEffect(() => {
        if (visible && actividadToEdit) {
            const parseDate = (d: string) => d ? new Date(d + 'T00:00:00') : null;
            const parseTime = (t: string) => {
                if (!t) return null;
                const [h, m] = t.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d;
            };

            setActividad({
                titulo: actividadToEdit.titulo || '',
                tipo: actividadToEdit.tipo || 'LLAMADA',
                fecha_inicio: parseDate(actividadToEdit.fecha_inicio),
                fecha_fin: parseDate(actividadToEdit.fecha_fin),
                hora_inicio: parseTime(actividadToEdit.hora_inicio),
                hora_fin: parseTime(actividadToEdit.hora_fin),
                contacto: actividadToEdit.contacto || '',
                ubicacion_link: actividadToEdit.ubicacion_link || '',
                notas: actividadToEdit.notas || '',
            });
        } else if (visible) {
            setActividad({
                titulo: '',
                tipo: 'LLAMADA',
                fecha_inicio: null,
                fecha_fin: null,
                hora_inicio: null,
                hora_fin: null,
                contacto: '',
                ubicacion_link: '',
                notas: '',
            });
        }
    }, [visible, actividadToEdit]);

    const tiposIdx = [
        { label: 'Llamada', value: 'LLAMADA', icon: 'pi pi-phone', color: '#D53F8C' },
        { label: 'Videollamada', value: 'VIDEOLLAMADA', icon: 'pi pi-video', color: '#4A5568' },
        { label: 'Visita', value: 'VISITA', icon: 'pi pi-map-marker', color: '#E53E3E' },
        { label: 'Reunión', value: 'REUNION', icon: 'pi pi-users', color: '#4A5568' }
    ];

    const itemTemplateTipo = (option: any) => {
        if (!option) return null;
        return (
            <div className="flex align-items-center">
                <i className={`${option.icon} mr-3`} style={{ color: option.color, fontSize: '1.2rem', width: '20px', textAlign: 'center' }}></i>
                <span className="text-900">{option.label}</span>
            </div>
        );
    };

    const valueTemplateTipo = (selectedOption: any, props: any) => {
        if (selectedOption) {
            const val = typeof selectedOption === 'object' ? selectedOption.value : selectedOption;
            const opt = tiposIdx.find(t => t.value === val);
            
            if (opt) {
                return (
                    <div className="flex align-items-center h-full">
                        <i className={`${opt.icon} mr-3`} style={{ color: opt.color, fontSize: '1.2rem', width: '20px', textAlign: 'center' }}></i>
                        <span className="text-900 font-medium">{opt.label}</span>
                    </div>
                );
            }
        }
        return <span className="text-500">{props?.placeholder || 'Selecciona un tipo'}</span>;
    };

    const headerElement = (
        <div className="flex align-items-center gap-3 w-full">
            <IconBox icon="pi-calendar" size="52px" iconSize="1.5rem" color={COLORS.red} bg="#FFF0F0" rounded={true} className="border-round-xl" />
            <div className="flex-grow-1">
                <h2 className="m-0 text-900 font-bold text-xl" style={{ letterSpacing: '-0.3px' }}>
                    {actividadToEdit ? 'Editar Actividad' : 'Nueva Actividad'}
                </h2>
                <span className="text-500 text-sm font-medium">
                    {actividadToEdit ? 'Actualiza los detalles de la actividad' : 'Programa una actividad'}
                </span>
            </div>
        </div>
    );

    const formatSubmitData = (): Partial<ActividadAPI> => {
        const formatDate = (date: Date | null) => date ? date.toISOString().split('T')[0] : '';
        const formatTime = (date: Date | null) => date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

        return {
            titulo: actividad.titulo,
            tipo: actividad.tipo,
            fecha_inicio: formatDate(actividad.fecha_inicio),
            fecha_fin: formatDate(actividad.fecha_fin),
            hora_inicio: formatTime(actividad.hora_inicio),
            hora_fin: formatTime(actividad.hora_fin),
            contacto: actividad.contacto,
            ubicacion_link: actividad.ubicacion_link,
            notas: actividad.notas
        };
    };

    const handleSave = async () => {
        const data = formatSubmitData();
        try {
            if (actividadToEdit) {
                const res = await apiUpdateActividad(actividadToEdit.id, data);
                showSuccess('Actividad actualizada correctamente');
                if (onSave) onSave(res);
            } else {
                const res = await apiCreateActividad(data);
                showSuccess('Actividad creada correctamente');
                if (onSave) onSave(res);
            }
            onHide();
        } catch (error) {
            console.error('Error saving activity:', error);
            showError('Error al guardar la actividad');
        }
    };

    const footerElement = (
        <div className="flex justify-content-end gap-3 pt-3">
            <Button
                label="Cancelar"
                onClick={onHide}
                className="p-button-outlined"
                style={{ 
                    color: COLORS.red, 
                    borderColor: COLORS.red, 
                    borderRadius: '12px', 
                    padding: '14px 32px', 
                    fontWeight: 700,
                    fontSize: '0.95rem'
                }}
            />
            <Button
                label={actividadToEdit ? "Guardar Cambios" : "Crear Actividad"}
                icon={actividadToEdit ? "pi pi-check" : "pi pi-plus"}
                onClick={handleSave}
                className="btn-brand"
                style={{ 
                    borderRadius: '12px', 
                    padding: '14px 32px',
                    fontSize: '0.95rem',
                    fontWeight: 600
                }}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerElement}
            footer={footerElement}
            style={{ width: '580px' }}
            breakpoints={{ '960px': '85vw', '641px': '100%' }}
            className="p-fluid modal-premium"
            modal
            draggable={false}
            resizable={false}
            pt={{
                header: { style: { padding: '24px 30px', borderBottom: 'none' } },
                content: { style: { padding: '0 30px 20px' } },
                footer: { style: { padding: '0 30px 24px', borderTop: 'none' } },
                closeButton: { className: 'p-button-rounded p-button-text p-button-secondary' }
            }}
        >
            <div className="flex flex-column gap-3">
                <div>
                    <label className="block text-900 font-bold mb-2 text-sm">
                        Título <span style={{ color: COLORS.red }}>*</span>
                    </label>
                    <InputText
                        value={actividad.titulo}
                        onChange={(e) => setActividad({ ...actividad, titulo: e.target.value })}
                        placeholder="Título de la actividad"
                        className="w-full"
                        style={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 16px', borderRadius: '12px' }}
                    />
                </div>

                <div>
                    <label className="block text-900 font-bold mb-2 text-sm">
                        Tipo <span style={{ color: COLORS.red }}>*</span>
                    </label>
                    <Dropdown
                        value={actividad.tipo}
                        options={tiposIdx}
                        optionValue="value"
                        onChange={(e) => setActividad({ ...actividad, tipo: e.value })}
                        itemTemplate={itemTemplateTipo}
                        valueTemplate={valueTemplateTipo}
                        className="w-full"
                        style={{ height: '54px', borderRadius: '12px', background: '#fff', border: `1.5px solid ${COLORS.gray200}` }}
                        pt={{
                            input: { className: 'flex align-items-center', style: { paddingLeft: '20px' } },
                            trigger: { style: { width: '40px' } },
                            root: { className: 'surface-0' }
                        }}
                    />
                </div>

                <div className="mt-2">
                    <div className="flex align-items-center gap-3 mb-3">
                        <IconBox icon="pi-calendar" size="36px" iconSize="0.9rem" color={COLORS.red} bg="#FFF0F0" />
                        <span className="font-bold text-900" style={{ fontSize: '1.1rem' }}>Fechas</span>
                    </div>
                    
                    <div className="grid">
                        <div className="col-6">
                            <label className="block text-900 font-bold mb-2 text-sm">
                                Fecha Inicio <span style={{ color: COLORS.red }}>*</span>
                            </label>
                            <div className="relative w-full">
                                <Calendar
                                    value={actividad.fecha_inicio}
                                    onChange={(e) => setActividad({ ...actividad, fecha_inicio: e.value as Date })}
                                    placeholder="mm/dd/yyyy"
                                    className="w-full"
                                    inputStyle={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 40px 14px 16px', borderRadius: '12px' }}
                                />
                                <i 
                                    className="pi pi-calendar text-700 pointer-events-none" 
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }} 
                                />
                            </div>
                        </div>
                        <div className="col-6">
                            <label className="block text-900 font-bold mb-2 text-sm">Fecha Fin</label>
                            <div className="relative w-full">
                                <Calendar
                                    value={actividad.fecha_fin}
                                    onChange={(e) => setActividad({ ...actividad, fecha_fin: e.value as Date })}
                                    placeholder="mm/dd/yyyy"
                                    className="w-full"
                                    inputStyle={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 40px 14px 16px', borderRadius: '12px' }}
                                />
                                <i 
                                    className="pi pi-calendar text-700 pointer-events-none" 
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }} 
                                />
                            </div>
                        </div>
                        <div className="col-6 mt-1">
                            <label className="block text-900 font-bold mb-2 text-sm">Hora Inicio</label>
                            <div className="relative w-full">
                                <Calendar
                                    value={actividad.hora_inicio}
                                    onChange={(e) => setActividad({ ...actividad, hora_inicio: e.value as Date })}
                                    timeOnly
                                    placeholder="--:-- --"
                                    className="w-full"
                                    inputStyle={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 40px 14px 16px', borderRadius: '12px' }}
                                />
                                <i 
                                    className="pi pi-clock text-700 pointer-events-none" 
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }} 
                                />
                            </div>
                        </div>
                        <div className="col-6 mt-1">
                            <label className="block text-900 font-bold mb-2 text-sm">Hora Fin</label>
                            <div className="relative w-full">
                                <Calendar
                                    value={actividad.hora_fin}
                                    onChange={(e) => setActividad({ ...actividad, hora_fin: e.value as Date })}
                                    timeOnly
                                    placeholder="--:-- --"
                                    className="w-full"
                                    inputStyle={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 40px 14px 16px', borderRadius: '12px' }}
                                />
                                <i 
                                    className="pi pi-clock text-700 pointer-events-none" 
                                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2">
                    <div className="flex align-items-center gap-3 mb-3">
                        <IconBox icon="pi-users" size="36px" iconSize="0.9rem" color={COLORS.red} bg="#FFF0F0" />
                        <span className="font-bold text-900" style={{ fontSize: '1.1rem' }}>Detalles</span>
                    </div>
                    
                    <div className="grid">
                        <div className="col-6">
                            <label className="block text-900 font-bold mb-2 text-sm">Contacto</label>
                            <InputText
                                value={actividad.contacto}
                                onChange={(e) => setActividad({ ...actividad, contacto: e.target.value })}
                                placeholder="Nombre del contacto"
                                className="w-full"
                                style={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 16px', borderRadius: '12px' }}
                            />
                        </div>
                        <div className="col-6">
                            <label className="block text-900 font-bold mb-2 text-sm">Ubicación / Link</label>
                            <InputText
                                value={actividad.ubicacion_link}
                                onChange={(e) => setActividad({ ...actividad, ubicacion_link: e.target.value })}
                                placeholder="Dirección o enlace"
                                className="w-full"
                                style={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 16px', borderRadius: '12px' }}
                            />
                        </div>
                        <div className="col-12 mt-1">
                            <label className="block text-900 font-bold mb-2 text-sm">Notas</label>
                            <InputTextarea
                                value={actividad.notas}
                                onChange={(e) => setActividad({ ...actividad, notas: e.target.value })}
                                rows={3}
                                autoResize
                                placeholder="Notas adicionales..."
                                className="w-full"
                                style={{ border: `1.5px solid ${COLORS.gray200}`, padding: '14px 16px', borderRadius: '12px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};
