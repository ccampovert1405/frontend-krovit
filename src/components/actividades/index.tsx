import React, { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import {
    PageHeader,
    KPICard,
    IconBox
} from '@/components/ui';
import { COLORS } from '@/utils/constants';
import { NuevaActividadModal } from './NuevaActividadModal';
import { DetalleActividadModal } from './DetalleActividadModal';
import { apiGetActividades, ActividadAPI } from '@/services/api';

// ═══════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════════
const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

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

const isSameDay = (d1: Date, d2: Date) => {
    if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
};

const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    try {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
};

// ═══════════════════════════════════════════════════════════
// ACTIVIDADES PAGE
// ═══════════════════════════════════════════════════════════
export const ActividadesPage: React.FC = () => {
    const [view, setView] = useState<'Día' | 'Semana' | 'Mes'>('Mes');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [modalVisible, setModalVisible] = useState(false);
    const [detailVisible, setDetailVisible] = useState(false);
    const [selectedActividad, setSelectedActividad] = useState<ActividadAPI | null>(null);
    const [actividades, setActividades] = useState<ActividadAPI[]>([]);

    const fetchActividades = async () => {
        try {
            const data = await apiGetActividades();
            setActividades(data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    useEffect(() => {
        fetchActividades();
    }, []);

    const handleActivityClick = (actividad: ActividadAPI) => {
        setSelectedActividad(actividad);
        setDetailVisible(true);
    };

    const handleEdit = (actividad: ActividadAPI) => {
        setSelectedActividad(actividad);
        setDetailVisible(false);
        setModalVisible(true);
    };

    const handleNewActivity = () => {
        setSelectedActividad(null);
        setModalVisible(true);
    };

    const getStats = () => {
        let periodActividades = actividades;
        if (view === 'Mes') {
            periodActividades = actividades.filter(a => {
                const d = new Date(a.fecha_inicio);
                return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            });
        } else if (view === 'Semana') {
            const start = new Date(currentDate);
            const day = start.getDay();
            const diff = start.getDate() - (day === 0 ? 6 : day - 1);
            start.setDate(diff);
            start.setHours(0,0,0,0);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            periodActividades = actividades.filter(a => {
                const d = new Date(a.fecha_inicio);
                return d >= start && d < end;
            });
        } else {
            periodActividades = actividades.filter(a => isSameDay(new Date(a.fecha_inicio), currentDate));
        }

        return {
            total: periodActividades.length,
            llamadas: periodActividades.filter(a => a.tipo === 'LLAMADA').length,
            videollamadas: periodActividades.filter(a => a.tipo === 'VIDEOLLAMADA').length,
            visitas: periodActividades.filter(a => a.tipo === 'VISITA' || a.tipo === 'VISITA TERRENO').length,
            reuniones: periodActividades.filter(a => a.tipo === 'REUNION').length
        };
    };

    const stats = getStats();

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'Mes') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else if (view === 'Semana') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'Mes') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else if (view === 'Semana') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getHeaderTitle = () => {
        if (view === 'Mes') {
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        } else if (view === 'Semana') {
            const start = new Date(currentDate);
            const day = start.getDay();
            const diff = start.getDate() - (day === 0 ? 6 : day - 1);
            start.setDate(diff);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            
            if (start.getMonth() === end.getMonth()) {
                return `${start.getDate()} - ${end.getDate()} ${monthNames[start.getMonth()]} ${start.getFullYear()}`;
            }
            return `${start.getDate()} ${monthNames[start.getMonth()].substring(0,3)} - ${end.getDate()} ${monthNames[end.getMonth()].substring(0,3)} ${start.getFullYear()}`;
        } else {
            const monthName = monthNames[currentDate.getMonth()] || '';
            return `${currentDate.getDate()} de ${monthName}, ${currentDate.getFullYear()}`;
        }
    };

    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startingDay = firstDay.getDay();
        if (startingDay === 0) startingDay = 7; // Adjust to Monday start
        
        const daysArray: { day: number, month: number, year: number, isCurrentMonth: boolean }[] = [];
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDay - 1; i > 0; i--) {
            daysArray.push({ day: prevMonthLastDay - i + 1, month: month - 1, year: year, isCurrentMonth: false });
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            daysArray.push({ day: i, month: month, year: year, isCurrentMonth: true });
        }
        
        const totalSlots = daysArray.length > 35 ? 42 : 35;
        const nextMonthDays = totalSlots - daysArray.length;
        for (let i = 1; i <= nextMonthDays; i++) {
            daysArray.push({ day: i, month: month + 1, year: year, isCurrentMonth: false });
        }
        
        const rows = [];
        for (let i = 0; i < daysArray.length; i += 7) {
            rows.push(daysArray.slice(i, i + 7));
        }
        return rows;
    };

    const getWeekDays = () => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - (day === 0 ? 6 : day - 1);
        start.setDate(diff);
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    return (
        <div style={{ padding: '0 10px' }}>
            <PageHeader title="Actividades" subtitle="Calendario de actividades">
                <Button
                    label="Nueva Actividad"
                    icon="pi pi-plus"
                    className="btn-brand"
                    onClick={handleNewActivity}
                />
            </PageHeader>

            {/* Navigation Header */}
            <div style={{
                background: COLORS.white,
                borderRadius: '16px',
                padding: '16px 24px',
                border: `1.5px solid ${COLORS.gray100}`,
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }} className="flex-wrap gap-3">
                <div className="flex align-items-center gap-3">
                    <div className="flex align-items-center gap-3">
                        <Button 
                            icon="pi pi-chevron-left" 
                            text 
                            className="p-button-rounded p-button-secondary" 
                            style={{ width: '32px', height: '32px', backgroundColor: COLORS.gray50 }} 
                            onClick={handlePrev}
                        />
                        <span className="text-900 font-bold mx-2" style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center' }}>
                            {getHeaderTitle()}
                        </span>
                        <Button 
                            icon="pi pi-chevron-right" 
                            text 
                            className="p-button-rounded p-button-secondary" 
                            style={{ width: '32px', height: '32px', backgroundColor: COLORS.gray50 }} 
                            onClick={handleNext}
                        />
                    </div>
                    <Button 
                        label="Hoy" 
                        style={{ backgroundColor: '#FFF0F0', color: COLORS.red, border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: 600 }} 
                        onClick={handleToday}
                    />
                </div>

                <div className="flex gap-1 ml-auto" style={{ backgroundColor: COLORS.gray50, padding: '4px', borderRadius: '12px' }}>
                    {(['Mes', 'Semana', 'Día'] as const).map(v => (
                        <Button
                            key={v}
                            label={v}
                            onClick={() => setView(v)}
                            className="p-button-sm border-none"
                            style={{
                                backgroundColor: view === v ? COLORS.red : 'transparent',
                                color: view === v ? COLORS.white : COLORS.gray500,
                                borderRadius: '10px',
                                fontWeight: 600,
                                padding: '8px 20px',
                                boxShadow: view === v ? `0 4px 12px ${COLORS.red}30` : 'none'
                            }}
                            icon={v === 'Mes' ? 'pi pi-calendar' : v === 'Semana' ? 'pi pi-chart-bar' : 'pi pi-clock'}
                        />
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid mb-4">
                <div className="col-12 md:col-3">
                    <KPICard icon="pi-calendar" label="TOTAL" value={stats.total} color={COLORS.red} />
                </div>
                <div className="col-12 md:col-3">
                    <KPICard icon="pi-phone" label="LLAMADAS" value={stats.llamadas} color={COLORS.blue} />
                </div>
                <div className="col-12 md:col-3">
                    <KPICard icon="pi-video" label="VIDEOLLAMADAS" value={stats.videollamadas} color={COLORS.yellow} />
                </div>
                <div className="col-12 md:col-3">
                    <KPICard icon="pi-map-marker" label="VISITAS" value={stats.visitas} color={COLORS.green} />
                </div>
            </div>

            {/* Calendar Card */}
            <div style={{
                background: COLORS.white,
                borderRadius: '24px',
                padding: '30px',
                border: `1.5px solid ${COLORS.gray100}`,
                marginBottom: '40px'
            }}>
                {view === 'Mes' ? (
                    <>
                        <div className="grid mb-2">
                            {days.map(d => (
                                <div key={d} className="col text-center py-2 font-bold text-600 text-sm">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: `1px solid ${COLORS.gray100}`, borderLeft: `1px solid ${COLORS.gray100}` }}>
                            {getCalendarDays().map((row, ri) => (
                                <div key={ri} className="grid m-0">
                                    {row.map((dayObj, di) => {
                                        const cellDate = new Date(dayObj.year, dayObj.month, dayObj.day);
                                        const isToday = isSameDay(cellDate, new Date());
                                        const activitiesOnDay = actividades.filter(a => isSameDay(new Date(a.fecha_inicio), cellDate));

                                        return (
                                            <div
                                                key={di}
                                                className="col p-0"
                                                style={{
                                                    height: '140px',
                                                    borderRight: `1px solid ${COLORS.gray100}`,
                                                    borderBottom: `1px solid ${COLORS.gray100}`,
                                                    backgroundColor: !dayObj.isCurrentMonth ? COLORS.gray50 : (isToday ? `${COLORS.red}05` : COLORS.white),
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                <div className="p-2">
                                                    <div className="flex justify-content-between align-items-center mb-1">
                                                        <span className={`text-xs font-bold ${dayObj.isCurrentMonth ? 'text-700' : 'text-300'}`} style={{
                                                            backgroundColor: isToday ? COLORS.red : 'transparent',
                                                            color: isToday ? COLORS.white : 'inherit',
                                                            borderRadius: '50%',
                                                            width: isToday ? '20px' : 'auto',
                                                            height: isToday ? '20px' : 'auto',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {dayObj.day}
                                                        </span>
                                                    </div>
                                                    {activitiesOnDay.map((a, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleActivityClick(a);
                                                            }}
                                                            style={{ 
                                                                backgroundColor: `${getColorByTipo(a.tipo)}15`,
                                                                borderLeft: `3px solid ${getColorByTipo(a.tipo)}`,
                                                                padding: '4px 6px',
                                                                borderRadius: '4px',
                                                                marginBottom: '4px',
                                                                fontSize: '0.7rem',
                                                                cursor: 'pointer'
                                                            }}
                                                            className="flex align-items-center gap-2 hover:surface-100 transition-colors transition-duration-150"
                                                        >
                                                            <i className={`${getIconByTipo(a.tipo)}`} style={{ fontSize: '0.65rem', color: getColorByTipo(a.tipo) }} />
                                                            <span className="text-900 font-bold truncate" style={{ maxWidth: '80%' }}>{a.titulo}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </>
                ) : view === 'Semana' ? (
                    <div className="grid">
                        {getWeekDays().map((date, idx) => {
                            const isToday = isSameDay(date, new Date());
                            const activitiesOnDay = actividades.filter(a => isSameDay(new Date(a.fecha_inicio), date));
                            return (
                                <div key={idx} className="col border-right-1 border-gray-100" style={{ minHeight: '400px' }}>
                                    <div className={`text-center py-3 mb-3 ${isToday ? 'bg-red-50' : ''}`} style={{ borderRadius: '12px' }}>
                                        <div className="text-500 font-bold mb-1 text-sm">{days[idx]}</div>
                                        <div className={`text-xl font-bold ${isToday ? 'text-red-500' : 'text-900'}`}>{date.getDate()}</div>
                                    </div>
                                    <div className="px-2">
                                        {activitiesOnDay.length > 0 ? (
                                            activitiesOnDay.map((a, aidx) => (
                                                <div 
                                                    key={aidx}
                                                    onClick={() => handleActivityClick(a)}
                                                    style={{ 
                                                        backgroundColor: `${getColorByTipo(a.tipo)}15`,
                                                        borderLeft: `3px solid ${getColorByTipo(a.tipo)}`,
                                                        padding: '10px 12px',
                                                        borderRadius: '10px',
                                                        marginBottom: '10px',
                                                        cursor: 'pointer'
                                                    }}
                                                    className="flex flex-column gap-1 hover:surface-100 transition-colors"
                                                >
                                                    <div className="flex align-items-center gap-2">
                                                        <i className={`${getIconByTipo(a.tipo)}`} style={{ fontSize: '0.8rem', color: getColorByTipo(a.tipo) }} />
                                                        <span className="text-900 font-bold text-sm">{a.titulo}</span>
                                                    </div>
                                                    <span className="text-600 text-xs">
                                                        {formatTime(a.fecha_inicio)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-400 py-4 text-xs italic">Sin actividades</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-column gap-3 p-4">
                        <div className="flex align-items-center gap-3 mb-4">
                            <div className="flex flex-column">
                                <span className="text-900 font-bold text-2xl">{currentDate.getDate()}</span>
                                <span className="text-500 font-semibold">{monthNames[currentDate.getMonth()] || ''}</span>
                            </div>
                            <div style={{ width: '1.5px', height: '3rem', backgroundColor: COLORS.gray200, margin: '0 16px' }}></div>
                            <span className="text-700 font-bold text-xl">{days[(currentDate.getDay() + 6) % 7] || ''}</span>
                        </div>
                        
                        <div className="grid">
                            <div className="col-12 lg:col-8">
                                <h3 className="text-900 font-bold mb-4">Actividades del Día</h3>
                                {actividades.filter(a => isSameDay(new Date(a.fecha_inicio), currentDate)).length > 0 ? (
                                    actividades.filter(a => isSameDay(new Date(a.fecha_inicio), currentDate)).map((a, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handleActivityClick(a)}
                                            style={{ 
                                                backgroundColor: COLORS.white,
                                                border: `1px solid ${COLORS.gray100}`,
                                                borderLeft: `4px solid ${getColorByTipo(a.tipo)}`,
                                                padding: '20px',
                                                borderRadius: '16px',
                                                marginBottom: '16px',
                                                cursor: 'pointer'
                                            }}
                                            className="flex align-items-center justify-content-between hover:surface-50 transition-colors"
                                        >
                                            <div className="flex align-items-center gap-4">
                                                <IconBox 
                                                    icon={getIconByTipo(a.tipo).replace('pi ', '')} 
                                                    size="48px" 
                                                    iconSize="1.5rem" 
                                                    color={getColorByTipo(a.tipo)} 
                                                    bg={`${getColorByTipo(a.tipo)}10`} 
                                                />
                                                <div className="flex flex-column gap-1">
                                                    <span className="text-900 font-bold text-lg">{a.titulo || 'Sin título'}</span>
                                                    <div className="flex align-items-center gap-3 text-500 text-sm">
                                                        <span>
                                                            <i className="pi pi-clock mr-2" />
                                                            {formatTime(a.fecha_inicio)}
                                                            {a.fecha_fin && ` - ${formatTime(a.fecha_fin)}`}
                                                        </span>
                                                        {a.ubicacion_link && <span><i className="pi pi-map-marker mr-2" />{a.ubicacion_link}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button icon="pi pi-chevron-right" text className="p-button-rounded p-button-secondary" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center py-8 bg-gray-50 border-round-xl border-dashed border-2 border-300">
                                        <i className="pi pi-calendar-times text-4xl text-300 mb-3" />
                                        <span className="text-500 font-semibold">No hay actividades programadas para hoy</span>
                                        <Button label="Crear Nueva Actividad" icon="pi pi-plus" className="p-button-text p-button-danger mt-3" onClick={handleNewActivity} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <NuevaActividadModal
                visible={modalVisible}
                onHide={() => {
                    setModalVisible(false);
                    setSelectedActividad(null);
                }}
                onSave={() => fetchActividades()}
                actividadToEdit={selectedActividad}
            />

            <DetalleActividadModal
                visible={detailVisible}
                onHide={() => {
                    setDetailVisible(false);
                    setSelectedActividad(null);
                }}
                actividad={selectedActividad}
                onEdit={handleEdit}
                onDeleteSuccess={fetchActividades}
            />
        </div>
    );
};

export default ActividadesPage;
