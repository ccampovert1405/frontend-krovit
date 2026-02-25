import React from 'react';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import {
  KPICard,
  SectionTitle,
  Avatar,
  CustomBadge,
  PageHeader,
  EmptyState
} from '@/components/ui';
import { useFilters, useFilteredData, useKPIs, useAIDAFunnel } from '@/hooks';
import { AGENTES } from '@/data/sampleData';
import { COLORS, MESES_NOMBRES, ETAPA_COLORS, PRIORIDAD_COLORS, TIPO_TAREA_ICONS } from '@/utils/constants';
import { PageKey, Tarea, Oportunidad } from '@/types';

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

interface DashboardPageProps {
  setActive: (page: PageKey) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActive }) => {
  const {
    selectedMes,
    setSelectedMes,
    selectedAgente,
    setSelectedAgente,
    resetFilters,
    hasActiveFilters,
    mesActual,
  } = useFilters();

  const { prospectosFiltrados, oportunidadesFiltradas, tareasFiltradas } = useFilteredData({
    mes: selectedMes,
    agente: selectedAgente,
  });

  const kpis = useKPIs({
    prospectos: prospectosFiltrados,
    oportunidades: oportunidadesFiltradas,
  });

  const aidaFunnel = useAIDAFunnel(prospectosFiltrados);

  // Opciones para dropdowns
  const mesesDisponibles = MESES_NOMBRES.slice(0, mesActual + 1).map((mes, i) => ({
    label: `${mes} 2026`,
    value: i,
  }));

  const agentesOptions = [
    { label: 'Todos los agentes', value: 'Todos' },
    ...AGENTES.filter(a => a.activo).map(a => ({ label: a.nombre, value: a.nombre })),
  ];

  return (
    <div>
      {/* Header con filtros */}
      <PageHeader title="Dashboard" subtitle="Resumen de tu actividad comercial">
        <div className="flex gap-2 align-items-center flex-wrap">
          {/* Filtro Agente */}
          <div className="flex align-items-center gap-2">
            <div
              className="flex align-items-center justify-content-center border-round-lg"
              style={{ width: '32px', height: '32px', backgroundColor: COLORS.redLight }}
            >
              <i className="pi pi-users" style={{ color: COLORS.red, fontSize: '0.9rem' }} />
            </div>
            <Dropdown
              value={selectedAgente}
              options={agentesOptions}
              onChange={(e) => setSelectedAgente(e.value)}
              className="w-12rem"
              placeholder="Seleccionar agente"
            />
          </div>

          {/* Filtro Mes */}
          <div className="flex align-items-center gap-2">
            <div
              className="flex align-items-center justify-content-center border-round-lg"
              style={{ width: '32px', height: '32px', backgroundColor: COLORS.blueLight }}
            >
              <i className="pi pi-calendar" style={{ color: COLORS.blue, fontSize: '0.9rem' }} />
            </div>
            <Dropdown
              value={selectedMes}
              options={mesesDisponibles}
              onChange={(e) => setSelectedMes(e.value)}
              className="w-10rem"
              placeholder="Seleccionar mes"
            />
          </div>
        </div>
      </PageHeader>

      {/* Badges de filtro activo */}
      <div className="flex gap-2 mb-4 flex-wrap align-items-center">
        <span className="text-xs text-400">Mostrando:</span>
        <CustomBadge color={COLORS.red} bg={COLORS.redLight}>
          {MESES_NOMBRES[selectedMes]} 2026
        </CustomBadge>
        <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>
          {selectedAgente === 'Todos' ? 'Todos los agentes' : selectedAgente}
        </CustomBadge>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-xs bg-transparent border-none cursor-pointer font-semibold underline"
            style={{ color: COLORS.red }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <KPICard
          icon="pi-sync"
          label="PRODUCCIÓN"
          value={`${kpis.produccion}%`}
          sub={`${kpis.totalProspectos} de ${kpis.planificadas} planificadas`}
          trend={Number(kpis.produccion) > 15 ? 'up' : 'neutral'}
          trendLabel={Number(kpis.produccion) > 15 ? 'Buen ritmo' : 'En progreso'}
          color={COLORS.red}
        />
        <KPICard
          icon="pi-check-circle"
          label="EFICACIA"
          value={`${kpis.eficacia}%`}
          sub={`${kpis.ganadas} cerradas de ${kpis.totalOps}`}
          trend={Number(kpis.eficacia) > 25 ? 'up' : 'down'}
          trendLabel={`${kpis.ganadas} ganadas`}
          color={COLORS.green}
        />
        <KPICard
          icon="pi-dollar"
          label="CONTRIBUCIÓN"
          value={`${kpis.contribucion}%`}
          sub={`$${kpis.totalGanado.toLocaleString()} en ingresos`}
          trend={kpis.totalGanado > 0 ? 'up' : 'neutral'}
          trendLabel={`$${kpis.totalGanado.toLocaleString()}`}
          color={COLORS.blue}
        />
        <KPICard
          icon="pi-clock"
          label="CICLO DE VENTA"
          value={kpis.cicloVenta || '—'}
          sub={kpis.cicloVenta ? 'días promedio' : 'Sin datos'}
          trend={kpis.cicloVenta < 0 ? 'up' : 'neutral'}
          trendLabel={kpis.cicloVenta ? 'Óptimo' : '—'}
          color={COLORS.purple}
        />
      </div>

      <div className="flex gap-4 flex-wrap">
        {/* Left Column */}
        <div className="flex-grow-1" style={{ minWidth: '400px', flex: 2 }}>
          {/* Embudo AIDA */}
          <Card className="mb-3 shadow-1">
            <SectionTitle
              icon="pi-chart-bar"
              title="Embudo AIDA"
              action={() => setActive('prospectos')}
              actionLabel="Ver todos"
            />
            {prospectosFiltrados.length === 0 ? (
              <EmptyState message="No hay prospectos para este período" />
            ) : (
              <div className="flex gap-3">
                {aidaFunnel.map(({ etapa, count }) => (
                  <div key={etapa} className="flex-1">
                    <div
                      className="border-round mb-2"
                      style={{
                        height: '6px',
                        backgroundColor: ETAPA_COLORS[etapa],
                        opacity: 0.7
                      }}
                    />
                    <div className="text-xs text-500 uppercase font-semibold" style={{ letterSpacing: '0.5px' }}>
                      {etapa}
                    </div>
                    <div className="text-2xl font-bold text-900">{count}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Oportunidades Recientes */}
          <Card className="shadow-1">
            <SectionTitle
              icon="pi-sync"
              title="Oportunidades Recientes"
              action={() => setActive('oportunidades')}
              actionLabel="Ver todas"
            />
            {oportunidadesFiltradas.length === 0 ? (
              <EmptyState message="No hay oportunidades para este período" />
            ) : (
              oportunidadesFiltradas.map((op: Oportunidad) => (
                <div
                  key={op.id}
                  className="flex align-items-center justify-content-between py-3 border-bottom-1"
                  style={{ borderColor: COLORS.gray100 }}
                >
                  <div className="flex align-items-center gap-3">
                    <Avatar name={op.cliente} />
                    <div>
                      <div className="font-semibold text-900">{op.nombre}</div>
                      <div className="text-sm text-500">{op.cliente}</div>
                    </div>
                  </div>
                  <div className="flex align-items-center gap-3">
                    <span className="font-bold text-900">${op.valor.toLocaleString()}</span>
                    <CustomBadge color={op.color} bg={`${op.color}18`}>
                      {op.etapa}
                    </CustomBadge>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex-grow-1" style={{ minWidth: '280px', flex: 1 }}>
          {/* Tareas Pendientes */}
          <Card className="mb-3 shadow-1">
            <SectionTitle
              icon="pi-check-circle"
              title="Tareas Pendientes"
              badge={tareasFiltradas.filter(t => !t.completada).length}
            />
            {tareasFiltradas.length === 0 ? (
              <EmptyState message="No hay tareas para este período" />
            ) : (
              tareasFiltradas.map((tarea: Tarea) => (
                <div
                  key={tarea.id}
                  className="flex align-items-start gap-2 py-2 border-bottom-1"
                  style={{ borderColor: COLORS.gray100 }}
                >
                  <input type="checkbox" className="mt-1" style={{ accentColor: COLORS.red }} />
                  <div className="flex-1">
                    <div className="flex align-items-center gap-2">
                      <i
                        className={`pi ${TIPO_TAREA_ICONS[tarea.tipo]}`}
                        style={{
                          fontSize: '0.85rem',
                          color: tarea.tipo === 'llamada' ? COLORS.blue :
                            tarea.tipo === 'correo' ? COLORS.yellow :
                              tarea.tipo === 'visita' ? COLORS.green : COLORS.purple
                        }}
                      />
                      <span className="text-sm font-semibold text-900">{tarea.titulo}</span>
                    </div>
                    <div className="text-xs text-500 mt-1">{tarea.contacto}</div>
                    <div className="flex gap-2 mt-1 align-items-center">
                      <CustomBadge
                        color={PRIORIDAD_COLORS[tarea.prioridad].color}
                        bg={PRIORIDAD_COLORS[tarea.prioridad].bg}
                      >
                        {tarea.prioridad}
                      </CustomBadge>
                      <span className="text-xs text-400">⏰ Vencida</span>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button
              onClick={() => setActive('tareas')}
              className="w-full flex align-items-center justify-content-center gap-1 mt-3 py-2 bg-transparent border-none cursor-pointer text-sm font-semibold"
              style={{ color: COLORS.red }}
            >
              Ver todas las tareas <i className="pi pi-arrow-right" style={{ fontSize: '0.8rem' }} />
            </button>
          </Card>

          {/* Calendario Mini */}
          <Card className="shadow-1">
            <SectionTitle
              icon="pi-calendar"
              title="Calendario"
              badge={`${MESES_NOMBRES[selectedMes]} 2026`}
            />
            <MiniCalendar />
            <div className="mt-3 pt-2 border-top-1" style={{ borderColor: COLORS.gray100 }}>
              <div className="text-sm font-semibold text-600">lunes 2 de febrero</div>
              <div className="text-xs text-400 mt-1">Sin actividades programadas</div>
            </div>
            <button
              onClick={() => setActive('actividades')}
              className="w-full flex align-items-center justify-content-center gap-1 mt-2 py-2 bg-transparent border-none cursor-pointer text-sm font-semibold"
              style={{ color: COLORS.red }}
            >
              Ver calendario completo <i className="pi pi-arrow-right" style={{ fontSize: '0.8rem' }} />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Mini Calendar Component ───
const MiniCalendar: React.FC = () => {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const prevDays = [26, 27, 28, 29, 30, 31, 1];
  const rows = [[2, 3, 4, 5, 6, 7, 8], [9, 10, 11, 12, 13, 14, 15], [16, 17, 18, 19, 20, 21, 22], [23, 24, 25, 26, 27, 28, 0]];

  return (
    <div className="grid" style={{ gap: '2px' }}>
      {days.map(d => (
        <div key={d} className="col text-center text-xs text-400 font-semibold p-1">
          {d}
        </div>
      ))}
      {prevDays.map((d, i) => (
        <div
          key={`p${i}`}
          className="col text-center text-sm p-2 border-round"
          style={{
            color: d > 7 ? COLORS.gray300 : d === 2 ? COLORS.white : COLORS.gray700,
            backgroundColor: d === 2 ? COLORS.red : 'transparent',
            fontWeight: d === 2 ? 700 : 400
          }}
        >
          {d}
        </div>
      ))}
      {rows.flat().map((d, i) => (
        <div
          key={`d${i}`}
          className="col text-center text-sm p-2 border-round"
          style={{ color: d === 0 ? 'transparent' : COLORS.gray700 }}
        >
          {d || ''}
        </div>
      ))}
    </div>
  );
};

export default DashboardPage;
