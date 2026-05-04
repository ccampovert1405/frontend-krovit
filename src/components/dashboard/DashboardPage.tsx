import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import {
  KPICard,
  SectionTitle,
  PageHeader,
  EmptyState,
  Avatar,
  CustomBadge,
  IconBox
} from '@/components/ui';
import { useFilters, useFilteredData, useKPIs, useAIDAFunnel, useAuth, useDashboardIndices, useForecast, useDashboardJefeDetails } from '@/hooks';
import { AgentPerformanceCard } from './AgentPerformanceCard';
import { apiGetUsersByRole, UsuarioAPI } from '@/services/api';
import { COLORS, MESES_NOMBRES, ETAPA_COLORS, PRIORIDAD_COLORS, TIPO_TAREA_ICONS } from '@/utils/constants';
import { formatUserDisplayName } from '@/utils/formatters';
import { Tarea, Oportunidad } from '@/types';

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente';



  const {
    selectedMes,
    setSelectedMes,
    selectedAgente,
    setSelectedAgente,
    resetFilters,
    hasActiveFilters,
    mesActual,
  } = useFilters();

  // Si es agente, forzar el filtro a su propio nombre (o 'Todos' si usamos la lógica de fetchId)
  // Pero useFilters está acoplado a strings de nombres.
  // En useFilteredData, si agente !== 'Todos' hace filter.
  // Sin embargo, useProspectos y useOportunidades ya filtran por API si detectan rol agente.
  // Así que si soy agente, 'Todos' en el frontend ya significa 'Todos MIS datos'.
  // Por lo tanto, lo mejor es ocultar el selector de agentes.

  useEffect(() => {
    if (!isPrivileged) {
      setSelectedAgente('Todos');
    }
  }, [isPrivileged, setSelectedAgente]);

  // Agentes Reales
  const [agentes, setAgentes] = React.useState<UsuarioAPI[]>([]);
  useEffect(() => {
    if (isPrivileged) {
      apiGetUsersByRole('Agente Comercial')
        .then(setAgentes)
        .catch(console.error);
    }
  }, [isPrivileged]);

  // Buscar el userId si el agente seleccionado no es "Todos"
  const selectedAgentUser = agentes.find(a => formatUserDisplayName(a.nombres, a.apellidos) === selectedAgente);

  const { prospectosFiltrados, oportunidadesFiltradas, tareasFiltradas } = useFilteredData({
    mes: selectedMes,
    agente: selectedAgente,
    userId: selectedAgentUser?.userID
  });

  const { indices: dynamicKPIs, loading: loadingIndices } = useDashboardIndices({
    mes: selectedMes,
    anio: new Date().getFullYear().toString(),
    userId: selectedAgentUser?.userID
  });

  const kpis = useKPIs({
    prospectos: prospectosFiltrados,
    oportunidades: oportunidadesFiltradas,
  });

  const aidaFunnel = useAIDAFunnel(prospectosFiltrados);

  const currentAnio = new Date().getFullYear().toString();
  const { metas: agentGoals, allMetas } = useForecast({
    userId: selectedAgentUser?.userID,
    mes: selectedMes,
    anio: currentAnio
  });

  const { details: jefeDetails } = useDashboardJefeDetails({
    mes: selectedMes,
    anio: currentAnio
  });

  const performanceMetrics = useMemo(() => {
    if (!isPrivileged) return null;

    // Helper para mapear el item de la API al formato de la tarjeta
    const mapToCard = (item: any) => ({
      agentName: item.nombre,
      revenue: {
        current: item.real.ingresos,
        target: typeof item.forecast?.metaIngresos === 'string' ? parseFloat(item.forecast.metaIngresos) : (item.forecast?.metaIngresos || 0)
      },
      tasks: item.totalTareasPendientes,
      prospects: { current: item.real.prospectos, target: item.forecast?.metaProspectos || 0 },
      opportunities: { current: item.real.oportunidades, target: item.forecast?.metaOportunidades || 0 },
      closings: { current: item.real.cierres, target: item.forecast?.metaCierres || 0 },
      winOpps: item.real.ganadas,
      lostOpps: item.real.perdidas
    });

    // 1. Vista Global (Grilla de agentes) - Solo para Jefe/Admin
    if (isPrivileged && selectedAgente === 'Todos' && jefeDetails.length > 0) {
      // Filtramos para que NO aparezca el Jefe Comercial en la grilla
      const agentIds = new Set(agentes.map(a => a.userID));
      return {
        isBatch: true,
        data: jefeDetails
          .filter(item => agentIds.has(item.agenteId) && item.nombre !== 'Jefe Comercial')
          .map(item => mapToCard(item))
      };
    }

    // 2. Vista Individual (Filtro específico o Agente viendo su propio dashboard)
    const searchId = selectedAgentUser?.userID || (!isPrivileged ? user?.id : null);
    if (searchId) {
      // Intentamos buscar en jefeDetails (si falló o no cargó, usamos fallback local)
      const myDetail = jefeDetails.find(d => d.agenteId === searchId);
      if (myDetail) {
        return {
          isBatch: false,
          data: [mapToCard(myDetail)]
        };
      }

      // Fallback local para vista individual
      const revActual = oportunidadesFiltradas
        .filter(o => o.etapa === 'Cierre' || (o as any).estado === 'Cierre' || o.etapa === 'Ganada')
        .reduce((acc, o) => acc + (o.valor || 0), 0);

      const targetName = selectedAgentUser ? formatUserDisplayName(selectedAgentUser.nombres, selectedAgentUser.apellidos) : formatUserDisplayName(user?.nombres || '', user?.apellidos || '');

      return {
        isBatch: false,
        data: [{
          agentName: targetName,
          revenue: { current: revActual, target: agentGoals?.metaIngresos || 0 },
          tasks: tareasFiltradas.filter(t => !t.completada).length,
          prospects: { current: prospectosFiltrados.length, target: agentGoals?.metaProspectos || 0 },
          opportunities: { current: oportunidadesFiltradas.length, target: agentGoals?.metaOportunidades || 0 },
          closings: { current: oportunidadesFiltradas.filter(o => o.etapa === 'Cierre' || (o as any).estado === 'Cierre' || o.etapa === 'Ganada').length, target: agentGoals?.metaCierres || 0 },
          winOpps: oportunidadesFiltradas.filter(o => o.etapa === 'Ganada').length,
          lostOpps: oportunidadesFiltradas.filter(o => o.etapa === 'Perdida').length
        }]
      };
    }

    return null;
  }, [isPrivileged, selectedAgente, selectedAgentUser, agentGoals, allMetas, prospectosFiltrados, oportunidadesFiltradas, tareasFiltradas, agentes, jefeDetails, user]);

  // Opciones para dropdowns
  const mesesDisponibles = MESES_NOMBRES.slice(0, mesActual + 1).map((mes, i) => ({
    label: `${mes} ${new Date().getFullYear()}`,
    value: i,
  }));

  const agentesOptions = [
    { label: 'Todos los agentes', value: 'Todos' },
    ...agentes.map(a => {
      const name = formatUserDisplayName(a.nombres, a.apellidos);
      return { label: name, value: name };
    }),
  ];

  const isJefeComercial = user?.rol === 'Jefe Comercial';

  return (
    <div>
      {/* Header con filtros */}
      <PageHeader title="Dashboard" subtitle="Resumen de tu actividad comercial">
        <div className="flex gap-2 align-items-center flex-wrap">
          {/* Filtro Agente - SOLO PARA JEFE COMERCIAL */}
          {isJefeComercial && (
            <div className="flex align-items-center gap-2">
              <IconBox icon="pi-users" color={COLORS.red} bg={COLORS.redLight} />
              <Dropdown
                value={selectedAgente}
                options={agentesOptions}
                onChange={(e) => setSelectedAgente(e.value)}
                className="w-12rem"
                placeholder="Seleccionar agente"
              />
            </div>
          )}

          {/* Filtro Mes */}
          <div className="flex align-items-center gap-2">
            <IconBox icon="pi-calendar" color={COLORS.blue} bg={COLORS.blueLight} />
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
          {MESES_NOMBRES[selectedMes]} {new Date().getFullYear()}
        </CustomBadge>
        {isJefeComercial && (
          <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>
            {selectedAgente === 'Todos' ? 'Todos los agentes' : selectedAgente}
          </CustomBadge>
        )}
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
      <div className="kpi-cards-grid">
        <KPICard
          icon="pi-sync"
          label="PRODUCCIÓN"
          value={loadingIndices ? '...' : `${dynamicKPIs?.kpi_produccion?.ratio || 0}% `}
          sub={`${dynamicKPIs?.kpi_produccion?.cantidad_prospectos_creados || 0} de ${dynamicKPIs?.kpi_produccion?.cantidad_prospectos_planificados || 0} planificadas`}
          trend={Number(dynamicKPIs?.kpi_produccion?.ratio || 0) > 15 ? 'up' : 'neutral'}
          trendLabel={Number(dynamicKPIs?.kpi_produccion?.ratio || 0) > 15 ? 'Buen ritmo' : 'En progreso'}
          color={COLORS.red}
        />
        <KPICard
          icon="pi-check-circle"
          label="EFICACIA"
          value={loadingIndices ? '...' : `${dynamicKPIs?.kpi_eficacia?.ratio || 0}% `}
          sub={`${dynamicKPIs?.kpi_eficacia?.cantidad_oportunidades_cerradas || 0} cerradas de ${dynamicKPIs?.kpi_eficacia?.cantidad_oportunidades_creadas || 0} `}
          trend={Number(dynamicKPIs?.kpi_eficacia?.ratio || 0) > 25 ? 'up' : 'down'}
          trendLabel={`${dynamicKPIs?.kpi_eficacia?.cantidad_oportunidades_ganadas || 0} ganadas`}
          color={COLORS.green}
        />
        <KPICard
          icon="pi-dollar"
          label="CONTRIBUCIÓN"
          value={loadingIndices ? '...' : `${dynamicKPIs?.kpi_contribucion?.ratio || 0}% `}
          sub={`$${(dynamicKPIs?.kpi_contribucion?.total_ingresos || 0).toLocaleString()} en ingresos`}
          trend={(dynamicKPIs?.kpi_contribucion?.total_ingresos || 0) > 0 ? 'up' : 'neutral'}
          trendLabel={`$${(dynamicKPIs?.kpi_contribucion?.meta_ingresos || 0).toLocaleString()} `}
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

      <div className="dashboard-columns">
        {/* Left Column */}
        <div className="dashboard-col-main">
          {/* Embudo AIDA */}
          <Card className="mb-3 shadow-1">
            <SectionTitle
              icon="pi-chart-bar"
              title="Embudo AIDA"
              action={() => navigate('/prospectos')}
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

          {/* Contenido Principal: Grilla o Lista */}
          {isPrivileged && performanceMetrics && (
            <div className="grid mb-4">
              {performanceMetrics.data.map((item, idx) => (
                <div key={idx} className={`col-12 ${performanceMetrics.isBatch ? 'md:col-6' : ''}`}>
                  <AgentPerformanceCard
                    agentName={item.agentName}
                    revenue={item.revenue}
                    tasks={item.tasks}
                    prospects={item.prospects}
                    opportunities={item.opportunities}
                    closings={item.closings}
                    winOpps={item.winOpps}
                    lostOpps={item.lostOpps}
                  />
                </div>
              ))}
            </div>
          )}

          {!isPrivileged && (
            /* Oportunidades Recientes - SOLO PARA AGENTES */
            <Card className="shadow-1">
              <SectionTitle
                icon="pi-sync"
                title="Oportunidades Recientes"
                action={() => navigate('/oportunidades')}
                actionLabel="Ver todas"
              />
              {oportunidadesFiltradas.length === 0 ? (
                <EmptyState message="No hay oportunidades para este período" />
              ) : (
                oportunidadesFiltradas.slice(0, 10).map((op: Oportunidad) => (
                  <div
                    key={op.id}
                    className="flex align-items-center justify-content-between py-2 border-bottom-1"
                    style={{ borderColor: COLORS.gray100 }}
                  >
                    <div className="flex align-items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                      <Avatar name={op.cliente} />
                      <div style={{ minWidth: 0 }}>
                        <div className="font-semibold text-900" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.nombre}</div>
                        <div className="text-sm text-500" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{op.cliente}</div>
                      </div>
                    </div>
                    <div className="flex align-items-center gap-3" style={{ flexShrink: 0, marginLeft: '12px' }}>
                      <span className="font-bold text-900" style={{ whiteSpace: 'nowrap' }}>${op.valor.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="dashboard-col-side">
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
              tareasFiltradas.slice(0, 3).map((tarea: Tarea) => (
                <div
                  key={tarea.id}
                  className="flex align-items-start gap-2 py-2 border-bottom-1"
                  style={{ borderColor: COLORS.gray100 }}
                >
                  <input type="checkbox" className="mt-1" style={{ accentColor: COLORS.red }} />
                  <div className="flex-1">
                    <div className="flex align-items-center gap-2">
                      <i
                        className={`pi ${TIPO_TAREA_ICONS[tarea.tipo]} `}
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
              onClick={() => navigate('/tareas')}
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
              badge={`${MESES_NOMBRES[selectedMes]} ${new Date().getFullYear()}`}
            />
            <MiniCalendar selectedMonth={selectedMes} />
            <div className="mt-3 pt-2 border-top-1" style={{ borderColor: COLORS.gray100 }}>
              <div className="text-sm font-semibold text-600">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              {tareasFiltradas.filter(t => {
                const d = new Date(t.fecha);
                const todayRef = new Date();
                return d.getDate() === todayRef.getDate() && d.getMonth() === todayRef.getMonth() && d.getFullYear() === todayRef.getFullYear();
              }).length === 0 && (
                  <div className="text-xs text-400 mt-1">Sin actividades programadas</div>
                )}
            </div>
            <button
              onClick={() => navigate('/actividades')}
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
interface MiniCalendarProps {
  selectedMonth: number;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ selectedMonth }) => {
  const now = new Date();
  const year = now.getFullYear();
  const today = now.getDate();
  const isCurrentMonth = now.getMonth() === selectedMonth;

  const daysLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const firstDayOfMonth = new Date(year, selectedMonth, 1);
  const lastDayOfMonth = new Date(year, selectedMonth + 1, 0);

  // getDay(): 0=Dom, 1=Lun...
  let startingDay = firstDayOfMonth.getDay();
  if (startingDay === 0) startingDay = 7; // Ajustar a Lunes como 1

  const daysArray: { day: number, isCurrentMonth: boolean }[] = [];

  // Días del mes anterior
  const prevMonthLastDay = new Date(year, selectedMonth, 0).getDate();
  for (let i = startingDay - 1; i > 0; i--) {
    daysArray.push({ day: prevMonthLastDay - i + 1, isCurrentMonth: false });
  }

  // Días del mes actual
  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    daysArray.push({ day: i, isCurrentMonth: true });
  }

  // Días del mes siguiente para completar la grilla
  const totalSlots = 42;
  const nextMonthDays = totalSlots - daysArray.length;
  for (let i = 1; i <= nextMonthDays; i++) {
    daysArray.push({ day: i, isCurrentMonth: false });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '2px',
        marginTop: '1rem'
      }}
    >
      {daysLabels.map(d => (
        <div key={d} className="text-center text-xs text-500 font-bold p-1">
          {d}
        </div>
      ))}
      {daysArray.map((dObj, i) => {
        const isToday = dObj.isCurrentMonth && isCurrentMonth && dObj.day === today;
        return (
          <div
            key={i}
            className="text-center text-xs p-2 border-round flex align-items-center justify-content-center"
            style={{
              height: '32px',
              color: !dObj.isCurrentMonth ? COLORS.gray300 : (isToday ? COLORS.white : COLORS.gray700),
              backgroundColor: isToday ? COLORS.red : 'transparent',
              fontWeight: isToday ? 700 : 500,
              cursor: 'default',
              transition: 'all 0.2s'
            }}
          >
            {dObj.day}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardPage;
