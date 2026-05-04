import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { IconBox } from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { ActividadAPI, apiDeleteActividad } from '@/services/api';
import { useNotification } from '@/context/NotificationContext';

interface DetalleActividadModalProps {
    visible: boolean;
    onHide: () => void;
    actividad: ActividadAPI | null;
    onEdit: (actividad: ActividadAPI) => void;
    onDeleteSuccess: () => void;
}

export const DetalleActividadModal: React.FC<DetalleActividadModalProps> = ({
    visible,
    onHide,
    actividad,
    onEdit,
    onDeleteSuccess
}) => {
    if (!actividad) return null;

    const { showSuccess, showError } = useNotification();

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
            try {
                await apiDeleteActividad(actividad.id);
                showSuccess('Actividad eliminada correctamente');
                onDeleteSuccess();
                onHide();
            } catch (error) {
                console.error('Error deleting activity:', error);
                showError('Error al eliminar la actividad');
            }
        }
    };

    const getIconByTipo = (tipo: string) => {
        switch (tipo?.toUpperCase()) {
            case 'LLAMADA': return 'pi pi-phone';
            case 'VIDEOLLAMADA': return 'pi pi-video';
            case 'VISITA':
            case 'VISITA TERRENO': return 'pi pi-map-marker';
            case 'REUNION': return 'pi pi-users';
            default: return 'pi pi-calendar';
        }
    };

    const getColorByTipo = (tipo: string) => {
        switch (tipo?.toUpperCase()) {
            case 'LLAMADA': return '#D53F8C';
            case 'VIDEOLLAMADA': return '#EAB308';
            case 'VISITA':
            case 'VISITA TERRENO': return '#22C55E';
            case 'REUNION': return '#3B82F6';
            default: return COLORS.red;
        }
    };

    const formatTime = (t: string) => {
        if (!t) return '';
        const p = t.split(':');
        return p.length >= 2 ? `${p[0]}:${p[1]}` : t;
    };

    const tipoColor = getColorByTipo(actividad.tipo);
    const tipoLabel = actividad.tipo ? actividad.tipo.charAt(0) + actividad.tipo.slice(1).toLowerCase() : 'Actividad';

    const headerContent = (
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '100%' }}>
            <IconBox icon={getIconByTipo(actividad.tipo).replace('pi ', '')} color={COLORS.red} bg="#FFF0F0" size="44px" iconSize="1.3rem" />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1a1a1a' }}>{actividad.titulo}</span>
        </div>
    );

    const footerContent = (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
            <Button
                label="Cerrar"
                onClick={onHide}
                className="p-button-outlined"
                style={{ color: COLORS.red, borderColor: COLORS.red, borderRadius: '12px', padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem' }}
            />
            <Button
                label="Editar"
                icon="pi pi-pencil"
                onClick={() => onEdit(actividad)}
                className="p-button-outlined"
                style={{ color: COLORS.red, borderColor: COLORS.red, borderRadius: '12px', padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem' }}
            />
            <Button
                label="Eliminar"
                icon="pi pi-trash"
                onClick={handleDelete}
                style={{ backgroundColor: COLORS.red, borderColor: COLORS.red, borderRadius: '12px', padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}
            />
        </div>
    );

    return (
        <Dialog
            visible={visible}
            onHide={onHide}
            header={headerContent}
            footer={footerContent}
            style={{ width: '450px', borderRadius: '20px' }}
            breakpoints={{ '960px': '90vw', '641px': '100%' }}
            className="modal-premium-detail"
            modal
            draggable={false}
            closable={true}
            contentStyle={{ overflow: 'hidden' }}
            pt={{
                header: { style: { padding: '18px 24px', borderBottom: '1px solid #f0f0f0' } },
                content: { style: { padding: '20px 24px' } },
                footer: { style: { padding: '16px 24px', borderTop: '1px solid #f0f0f0' } },
                closeButton: { style: { width: '32px', height: '32px' } }
            }}
        >
            {/* Tipo badge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <IconBox icon={getIconByTipo(actividad.tipo).replace('pi ', '')} color={tipoColor} bg={`${tipoColor}15`} size="32px" iconSize="1.1rem" />
                <span style={{ backgroundColor: `${tipoColor}15`, color: tipoColor, padding: '4px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {tipoLabel}
                </span>
            </div>

            {/* Details rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Fecha */}
                <div className="detail-row">
                    <IconBox icon="pi-calendar" color="#9CA3AF" bg="transparent" size="28px" iconSize="1.3rem" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500 }}>Fecha</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>{actividad.fecha_inicio}</div>
                    </div>
                </div>

                {/* Horario */}
                <div className="detail-row">
                    <IconBox icon="pi-clock" color="#9CA3AF" bg="transparent" size="28px" iconSize="1.3rem" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500 }}>Horario</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>
                            {formatTime(actividad.hora_inicio)} - {formatTime(actividad.hora_fin)}
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div className="detail-row">
                    <IconBox icon="pi-users" color="#9CA3AF" bg="transparent" size="28px" iconSize="1.3rem" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500 }}>Contacto</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>{actividad.contacto}</div>
                    </div>
                </div>

                {/* Ubicación */}
                <div className="detail-row">
                    <IconBox icon="pi-map-marker" color="#9CA3AF" bg="transparent" size="28px" iconSize="1.3rem" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: 500 }}>Ubicación</div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>
                            {actividad.ubicacion_link || 'Sin ubicación'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Notas */}
            {actividad.notas && (
                <div style={{ marginTop: '18px', padding: '14px', borderRadius: '12px', backgroundColor: '#f9fafb', border: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF', fontWeight: 500, marginBottom: '4px' }}>Notas</div>
                    <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500, lineHeight: 1.5 }}>{actividad.notas}</div>
                </div>
            )}
        </Dialog>
    );
};
