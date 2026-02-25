import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressBar } from 'primereact/progressbar';
import {
  PageHeader,
  KPICard,
  SectionTitle,
  Avatar,
  CustomBadge,
  FilterTabs,
  EmptyState
} from '@/components/ui';
import { OPORTUNIDADES, TAREAS, ACTIVIDADES } from '@/data/sampleData';
import {
  COLORS,
  ETAPAS_OPORTUNIDAD,
  ETAPA_OPORTUNIDAD_COLORS,
  MESES_NOMBRES,
  PRIORIDAD_COLORS,
  TIPO_TAREA_ICONS
} from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// OPORTUNIDADES PAGE
// ═══════════════════════════════════════════════════════════
export const OportunidadesPage: React.FC = () => {
  const [filter, setFilter] = useState('Todas');

  const totalPipeline = OPORTUNIDADES.filter(o => !['Ganada', 'Perdida'].includes(o.etapa))
    .reduce((s, o) => s + o.valor, 0);
  const valorPonderado = OPORTUNIDADES.filter(o => !['Ganada', 'Perdida'].includes(o.etapa))
    .reduce((s, o) => s + o.valor * o.probabilidad / 100, 0);
  const ganadas = OPORTUNIDADES.filter(o => o.etapa === 'Ganada');
  const perdidas = OPORTUNIDADES.filter(o => o.etapa === 'Perdida');

  const grouped = ETAPAS_OPORTUNIDAD.reduce((acc, etapa) => {
    acc[etapa] = OPORTUNIDADES.filter(o => o.etapa === etapa);
    return acc;
  }, {} as Record<string, typeof OPORTUNIDADES>);

  return (
    <div>
      <PageHeader title="Oportunidades" subtitle="Pipeline de ventas y seguimiento de negocios">
        <Button label="Nueva Oportunidad" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <KPICard icon="pi-sync" label="Total Pipeline" value={`$${totalPipeline.toLocaleString()}`} color={COLORS.red} />
        <KPICard icon="pi-chart-line" label="Valor Ponderado" value={`$${Math.round(valorPonderado).toLocaleString()}`} color={COLORS.green} />
        <KPICard icon="pi-dollar" label="Oportunidades" value={OPORTUNIDADES.length} color={COLORS.blue} />
      </div>

      <Card className="mb-4 shadow-1">
        <div className="flex align-items-center gap-3 flex-wrap">
          <span className="p-input-icon-left flex-grow-1" style={{ minWidth: '200px' }}>
            <i className="pi pi-search" />
            <InputText placeholder="Buscar oportunidades..." className="w-full" />
          </span>
          <FilterTabs tabs={['Todas', ...ETAPAS_OPORTUNIDAD, 'Ganada', 'Perdida']} active={filter} setActive={setFilter} />
        </div>
      </Card>

      {/* Pipeline Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-2 mb-4">
        {ETAPAS_OPORTUNIDAD.map(etapa => {
          const ops = grouped[etapa] || [];
          const totalEtapa = ops.reduce((s, o) => s + o.valor, 0);
          return (
            <div key={etapa} style={{ minWidth: '250px', flex: 1 }}>
              <div className="flex align-items-center gap-2 mb-2">
                <div className="border-circle" style={{ width: '10px', height: '10px', backgroundColor: ETAPA_OPORTUNIDAD_COLORS[etapa] }} />
                <span className="font-bold text-900">{etapa}</span>
              </div>
              <div className="text-xs text-500 mb-3">{ops.length} oportunidades • ${totalEtapa.toLocaleString()}</div>
              {ops.map(op => (
                <Card key={op.id} className="shadow-1 mb-2">
                  <div className="font-semibold text-900 mb-1">{op.nombre}</div>
                  <div className="text-sm text-500 mb-2">{op.cliente}</div>
                  <div className="flex align-items-center gap-2 mb-2">
                    <span className="text-xs text-500">Probabilidad</span>
                    <span className="text-xs font-semibold">{op.probabilidad}%</span>
                  </div>
                  <ProgressBar value={op.probabilidad} showValue={false} style={{ height: '6px' }} />
                  <div className="flex justify-content-between align-items-center mt-3">
                    <span className="font-bold" style={{ color: COLORS.red }}>${op.valor.toLocaleString()}</span>
                    <span className="text-xs text-400 flex align-items-center gap-1">
                      <i className="pi pi-calendar" style={{ fontSize: '0.7rem' }} /> {op.fecha}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          );
        })}
      </div>

      {/* Ganadas y Perdidas */}
      <div className="grid">
        <div className="col-6">
          <Card className="shadow-1">
            <SectionTitle icon="pi-check-circle" title="Ganadas" badge={ganadas.length} />
            {ganadas.map(op => (
              <div key={op.id} className="flex justify-content-between py-2 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
                <div>
                  <div className="font-semibold text-900">{op.nombre}</div>
                  <div className="text-sm text-500">{op.cliente}</div>
                </div>
                <span className="font-bold" style={{ color: COLORS.green }}>${op.valor.toLocaleString()}</span>
              </div>
            ))}
          </Card>
        </div>
        <div className="col-6">
          <Card className="shadow-1">
            <SectionTitle icon="pi-times-circle" title="Perdidas" badge={perdidas.length} />
            {perdidas.length === 0 ? <EmptyState message="Sin oportunidades perdidas" /> : null}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAREAS PAGE
// ═══════════════════════════════════════════════════════════
export const TareasPage: React.FC = () => {
  const [filter, setFilter] = useState('Todas');
  const pendientes = TAREAS.filter(t => !t.completada);
  const completadas = TAREAS.filter(t => t.completada);
  const vencidas = pendientes.filter(() => true); // Simular todas vencidas

  return (
    <div>
      <PageHeader title="Tareas" subtitle="Gestiona todas tus tareas y seguimientos">
        <Button label="Nueva Tarea" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.red }}>{pendientes.length}</div>
          <div className="text-sm text-500">Pendientes</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.green }}>{completadas.length}</div>
          <div className="text-sm text-500">Completadas</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '150px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.yellow }}>{vencidas.length}</div>
          <div className="text-sm text-500">Vencidas</div>
        </Card>
      </div>

      <Card className="mb-4 shadow-1">
        <div className="flex align-items-center gap-3 flex-wrap">
          <span className="p-input-icon-left flex-grow-1" style={{ minWidth: '200px' }}>
            <i className="pi pi-search" />
            <InputText placeholder="Buscar tareas..." className="w-full" />
          </span>
          <FilterTabs tabs={['Todas', 'Pendientes', 'Hoy', 'Esta Semana', 'Vencidas', 'Completadas']} active={filter} setActive={setFilter} />
        </div>
      </Card>

      <Card className="shadow-1">
        {TAREAS.map(tarea => (
          <div key={tarea.id} className="flex align-items-start gap-3 py-3 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
            <input type="checkbox" checked={tarea.completada} readOnly className="mt-1" style={{ accentColor: COLORS.red, width: '18px', height: '18px' }} />
            <div className="flex-1">
              <div className="font-semibold text-900">{tarea.titulo}</div>
              <div className="text-sm text-500 mb-2">{tarea.descripcion}</div>
              <div className="flex gap-2 align-items-center flex-wrap">
                <CustomBadge color={PRIORIDAD_COLORS[tarea.prioridad].color} bg={PRIORIDAD_COLORS[tarea.prioridad].bg}>
                  {tarea.prioridad}
                </CustomBadge>
                <span className="text-xs text-400 flex align-items-center gap-1">
                  <i className="pi pi-clock" style={{ fontSize: '0.7rem' }} /> {tarea.fecha}
                </span>
                <span className="text-xs text-400 flex align-items-center gap-1">
                  <i className={`pi ${TIPO_TAREA_ICONS[tarea.tipo]}`} style={{ fontSize: '0.7rem' }} /> {tarea.contacto}
                </span>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ACTIVIDADES PAGE
// ═══════════════════════════════════════════════════════════
export const ActividadesPage: React.FC = () => {
  const [view, setView] = useState<'Día' | 'Semana' | 'Mes'>('Mes');
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calendar data
  const calendarRows = [
    [26, 27, 28, 29, 30, 31, 1],
    [2, 3, 4, 5, 6, 7, 8],
    [9, 10, 11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, 28, 1],
  ];

  return (
    <div>
      <PageHeader title="Actividades" subtitle="Calendario de actividades planificadas">
        <Button label="Nueva Actividad" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <Card className="shadow-1">
        <div className="flex justify-content-between align-items-center mb-4">
          <div className="flex align-items-center gap-2">
            <Button icon="pi pi-chevron-left" text className="p-button-sm" />
            <Button label="Hoy" outlined className="p-button-sm" />
            <Button icon="pi pi-chevron-right" text className="p-button-sm" />
            <span className="ml-3 text-xl font-bold text-900">Febrero 2026</span>
          </div>
          <div className="flex gap-1">
            {(['Día', 'Semana', 'Mes'] as const).map(v => (
              <Button
                key={v}
                label={v}
                className="p-button-sm"
                outlined={view !== v}
                onClick={() => setView(v)}
                style={view === v ? { backgroundColor: COLORS.gray800, borderColor: COLORS.gray800 } : {}}
              />
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid mb-4" style={{ borderBottom: `1px solid ${COLORS.gray200}` }}>
          {days.map(d => (
            <div key={d} className="col text-center py-2 font-semibold text-500 text-sm" style={{ borderBottom: `1px solid ${COLORS.gray200}` }}>
              {d}
            </div>
          ))}
        </div>

        {calendarRows.map((row, ri) => (
          <div key={ri} className="grid" style={{ minHeight: '80px', borderBottom: `1px solid ${COLORS.gray100}` }}>
            {row.map((day, di) => {
              const isCurrentMonth = (ri === 0 && day > 20) || (ri === 4 && day === 1) ? false : true;
              const isToday = day === 2 && ri === 1;
              return (
                <div
                  key={di}
                  className="col p-2"
                  style={{
                    backgroundColor: isToday ? COLORS.redLight : 'transparent',
                    borderRight: di < 6 ? `1px solid ${COLORS.gray100}` : 'none'
                  }}
                >
                  <span
                    className={`text-sm ${isCurrentMonth ? 'text-900' : 'text-300'}`}
                    style={{
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? COLORS.red : undefined
                    }}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        <div className="mt-4 pt-3 border-top-1" style={{ borderColor: COLORS.gray200 }}>
          <div className="font-semibold text-900 mb-2">Lunes 2 De Febrero</div>
          <EmptyState message="Sin actividades programadas para este día" icon="pi-calendar" />
        </div>
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// PLANIFICACION PAGE
// ═══════════════════════════════════════════════════════════
export const PlanificacionPage: React.FC = () => {
  const [filter, setFilter] = useState('Todas');
  const visitas = ACTIVIDADES.filter(a => a.tipo === 'Visita Terreno').length;
  const digitales = ACTIVIDADES.filter(a => ['Videollamada', 'Llamada'].includes(a.tipo)).length;

  return (
    <div>
      <PageHeader title="Planificación" subtitle="Programa visitas, llamadas y actividades con prospectos">
        <Button label="Nueva Actividad" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.red }}>0</div>
          <div className="text-sm text-500">Hoy</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.yellow }}>0</div>
          <div className="text-sm text-500">Mañana</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.green }}>{visitas}</div>
          <div className="text-sm text-500">Visitas</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.blue }}>{digitales}</div>
          <div className="text-sm text-500">Digitales</div>
        </Card>
      </div>

      <Card className="mb-4 shadow-1">
        <FilterTabs tabs={['Todas', 'Hoy', 'Mañana', 'Esta Semana', 'Presenciales', 'Digitales']} active={filter} setActive={setFilter} />
      </Card>

      <Card className="shadow-1">
        {ACTIVIDADES.map(act => {
          const iconMap: Record<string, string> = { 'Llamada': 'pi-phone', 'Videollamada': 'pi-video', 'Visita Terreno': 'pi-map-marker', 'Reunión': 'pi-users' };
          const colorMap: Record<string, string> = { 'Llamada': COLORS.blue, 'Videollamada': COLORS.yellow, 'Visita Terreno': COLORS.green, 'Reunión': COLORS.purple };
          return (
            <div key={act.id} className="mb-4">
              <div className="text-sm font-semibold text-500 uppercase mb-2">{act.dia}</div>
              <div className="flex align-items-center gap-3 p-3 border-round-lg" style={{ backgroundColor: COLORS.gray50, borderLeft: `4px solid ${colorMap[act.tipo]}` }}>
                <div className="flex align-items-center justify-content-center border-round-lg" style={{ width: '40px', height: '40px', backgroundColor: `${colorMap[act.tipo]}18` }}>
                  <i className={`pi ${iconMap[act.tipo]}`} style={{ color: colorMap[act.tipo], fontSize: '1.1rem' }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-900">{act.titulo}</div>
                  <div className="text-sm text-500 flex align-items-center gap-2">
                    <i className="pi pi-clock" style={{ fontSize: '0.7rem' }} /> {act.hora}
                    <i className="pi pi-user" style={{ fontSize: '0.7rem', marginLeft: '8px' }} /> {act.contacto}
                  </div>
                  {act.ubicacion && (
                    <div className="text-xs text-400 mt-1">
                      <i className="pi pi-map-marker" style={{ fontSize: '0.7rem' }} /> {act.ubicacion}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <CustomBadge color={colorMap[act.tipo]} bg={`${colorMap[act.tipo]}18`}>{act.tipo}</CustomBadge>
                  <div className="text-xs text-400 mt-1">{act.duracion}</div>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// FORECAST PAGE
// ═══════════════════════════════════════════════════════════
export const ForecastPage: React.FC = () => {
  const pipelinePonderado = OPORTUNIDADES
    .filter(o => !['Ganada', 'Perdida'].includes(o.etapa))
    .reduce((s, o) => s + o.valor * o.probabilidad / 100, 0);

  const ganadas = OPORTUNIDADES.filter(o => o.etapa === 'Ganada');
  const cerradoMes = ganadas.reduce((s, o) => s + o.valor, 0);

  // Datos para gráfico de etapas (simplificado)
  const etapaData = ETAPAS_OPORTUNIDAD.map(etapa => ({
    etapa,
    count: OPORTUNIDADES.filter(o => o.etapa === etapa).length,
    color: ETAPA_OPORTUNIDAD_COLORS[etapa]
  }));

  return (
    <div>
      <PageHeader title="Forecast" subtitle="Proyección de ventas y análisis de rendimiento">
        <Button label="Definir Meta" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <KPICard icon="pi-chart-line" label="Pipeline Ponderado" value={`$${Math.round(pipelinePonderado).toLocaleString()}`} color={COLORS.red} />
        <KPICard icon="pi-calendar" label="Esperado este mes" value="$0" color={COLORS.blue} />
        <KPICard icon="pi-dollar" label="Cerrado este mes" value={`$${cerradoMes.toLocaleString()}`} color={COLORS.green} />
        <KPICard icon="pi-sync" label="Meta Oportunidades" value={`${ganadas.length} / —`} color={COLORS.purple} />
      </div>

      <div className="grid">
        <div className="col-6">
          <Card className="shadow-1 h-full">
            <SectionTitle icon="pi-chart-bar" title="Ingresos por Mes" />
            {/* Simplified Bar Chart */}
            <div className="flex align-items-end gap-2 mt-4" style={{ height: '200px' }}>
              {['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb'].map((mes, i) => {
                const heights = [0, 0, 0, 0, 65, 0];
                return (
                  <div key={mes} className="flex-1 flex flex-column align-items-center">
                    <div
                      className="w-full border-round-top"
                      style={{
                        height: `${heights[i] * 3}px`,
                        backgroundColor: heights[i] > 0 ? COLORS.red : COLORS.gray200,
                        minHeight: '4px'
                      }}
                    />
                    <span className="text-xs text-500 mt-2">{mes}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="col-6">
          <Card className="shadow-1 h-full">
            <SectionTitle icon="pi-chart-line" title="Oportunidades vs Metas" />
            {/* Simplified Line representation */}
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <div className="text-4xl font-bold text-900">{OPORTUNIDADES.length}</div>
                <div className="text-sm text-500">Oportunidades totales</div>
                <div className="flex gap-3 mt-3 justify-content-center">
                  <div className="flex align-items-center gap-1">
                    <div className="border-circle" style={{ width: '8px', height: '8px', backgroundColor: COLORS.red }} />
                    <span className="text-xs">Generadas</span>
                  </div>
                  <div className="flex align-items-center gap-1">
                    <div className="border-circle" style={{ width: '8px', height: '8px', backgroundColor: COLORS.green }} />
                    <span className="text-xs">Ganadas</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-6">
          <Card className="shadow-1">
            <SectionTitle icon="pi-sync" title="Pipeline por Etapa" />
            {/* Donut Chart representation */}
            <div className="flex align-items-center justify-content-center gap-4" style={{ minHeight: '180px' }}>
              <div className="relative">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="55" fill="none" stroke={COLORS.gray200} strokeWidth="20" />
                  {etapaData.map((item, i) => {
                    const total = etapaData.reduce((s, d) => s + d.count, 0);
                    const percentage = total > 0 ? item.count / total : 0;
                    const offset = etapaData.slice(0, i).reduce((s, d) => s + (total > 0 ? d.count / total : 0), 0);
                    return (
                      <circle
                        key={item.etapa}
                        cx="70"
                        cy="70"
                        r="55"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="20"
                        strokeDasharray={`${percentage * 345} 345`}
                        strokeDashoffset={-offset * 345}
                        transform="rotate(-90 70 70)"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="flex flex-column gap-2">
                {etapaData.map(item => (
                  <div key={item.etapa} className="flex align-items-center gap-2">
                    <div className="border-circle" style={{ width: '10px', height: '10px', backgroundColor: item.color }} />
                    <span className="text-sm">{item.etapa}: {item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="col-6">
          <Card className="shadow-1">
            <SectionTitle icon="pi-calendar" title="Historial de Metas" />
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between align-items-center p-3 border-round-lg" style={{ backgroundColor: COLORS.gray50 }}>
                <div>
                  <div className="font-semibold text-900">Febrero 2025</div>
                  <div className="text-xs text-500">Meta: 20 oportunidades • $200,000</div>
                </div>
                <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>0 / 20</CustomBadge>
              </div>
              <div className="flex justify-content-between align-items-center p-3 border-round-lg" style={{ backgroundColor: COLORS.gray50 }}>
                <div>
                  <div className="font-semibold text-900">Enero 2025</div>
                  <div className="text-xs text-500">Meta: 15 oportunidades • $150,000</div>
                </div>
                <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>0 / 15</CustomBadge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
