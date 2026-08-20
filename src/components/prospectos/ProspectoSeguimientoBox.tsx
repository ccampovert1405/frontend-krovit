import React, { useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Prospecto, Seguimiento, EstadoSeguimiento, EstadoOportunidadSeguimiento } from '@/types';
import { COLORS } from '@/utils/constants';
import { FormField, ModalSectionHeader, IconBox } from '@/components/ui';

interface Props {
    prospecto: Prospecto;
    onSaveSeguimiento: (prospectoId: string | number, data: Partial<Seguimiento>) => Promise<void>;
    loading?: boolean;
}

export const ProspectoSeguimientoBox: React.FC<Props> = ({ prospecto, onSaveSeguimiento, loading }) => {
    const seguimientos = prospecto.seguimientos || [];
    
    // Estados UI
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    
    // Estado del formulario
    const [form, setForm] = useState<Partial<Seguimiento>>({
        gestion_realizada: '',
        tipo_seguimiento: undefined,
        estado: EstadoOportunidadSeguimiento.EN_SEGUIMIENTO,
        fecha: undefined,
        hora: '',
        minuto: '',
        calificacion_oportunidad: ''
    });

    // Opciones para Dropdowns
    const TIPO_OPTS = Object.values(EstadoSeguimiento).map(val => ({ label: val, value: val }));
    const ESTADO_OPTS = Object.values(EstadoOportunidadSeguimiento).map(val => ({ label: val, value: val }));

    // Lógica de semáforo (horas transcurridas)
    const { semaforoColor, semaforoIcon } = useMemo(() => {
        const now = new Date().getTime();
        const createdTime = prospecto.created_at ? new Date(prospecto.created_at).getTime() : now;
        
        let lastActionTime = createdTime;
        if (seguimientos.length > 0) {
            const dates = seguimientos.map(s => new Date(s.fecha_registro).getTime());
            lastActionTime = Math.max(...dates);
        }

        const diffMs = now - lastActionTime;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours <= 24) {
            return { semaforoColor: '#22C55E', semaforoIcon: 'pi-check' };
        } else if (diffHours <= 48) {
            return { semaforoColor: '#F59E0B', semaforoIcon: 'pi-check' };
        } else if (diffHours <= 72) {
            return { semaforoColor: '#F97316', semaforoIcon: 'pi-exclamation-triangle' };
        } else {
            return { semaforoColor: '#EF4444', semaforoIcon: 'pi-exclamation-triangle' };
        }
    }, [prospecto, seguimientos]);

    const handleOpenNew = () => {
        resetForm();
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.tipo_seguimiento || !form.gestion_realizada) return;
        
        await onSaveSeguimiento(prospecto.id, {
            ...form,
            id: editingId || undefined
        });
        
        setShowModal(false);
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            gestion_realizada: '',
            tipo_seguimiento: undefined,
            estado: EstadoOportunidadSeguimiento.EN_SEGUIMIENTO,
            fecha: undefined,
            hora: '',
            minuto: '',
            calificacion_oportunidad: ''
        });
    };

    const formatDateToYYYYMMDD = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const startEdit = (seg: Seguimiento) => {
        setEditingId(seg.id);
        setForm({
            gestion_realizada: seg.gestion_realizada,
            tipo_seguimiento: seg.tipo_seguimiento,
            estado: seg.estado,
            fecha: seg.fecha,
            hora: seg.hora,
            minuto: seg.minuto,
            calificacion_oportunidad: seg.calificacion_oportunidad
        });
        setShowModal(true);
    };

    // Templates Tabla
    const dateTemplate = (seg: Seguimiento) => (
        <div className="flex flex-column">
            <span className="text-xs font-bold text-700">
                {new Date(seg.fecha_registro).toLocaleDateString()}
            </span>
            <span className="text-xs text-500">
                {new Date(seg.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );

    const typeTemplate = (seg: Seguimiento) => (
        <span className="font-bold text-sm" style={{ color: COLORS.gray700 }}>{seg.tipo_seguimiento}</span>
    );

    const statusTemplate = (seg: Seguimiento) => (
        <Tag 
            value={seg.estado} 
            style={{ 
                backgroundColor: seg.estado === EstadoOportunidadSeguimiento.CERRADA ? `${COLORS.green}15` : `${COLORS.blue}15`,
                color: seg.estado === EstadoOportunidadSeguimiento.CERRADA ? COLORS.green : COLORS.blue,
                fontSize: '0.65rem', 
                borderRadius: '6px',
                fontWeight: 700
            }}
        />
    );

    const actionTemplate = (seg: Seguimiento) => (
        <Button 
            icon="pi pi-pencil" 
            text 
            rounded 
            className="p-button-plain" 
            style={{ width: '32px', height: '32px' }}
            onClick={(e) => { e.stopPropagation(); startEdit(seg); }} 
        />
    );

    return (
        <div style={{ background: COLORS.white }}>
            <div className="flex align-items-center justify-content-between mb-4 mt-2">
                <div className="flex align-items-center gap-3">
                    <IconBox 
                        icon={semaforoIcon}
                        color="white"
                        bg={semaforoColor}
                        size="36px"
                        iconSize="0.9rem"
                        style={{ boxShadow: `0 4px 12px ${semaforoColor}80` }}
                    />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: COLORS.black, letterSpacing: '-0.5px' }}>Historial de Seguimientos</div>
                        <div className="flex align-items-center gap-2 mt-1">
                            <span style={{ fontSize: '0.8rem', color: COLORS.gray500, fontWeight: 600 }}>
                                {seguimientos.length} gestiones realizadas
                            </span>
                        </div>
                    </div>
                </div>
                
                <Button 
                    label="Nueva Gestión" 
                    icon="pi pi-plus" 
                    className="btn-brand"
                    onClick={handleOpenNew}
                />
            </div>

            {/* Tabla de Historial */}
            <div className="border-round-xl overflow-hidden border-1 border-100">
                <DataTable 
                    value={seguimientos} 
                    className="datatable-premium-small"
                    emptyMessage="No hay gestiones registradas aún."
                    rows={5}
                    paginator={seguimientos.length > 5}
                    size="small"
                    rowHover
                    onRowClick={(e) => startEdit(e.data as Seguimiento)}
                    pt={{
                        headerRow: { style: { background: '#F9FAFB' } },
                        bodyRow: { style: { cursor: 'pointer' } }
                    }}
                >
                    <Column header="FECHA" body={dateTemplate} style={{ width: '130px' }} />
                    <Column header="RESULTADO" body={typeTemplate} style={{ width: '180px' }} />
                    <Column field="gestion_realizada" header="GESTIÓN" bodyClassName="text-xs text-600 line-height-3" />
                    <Column header="ESTADO" body={statusTemplate} style={{ width: '130px' }} />
                    <Column body={actionTemplate} style={{ width: '60px' }} />
                </DataTable>
            </div>

            {/* Modal de Registro/Edición */}
            <Dialog 
                header={
                    <div className="flex align-items-center gap-3">
                        <IconBox 
                            icon={editingId ? "pi-pencil" : "pi-plus"} 
                            color={COLORS.red} 
                            bg={COLORS.redLight} 
                            size="48px"
                            iconSize="1.2rem"
                        />
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: COLORS.black, letterSpacing: '-0.3px' }}>
                                {editingId ? "Editar Gestión" : "Registrar Nueva Gestión"}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: COLORS.gray500, marginTop: '2px', fontWeight: 500 }}>
                                {editingId ? "Actualiza los detalles de este seguimiento" : "Añade un nuevo registro de contacto al historial"}
                            </div>
                        </div>
                    </div>
                }
                visible={showModal} 
                onHide={() => setShowModal(false)}
                style={{ width: '580px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-3 pt-2">
                        <Button 
                            label="Cancelar" 
                            onClick={() => setShowModal(false)} 
                            outlined
                            style={{ borderColor: COLORS.gray200, color: COLORS.gray600, borderRadius: '12px', fontWeight: 600 }}
                        />
                        <Button 
                            label={editingId ? "Actualizar Gestión" : "Guardar Gestión"} 
                            icon="pi pi-check" 
                            className="btn-brand"
                            loading={loading}
                            onClick={handleSave}
                            disabled={!form.tipo_seguimiento || !form.gestion_realizada}
                            style={{ margin: 0 }}
                        />
                    </div>
                }
            >
                <div className="grid mt-3">
                    <div className="col-12">
                        <FormField label="Gestión Realizada" required>
                            <InputTextarea 
                                value={form.gestion_realizada} 
                                onChange={(e) => setForm({...form, gestion_realizada: e.target.value})}
                                rows={4}
                                autoResize
                                placeholder="Describe brevemente lo conversado con el prospecto, compromisos o dudas..."
                                className="w-full"
                            />
                        </FormField>
                    </div>
                    
                    <div className="col-6">
                        <FormField label="Resultado / Tipo" required>
                            <Dropdown 
                                value={form.tipo_seguimiento} 
                                options={TIPO_OPTS} 
                                onChange={(e) => setForm({...form, tipo_seguimiento: e.value})}
                                placeholder="Seleccione..."
                                className="w-full"
                            />
                        </FormField>
                    </div>

                    <div className="col-6">
                        <FormField label="Estado del Seguimiento">
                            <Dropdown 
                                value={form.estado} 
                                options={ESTADO_OPTS} 
                                onChange={(e) => setForm({...form, estado: e.value})}
                                className="w-full"
                            />
                        </FormField>
                    </div>

                    <div className="col-12 mt-3 mb-1">
                        <ModalSectionHeader icon="pi-calendar-plus" title="Programación y Calificación" />
                    </div>

                    <div className="col-6">
                        <FormField label="Próxima Fecha">
                            <Calendar 
                                value={form.fecha ? new Date(form.fecha + 'T00:00:00') : null} 
                                onChange={(e) => setForm({...form, fecha: e.value ? formatDateToYYYYMMDD(e.value as Date) : undefined})}
                                dateFormat="yy-mm-dd"
                                showIcon
                                placeholder="Programar fecha"
                                className="w-full"
                            />
                        </FormField>
                    </div>

                    <div className="col-6">
                        <FormField label="Hora Programada">
                            <div className="flex gap-2 align-items-center">
                                <InputText 
                                    value={form.hora} 
                                    onChange={(e) => setForm({...form, hora: e.target.value.replace(/\D/g,'').substring(0, 2)})}
                                    placeholder="HH"
                                    className="w-full text-center"
                                    maxLength={2}
                                />
                                <span className="font-bold">:</span>
                                <InputText 
                                    value={form.minuto} 
                                    onChange={(e) => setForm({...form, minuto: e.target.value.replace(/\D/g,'').substring(0, 2)})}
                                    placeholder="mm"
                                    className="w-full text-center"
                                    maxLength={2}
                                />
                            </div>
                        </FormField>
                    </div>

                    <div className="col-12">
                        <FormField label="Calificación / Nivel de Interés">
                            <InputText 
                                value={form.calificacion_oportunidad} 
                                onChange={(e) => setForm({...form, calificacion_oportunidad: e.target.value})}
                                placeholder="Ej: Alta (A+), Muy interesado..."
                                className="w-full"
                            />
                        </FormField>
                    </div>
                </div>
            </Dialog>

            <style>{`
                .datatable-premium-small .p-datatable-thead > tr > th {
                    background: #F9FAFB;
                    color: ${COLORS.gray500};
                    font-size: 0.7rem;
                    font-weight: 800;
                    letter-spacing: 0.8px;
                    border-bottom: 1px solid ${COLORS.gray100};
                    padding: 14px 12px;
                    text-transform: uppercase;
                }
                .datatable-premium-small .p-datatable-tbody > tr {
                    background: #ffffff;
                    border-bottom: 1px solid ${COLORS.gray50};
                    transition: all 0.2s;
                }
                .datatable-premium-small .p-datatable-tbody > tr:hover {
                    background: #FEF2F2 !important;
                }
                .datatable-premium-small .p-datatable-tbody > tr > td {
                    padding: 14px 12px;
                }
                .p-dialog-header .icon-box-standard {
                    margin: 0 !important;
                }
                .icon-box-standard i {
                    margin: 0 !important;
                }
            `}</style>
        </div>
    );
};
