import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FormField, ModalSectionHeader, IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';

interface NuevaTareaModalProps {
    visible: boolean;
    onHide: () => void;
    onSave?: (tarea: any) => void;
    prospectos?: any[];
    oportunidades?: any[];
}

export const NuevaTareaModal: React.FC<NuevaTareaModalProps> = ({ visible, onHide, onSave, prospectos = [], oportunidades = [] }) => {
    const [tarea, setTarea] = useState({
        titulo: '',
        descripcion: '',
        prioridad: 'Media',
        tipo: 'Llamada',
        fecha: null as Date | null,
        hora: null as Date | null,
        recordatorio: 'Sin recordatorio',
        contacto: '',
        clienteId: null,
        oportunidadId: null,
        estado: 'PENDIENTE'
    });

    const prioridades = [
        { label: 'Alta', value: 'Alta', color: COLORS.red },
        { label: 'Media', value: 'Media', color: COLORS.yellow },
        { label: 'Baja', value: 'Baja', color: COLORS.green }
    ];

    const recordatorios = [
        { label: 'Sin recordatorio', value: 'Sin recordatorio' },
        { label: '1 hora antes', value: '1 hora antes' },
        { label: '4 horas antes', value: '4 horas antes' },
        { label: '8 horas antes', value: '8 horas antes' },
        { label: '1 día antes', value: '1 día antes' }
    ];

    const itemTemplateRecordatorio = (option: any) => {
        if (option.value === 'Sin recordatorio') {
            return <span>{option.label}</span>;
        }
        return (
            <div className="flex align-items-center">
                <i className="pi pi-clock mr-2" style={{ color: COLORS.redLight, fontSize: '0.9rem' }}></i>
                <span>{option.label}</span>
            </div>
        );
    };
    const tipos = [
        { label: 'Llamada', value: 'Llamada', icon: 'pi-phone', color: COLORS.purple },
        { label: 'Reunión', value: 'Reunión', icon: 'pi-users', color: COLORS.blue },
        { label: 'Correo', value: 'Correo', icon: 'pi-envelope', color: COLORS.gray500 }
    ];
    const estados = [
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'En Seguimiento', value: 'EN SEGUIMIENTO' },
        { label: 'Finalizado', value: 'FINALIZADO' }
    ];

    const itemTemplatePrioridad = (option: any) => {
        return (
            <div className="flex align-items-center">
                <div className="mr-2" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: option.color }}></div>
                <span>{option.label}</span>
            </div>
        );
    };

    const valueTemplatePrioridad = (option: any, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-center">
                    <div className="mr-2" style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: option.color }}></div>
                    <span>{option.label}</span>
                </div>
            );
        }
        return <span>{props.placeholder}</span>;
    };

    const itemTemplateTipo = (option: any) => {
        return (
            <div className="flex align-items-center">
                <i className={`pi ${option.icon} mr-2`} style={{ color: option.color }}></i>
                <span>{option.label}</span>
            </div>
        );
    };

    const valueTemplateTipo = (option: any, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-center">
                    <i className={`pi ${option.icon} mr-2`} style={{ color: option.color }}></i>
                    <span>{option.label}</span>
                </div>
            );
        }
        return <span>{props.placeholder}</span>;
    };

    const headerElement = (
        <div className="flex align-items-center gap-3">
            <IconBox icon="pi-check-square" size="45px" iconSize="1.5rem" color={COLORS.red} bg={`${COLORS.red}15`} />
            <div>
                <h2 className="m-0 text-900 font-bold text-xl">Nueva Tarea</h2>
                <span className="text-500 text-sm font-medium">Crea una nueva tarea</span>
            </div>
        </div>
    );

    const footerElement = (
        <div className="flex justify-content-end gap-3 pt-3 border-top-1 border-gray-100">
            <Button
                label="Cancelar"
                onClick={onHide}
                className="p-button-outlined"
                style={{ color: COLORS.red, borderColor: COLORS.red, borderRadius: '8px', padding: '10px 24px', fontWeight: 600 }}
            />
            <Button
                label="Crear Tarea"
                icon="pi pi-plus"
                onClick={() => {
                    const payload = {
                        titulo: tarea.titulo,
                        descripcion: tarea.descripcion,
                        prioridad: tarea.prioridad.toLowerCase(),
                        tipo: tarea.tipo.toLowerCase(),
                        fecha: tarea.fecha ? tarea.fecha.toISOString().split('T')[0] : '',
                        hora: tarea.hora ? `${tarea.hora.getHours().toString().padStart(2, '0')}:${tarea.hora.getMinutes().toString().padStart(2, '0')}` : '',
                        recordatorio: tarea.recordatorio,
                        contacto: tarea.contacto,
                        cliente_id: tarea.clienteId,
                        oportunidad_id: tarea.oportunidadId,
                        estado: tarea.estado
                    };
                    if (onSave) onSave(payload);
                    onHide();
                }}
                className="btn-brand"
                style={{ borderRadius: '8px', padding: '10px 24px' }}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerElement}
            footer={footerElement}
            style={{ width: '650px' }}
            breakpoints={{ '960px': '75vw', '641px': '100%' }}
            className="p-fluid custom-dialog"
            pt={{
                header: { className: 'pb-0 border-none' },
                content: { className: 'pt-4 pb-0' }
            }}
        >
            <div className="flex flex-column gap-4">
                {/* ─── Información de la Tarea ─── */}
                <div>
                    <ModalSectionHeader icon="pi-check-square" title="Información de la Tarea" />

                    <div className="flex flex-column gap-3 mt-3">
                        <FormField label="Título" required>
                            <InputText
                                value={tarea.titulo}
                                onChange={(e) => setTarea({ ...tarea, titulo: e.target.value })}
                                placeholder="Título de la tarea"
                                className="w-full"
                            />
                        </FormField>

                        <FormField label="Descripción">
                            <InputTextarea
                                value={tarea.descripcion}
                                onChange={(e) => setTarea({ ...tarea, descripcion: e.target.value })}
                                rows={3}
                                placeholder="Descripción..."
                                className="w-full"
                            />
                        </FormField>

                        <div className="flex gap-3">
                            <div className="flex-1">
                                <FormField label="Prioridad">
                                    <Dropdown
                                        value={tarea.prioridad}
                                        options={prioridades}
                                        onChange={(e) => setTarea({ ...tarea, prioridad: e.value })}
                                        itemTemplate={itemTemplatePrioridad}
                                        valueTemplate={valueTemplatePrioridad}
                                        className="w-full"
                                    />
                                </FormField>
                            </div>
                            <div className="flex-1">
                                <FormField label="Tipo">
                                    <Dropdown
                                        value={tarea.tipo}
                                        options={tipos}
                                        onChange={(e) => setTarea({ ...tarea, tipo: e.value })}
                                        itemTemplate={itemTemplateTipo}
                                        valueTemplate={valueTemplateTipo}
                                        className="w-full"
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Programación ─── */}
                <div>
                    <ModalSectionHeader icon="pi-calendar" title="Programación" />

                    <div className="flex gap-3 mt-3">
                        <div className="flex-1">
                            <FormField label="Fecha">
                                <Calendar
                                    value={tarea.fecha}
                                    onChange={(e) => setTarea({ ...tarea, fecha: e.value as Date })}
                                    placeholder="mm/dd/yyyy"
                                    showIcon
                                    className="w-full"
                                    pt={{
                                        input: { className: 'w-full', style: { paddingRight: '2.5rem' } },
                                        dropdownButton: {
                                            root: { className: 'absolute right-0 bg-transparent border-none h-full z-1', style: { width: '3rem', color: '#1F2937' } }
                                        }
                                    }}
                                />
                            </FormField>
                        </div>
                        <div className="flex-1">
                            <FormField label="Hora">
                                <Calendar
                                    value={tarea.hora}
                                    onChange={(e) => setTarea({ ...tarea, hora: e.value as Date })}
                                    timeOnly
                                    placeholder="--:--"
                                    showIcon
                                    icon={() => <i className="pi pi-clock" />}
                                    className="w-full"
                                    pt={{
                                        input: { className: 'w-full', style: { paddingRight: '2.5rem' } },
                                        dropdownButton: {
                                            root: { className: 'absolute right-0 bg-transparent border-none h-full z-1', style: { width: '3rem', color: '#1F2937' } }
                                        }
                                    }}
                                />
                            </FormField>
                        </div>
                        <div className="flex-1">
                            <FormField label="Recordatorio">
                                <Dropdown
                                    value={tarea.recordatorio}
                                    options={recordatorios}
                                    onChange={(e) => setTarea({ ...tarea, recordatorio: e.value })}
                                    itemTemplate={itemTemplateRecordatorio}
                                    className={`w-full ${tarea.recordatorio !== 'Sin recordatorio' ? 'border-red-500' : ''}`}
                                />
                            </FormField>
                        </div>
                    </div>
                </div>

                {/* ─── Asociaciones ─── */}
                <div>
                    <ModalSectionHeader icon="pi-users" title="Asociaciones (Opcional)" />

                    <div className="p-3 mb-3 border-round-md flex align-items-center gap-3 text-sm text-600" style={{ backgroundColor: '#fffdf0', border: '1px solid #ffea8a' }}>
                        <i className="pi pi-lightbulb text-yellow-500" />
                        <span>Puedes asociar esta tarea a un cliente y/o oportunidad para mejor seguimiento.</span>
                    </div>

                    <div className="flex flex-column gap-3">
                        <FormField label="Contacto (texto libre)">
                            <InputText
                                value={tarea.contacto}
                                onChange={(e) => setTarea({ ...tarea, contacto: e.target.value })}
                                placeholder="Nombre del contacto..."
                                className="w-full"
                            />
                        </FormField>

                        <div className="flex flex-column md:flex-row gap-3">
                            <div className="flex-1">
                                <FormField label="Asociar a Cliente">
                                    <Dropdown
                                        value={tarea.clienteId}
                                        options={prospectos}
                                        onChange={(e) => setTarea({ ...tarea, clienteId: e.value })}
                                        placeholder="Seleccionar cliente (opcional)..."
                                        className="w-full"
                                        filter
                                    />
                                </FormField>
                            </div>
                            <div className="flex-1">
                                <FormField label="Asociar a Oportunidad">
                                    <Dropdown
                                        value={tarea.oportunidadId}
                                        options={oportunidades}
                                        onChange={(e) => setTarea({ ...tarea, oportunidadId: e.value })}
                                        placeholder="Seleccionar oportunidad (opcional)..."
                                        className="w-full"
                                        filter
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <FormField label="Estado">
                            <Dropdown
                                value={tarea.estado}
                                options={estados}
                                onChange={(e) => setTarea({ ...tarea, estado: e.value })}
                                className="w-full"
                            />
                        </FormField>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};
