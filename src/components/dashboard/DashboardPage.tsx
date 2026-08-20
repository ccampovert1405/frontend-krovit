import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
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
import { 
  apiGetUsersByRole, 
  UsuarioAPI, 
  apiGetGruposVentas, 
  GrupoVentasAPI, 
  apiGetOportunidadesSinGestion, 
  OportunidadAPI,
  apiCreateSeguimiento,
  apiUpdateSeguimiento,
  apiGetSeguimientosByOportunidad,
  apiGetAgencias,
  AgenciaAPI
} from '@/services/api';
import { COLORS, MESES_NOMBRES, ETAPA_COLORS } from '@/utils/constants';
import { formatUserDisplayName } from '@/utils/formatters';
import { Oportunidad, Seguimiento, EstadoSeguimiento } from '@/types';
import { useNotification } from '@/context/NotificationContext';
import { OportunidadSeguimientoBox } from '../oportunidades/OportunidadSeguimientoBox';

// ═══════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperGerente = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Gerente';
  const isGerenteComercial = user?.rol === 'Gerente Comercial';
  const isGerente = isSuperGerente || isGerenteComercial;
  const isJefe = user?.rol === 'Jefe Comercial';
  const isPrivileged = isGerente || isJefe;

  const {
    selectedMes,
    setSelectedMes,
    selectedAgente,
    setSelectedAgente,
    resetFilters,
    hasActiveFilters,
    mesActual,
  } = useFilters();

  const [agencias, setAgencias] = React.useState<AgenciaAPI[]>([]);
  const [selectedAgencia, setSelectedAgencia] = React.useState<string | number>('Todas');
  const [selectedGrupo, setSelectedGrupo] = React.useState<string | number>('Todos');
  const [grupos, setGrupos] = React.useState<GrupoVentasAPI[]>([]);
  const [agentes, setAgentes] = React.useState<UsuarioAPI[]>([]);

  useEffect(() => {
    if (isGerente) {
      apiGetAgencias()
        .then(setAgencias)
        .catch(console.error);
    }
  }, [isGerente]);

  useEffect(() => {
    if (isPrivileged) {
      apiGetGruposVentas()
        .then(setGrupos)
        .catch(console.error);
    }
  }, [isPrivileged]);

  useEffect(() => {
    if (isPrivileged) {
      apiGetUsersByRole('Agente Comercial')
        .then(setAgentes)
        .catch(console.error);
    }
  }, [isPrivileged]);

  const assignedAgency = useMemo(() => {
    if (!isGerenteComercial) return null;
    return agencias.find(a => String(a.encargadoId) === String(user?.id));
  }, [agencias, isGerenteComercial, user]);

  useEffect(() => {
    if (isGerenteComercial && assignedAgency) {
      setSelectedAgencia(assignedAgency.id);
    }
  }, [assignedAgency, isGerenteComercial]);

  const [sinGestion, setSinGestion] = React.useState<OportunidadAPI[]>([]);
  const [loadingSinGestion, setLoadingSinGestion] = React.useState(false);
  const [showSinGestionModal, setShowSinGestionModal] = React.useState(false);

  // Estados y lógica para seguimiento de oportunidades sin gestión
  const [selectedOpForGestion, setSelectedOpForGestion] = React.useState<Oportunidad | null>(null);
  const [savingGestion, setSavingGestion] = React.useState(false);
  const { showSuccess, showError } = useNotification();

  const getDiasSinGestion = (createdAt: string | Date | undefined) => {
    if (!createdAt) return 0;
    const createdDate = new Date(createdAt);
    const today = new Date();
    createdDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
  };

  const handleOpenGestion = async (op: OportunidadAPI) => {
    const mapped: Oportunidad = {
      id: op.id,
      nombre: op.nombre_oportunidad,
      cliente: op.prospecto ? `${op.prospecto.nombre} ${op.prospecto.apellido || ''}` : 'Sin cliente',
      clienteId: op.prospecto?.id,
      producto: op.producto || '',
      plan: op.plan_detalle?.monto || 0,
      fuente: op.fuente || '',
      valor: op.valor || 0,
      probabilidad: op.probabilidad || 0,
      etapa: op.estado as any,
      fecha: op.fecha || '',
      created_at: op.created_at,
      mes: op.mes || 0,
      agente: op.agente || '',
      user_create_id: op.user_create_id,
      user_create: op.user_create,
      seguimientos: []
    };

    try {
      const segs = await apiGetSeguimientosByOportunidad(op.id);
      mapped.seguimientos = segs.map(s => ({
        ...s,
        id: s.id,
        fecha_registro: s.fecha_registro,
        estado: s.estado as any,
        tipo_seguimiento: s.tipo_seguimiento as any,
        gestion_realizada: s.gestion_realizada
      }));
    } catch (err) {
      console.error("Error al cargar seguimientos", err);
    }
    
    setSelectedOpForGestion(mapped);
  };

  const handleSaveSeguimiento = async (opId: string | number, data: Partial<Seguimiento>) => {
    try {
      setSavingGestion(true);
      if (data.id) {
        await apiUpdateSeguimiento(String(data.id), data as any);
        showSuccess('Seguimiento actualizado exitosamente.', 'Actualizado');
      } else {
        await apiCreateSeguimiento({
          ...data,
          oportunidad_id: opId,
        } as any);
        showSuccess('Seguimiento registrado exitosamente.', 'Guardado');
      }

      // Recargar seguimientos para asegurar consistencia
      const segs = await apiGetSeguimientosByOportunidad(opId);
      const mappedSegs = segs.map(s => ({
        ...s,
        id: s.id,
        fecha_registro: s.fecha_registro,
        estado: s.estado as any,
        tipo_seguimiento: s.tipo_seguimiento as any,
        gestion_realizada: s.gestion_realizada
      }));

      if (selectedOpForGestion) {
        setSelectedOpForGestion({
          ...selectedOpForGestion,
          seguimientos: mappedSegs
        });
      }

      // Refrescar listado de oportunidades sin gestión
      apiGetOportunidadesSinGestion(selectedGrupo)
        .then(setSinGestion)
        .catch(console.error);

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al procesar seguimiento';
      showError(msg, 'Error');
    } finally {
      setSavingGestion(false);
    }
  };

  useEffect(() => {
    setLoadingSinGestion(true);
    apiGetOportunidadesSinGestion(selectedGrupo)
      .then(setSinGestion)
      .catch(console.error)
      .finally(() => setLoadingSinGestion(false));
  }, [selectedGrupo]);

  const selectedGrupoObj = useMemo(() => {
    return grupos.find(g => String(g.id) === String(selectedGrupo));
  }, [grupos, selectedGrupo]);

  useEffect(() => {
    if (!isPrivileged) {
      setSelectedAgente('Todos');
    }
  }, [isPrivileged, setSelectedAgente]);

  const jefeGrupo = useMemo(() => {
    if (!isJefe) return null;
    return grupos.find(g => 
      String(g.jefeComercialId) === String(user?.id) || 
      (g.jefeComercial && String(g.jefeComercial.userID) === String(user?.id))
    );
  }, [grupos, isJefe, user]);

  const currentAgentes = useMemo(() => {
    if (isGerente) {
      if (selectedGrupo !== 'Todos') {
        const selectedGrupoObj = grupos.find(g => String(g.id) === String(selectedGrupo));
        return selectedGrupoObj?.agentes || [];
      }
      if (selectedAgencia !== 'Todas') {
        const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
        return agencyGroups.flatMap(g => g.agentes || []);
      }
      if (isGerenteComercial && assignedAgency) {
        const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(assignedAgency.id));
        return agencyGroups.flatMap(g => g.agentes || []);
      }
      return agentes;
    }
    if (isJefe) {
      return jefeGrupo?.agentes || [];
    }
    return [];
  }, [isGerente, isJefe, isGerenteComercial, selectedGrupo, selectedAgencia, grupos, agentes, jefeGrupo, assignedAgency]);

  const selectedAgentUser = useMemo(() => {
    return currentAgentes.find(a => formatUserDisplayName(a.nombres, a.apellidos) === selectedAgente);
  }, [currentAgentes, selectedAgente]);

  const allowedAgentIds = useMemo(() => {
    if (isGerente) {
      if (selectedGrupo !== 'Todos') {
        const selectedGrupoObj = grupos.find(g => String(g.id) === String(selectedGrupo));
        return new Set((selectedGrupoObj?.agentes || []).map(a => String(a.userID)));
      }
      if (selectedAgencia !== 'Todas') {
        const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
        return new Set(agencyGroups.flatMap(g => g.agentes || []).map(a => String(a.userID)));
      }
      if (isGerenteComercial && assignedAgency) {
        const agencyGroups = grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(assignedAgency.id));
        return new Set(agencyGroups.flatMap(g => g.agentes || []).map(a => String(a.userID)));
      }
      return null;
    }
    if (isJefe) {
      const myGroup = grupos.find(g => 
        String(g.jefeComercialId) === String(user?.id) || 
        (g.jefeComercial && String(g.jefeComercial.userID) === String(user?.id))
      );
      return new Set((myGroup?.agentes || []).map(a => String(a.userID)));
    }
    return null;
  }, [isGerente, isGerenteComercial, isJefe, selectedGrupo, selectedAgencia, grupos, agencias, user, assignedAgency]);

  const groupAgentIds = allowedAgentIds;

  const { prospectosFiltrados: rawProspectos, oportunidadesFiltradas: rawOportunidades, tareasFiltradas: rawTareas } = useFilteredData({
    mes: selectedMes,
    agente: selectedAgente,
    userId: selectedAgentUser?.userID
  });

  const prospectosFiltrados = useMemo(() => {
    if (groupAgentIds) {
      return rawProspectos.filter(p => (p.user_create_id && groupAgentIds.has(String(p.user_create_id))) || !p.user_create_id);
    }
    return rawProspectos;
  }, [rawProspectos, groupAgentIds]);

  const oportunidadesFiltradas = useMemo(() => {
    if (groupAgentIds) {
      return rawOportunidades.filter(o => (o.user_create_id && groupAgentIds.has(String(o.user_create_id))) || !o.user_create_id);
    }
    return rawOportunidades;
  }, [rawOportunidades, groupAgentIds]);

  const tareasFiltradas = useMemo(() => {
    if (groupAgentIds) {
      return rawTareas.filter(t => (t.user_create_id && groupAgentIds.has(String(t.user_create_id))) || !t.user_create_id);
    }
    return rawTareas;
  }, [rawTareas, groupAgentIds]);

  const { indices: dynamicKPIs, loading: loadingIndices } = useDashboardIndices({
    mes: selectedMes,
    anio: new Date().getFullYear().toString(),
    userId: selectedAgentUser?.userID,
    grupoId: isGerenteComercial && selectedGrupo !== 'Todos' ? selectedGrupo : undefined
  });

  const kpis = useKPIs({
    prospectos: prospectosFiltrados,
    oportunidades: oportunidadesFiltradas,
  });

  const aidaFunnel = useAIDAFunnel(prospectosFiltrados);

  const descartadosCount = useMemo(() => {
    return prospectosFiltrados.filter(p => 
      p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO)
    ).length;
  }, [prospectosFiltrados]);

  const currentAnio = new Date().getFullYear().toString();
  const { metas: agentGoals, allMetas } = useForecast({
    userId: selectedAgentUser?.userID,
    mes: selectedMes,
    anio: currentAnio
  });

  const { details: jefeDetails } = useDashboardJefeDetails({
    mes: selectedMes,
    anio: currentAnio,
    grupoId: isGerenteComercial && selectedGrupo !== 'Todos' ? selectedGrupo : undefined
  }, isPrivileged);

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

    // 1. Vista Global (Grilla de agentes) - Solo para Jefe/Admin/Gerente Comercial
    if (isPrivileged && selectedAgente === 'Todos' && jefeDetails.length > 0) {
      // Filtramos para que NO aparezca el Jefe Comercial en la grilla
      const currentAgents = isGerenteComercial && selectedGrupoObj ? (selectedGrupoObj.agentes || []) : agentes;
      const agentIds = new Set(currentAgents.map(a => a.userID));
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
  }, [isPrivileged, isGerenteComercial, selectedGrupoObj, selectedAgente, selectedAgentUser, agentGoals, allMetas, prospectosFiltrados, oportunidadesFiltradas, tareasFiltradas, agentes, jefeDetails, user]);

  // Opciones para dropdowns
  const mesesDisponibles = MESES_NOMBRES.slice(0, mesActual + 1).map((mes, i) => ({
    label: `${mes} ${new Date().getFullYear()}`,
    value: i,
  }));

  const agencyOptions = useMemo(() => {
    if (isGerenteComercial) {
      if (assignedAgency) {
        return [{ label: assignedAgency.nombre, value: assignedAgency.id }];
      }
      return [];
    }
    return [
      { label: 'Todas las agencias', value: 'Todas' },
      ...agencias.map(a => ({ label: a.nombre, value: a.id }))
    ];
  }, [agencias, isGerenteComercial, assignedAgency]);

  const grupoOptions = useMemo(() => {
    const filtered = selectedAgencia === 'Todas'
      ? grupos
      : grupos.filter(g => g.agenciaId && String(g.agenciaId) === String(selectedAgencia));
    return [
      { label: 'Todos los grupos', value: 'Todos' },
      ...filtered.map(g => ({ label: g.nombre, value: g.id }))
    ];
  }, [grupos, selectedAgencia]);

  const agenteOptions = useMemo(() => {
    return [
      { label: isJefe ? 'Todos los agentes del grupo' : 'Todos los agentes', value: 'Todos' },
      ...currentAgentes.map(a => {
        const name = formatUserDisplayName(a.nombres, a.apellidos);
        return { label: name, value: name };
      })
    ];
  }, [currentAgentes, isJefe]);

  return (
    <div>
      {/* Header con filtros */}
      <PageHeader title="Dashboard" subtitle="Resumen de tu actividad comercial">
        <div className="flex gap-2 align-items-center flex-wrap">
          {/* Filtro Agencia - SOLO PARA GERENTES */}
          {isGerente && (
            <div className="flex align-items-center gap-2">
              <IconBox icon="pi-building" color={COLORS.blue} bg={COLORS.blueLight} />
              <Dropdown
                value={selectedAgencia}
                options={agencyOptions}
                onChange={(e) => {
                  setSelectedAgencia(e.value);
                  setSelectedGrupo('Todos');
                  setSelectedAgente('Todos');
                }}
                className="w-12rem"
                placeholder="Seleccionar agencia"
              />
            </div>
          )}

          {/* Filtro Grupo - SOLO PARA GERENTES */}
          {isGerente && (
            <div className="flex align-items-center gap-2">
              <IconBox icon="pi-sitemap" color={COLORS.blue} bg={COLORS.blueLight} />
              <Dropdown
                value={selectedGrupo}
                options={grupoOptions}
                onChange={(e) => {
                  setSelectedGrupo(e.value);
                  setSelectedAgente('Todos');
                }}
                className="w-12rem"
                placeholder="Seleccionar grupo"
              />
            </div>
          )}

          {/* Filtro Agente - PARA GERENTES Y JEFES */}
          {isPrivileged && (
            <div className="flex align-items-center gap-2">
              <IconBox icon="pi-users" color={COLORS.red} bg={COLORS.redLight} />
              <Dropdown
                value={selectedAgente}
                options={agenteOptions}
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
        {isGerente && selectedAgencia !== 'Todas' && (
          <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>
            Agencia ID: {selectedAgencia}
          </CustomBadge>
        )}
        {isGerente && selectedGrupo !== 'Todos' && selectedGrupoObj && (
          <CustomBadge color={COLORS.blue} bg={COLORS.blueLight}>
            Grupo: {selectedGrupoObj.nombre}
          </CustomBadge>
        )}
        {isPrivileged && (
          <CustomBadge color={COLORS.green} bg={COLORS.greenLight}>
            {selectedAgente === 'Todos' ? (isJefe ? 'Todos los agentes del grupo' : 'Todos los agentes') : selectedAgente}
          </CustomBadge>
        )}
        {hasActiveFilters && (
          <button
            onClick={() => {
              resetFilters();
              setSelectedAgencia('Todas');
              setSelectedGrupo('Todos');
            }}
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
        <KPICard
          icon="pi-trash"
          label="DESCARTADOS"
          value={loadingIndices ? '...' : String(descartadosCount)}
          sub="Prospectos con número equivocado"
          trend="neutral"
          trendLabel="Descartados"
          color={COLORS.gray500}
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
          {isGerenteComercial && selectedGrupo === 'Todos' && (
            <Card className="mb-4 shadow-1 text-center py-5" style={{ borderRadius: '16px' }}>
              <i className="pi pi-users text-400 mb-3" style={{ fontSize: '2.5rem', color: COLORS.gray400 }} />
              <div className="font-bold text-gray-700 text-lg">Visualización de Agentes</div>
              <div className="text-gray-500 text-sm mt-1">Selecciona un grupo de ventas arriba para visualizar el rendimiento de sus agentes.</div>
            </Card>
          )}

          {isGerenteComercial && selectedGrupo !== 'Todos' && performanceMetrics && performanceMetrics.data.length === 0 && (
            <Card className="mb-4 shadow-1 text-center py-5" style={{ borderRadius: '16px' }}>
              <i className="pi pi-users text-400 mb-3" style={{ fontSize: '2.5rem', color: COLORS.gray400 }} />
              <div className="font-bold text-gray-700 text-lg">Sin Agentes Asignados</div>
              <div className="text-gray-500 text-sm mt-1">Este grupo de ventas no tiene agentes registrados para este período.</div>
            </Card>
          )}

          {isPrivileged && performanceMetrics && performanceMetrics.data.length > 0 && (
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
          {/* Oportunidades sin Gestión */}
          <Card className="mb-3 shadow-1" style={{ borderRadius: '16px' }}>
            <SectionTitle
              icon="pi-clock"
              title="Sin Gestión"
              badge={sinGestion.length}
            />
            {loadingSinGestion ? (
              <div className="text-center py-4">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.5rem', color: COLORS.red }} />
              </div>
            ) : sinGestion.length === 0 ? (
              <EmptyState message="No hay oportunidades sin gestión" />
            ) : (
              <div className="flex flex-column gap-3 mt-3">
                {sinGestion.slice(0, 3).map((op) => {
                  const dias = getDiasSinGestion(op.created_at);
                  return (
                    <div
                      key={op.id}
                      className="flex align-items-center justify-content-between p-3 border-round-xl hover:bg-gray-50 transition-duration-200 cursor-pointer"
                      style={{ border: `1px solid ${COLORS.gray100}`, background: COLORS.white }}
                      onClick={() => handleOpenGestion(op)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-bold text-gray-800 text-sm" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {op.nombre_oportunidad}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          👤 {op.prospecto?.nombre} {op.prospecto?.apellido || ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex align-items-center gap-1">
                          <i className="pi pi-calendar" style={{ fontSize: '0.7rem' }} />
                          Creado: {op.created_at ? new Date(op.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <span className="font-bold text-red-600 text-sm" style={{ color: COLORS.red }}>
                          {dias} día{dias !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {sinGestion.length > 3 && (
              <button
                onClick={() => setShowSinGestionModal(true)}
                className="w-full flex align-items-center justify-content-center gap-1 mt-3 py-2 bg-transparent border-none cursor-pointer text-sm font-semibold"
                style={{ color: COLORS.red }}
              >
                Ver todos ({sinGestion.length}) <i className="pi pi-arrow-right" style={{ fontSize: '0.8rem' }} />
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* Modal para visualizar todas las Oportunidades sin Gestión */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <IconBox icon="pi-clock" color={COLORS.red} bg={COLORS.redLight} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: COLORS.black }}>Oportunidades sin Gestión</div>
              <div style={{ color: COLORS.gray400, fontSize: '0.8rem', marginTop: '2px' }}>Listado completo de oportunidades sin ningún seguimiento registrado</div>
            </div>
          </div>
        }
        visible={showSinGestionModal}
        onHide={() => setShowSinGestionModal(false)}
        style={{ width: '750px', borderRadius: '16px', overflow: 'hidden' }}
        breakpoints={{ '960px': '90vw', '641px': '100%' }}
        modal
        headerStyle={{ borderBottom: 'none' }}
        contentStyle={{ borderTop: 'none', padding: '10px 24px 24px' }}
      >
        <DataTable
          value={sinGestion}
          paginator
          rows={10}
          className="datatable-premium"
          emptyMessage="No se encontraron oportunidades sin gestión"
          paginatorTemplate="CurrentPageReport PrevPageLink PageLinks NextPageLink"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
        >
          <Column
            header="OPORTUNIDAD"
            body={(op) => (
              <div className="flex flex-column gap-1">
                <span className="font-bold text-gray-800">{op.nombre_oportunidad}</span>
                <span className="text-xs text-gray-500">Producto: {op.producto || '—'}</span>
              </div>
            )}
          />
          <Column
            header="CLIENTE / PROSPECTO"
            body={(op) => (
              <div className="flex flex-column gap-1">
                <span className="font-semibold text-gray-700">{op.prospecto?.nombre} {op.prospecto?.apellido || ''}</span>
                <span className="text-xs text-gray-400">Creado por: {op.user_create?.nombres} {op.user_create?.apellidos}</span>
              </div>
            )}
          />
          <Column
            header="DÍAS SIN GESTIÓN"
            body={(op) => {
              const dias = getDiasSinGestion(op.created_at);
              return (
                <span className="font-bold text-red-600" style={{ color: COLORS.red }}>
                  {dias} día{dias !== 1 ? 's' : ''}
                </span>
              );
            }}
          />
          <Column
            header="FECHA CREACIÓN"
            body={(op) => (
              <span className="text-sm text-gray-600">
                {op.created_at ? new Date(op.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            )}
          />
          <Column
            header="ACCIONES"
            body={(op) => (
              <Button
                icon="pi pi-comments"
                text
                rounded
                className="p-button-danger"
                tooltip="Ingresar Gestión"
                tooltipOptions={{ appendTo: () => document.body, position: 'top' }}
                onClick={() => handleOpenGestion(op)}
              />
            )}
          />
        </DataTable>
      </Dialog>

      {/* Modal para Registrar Gestión */}
      <Dialog
        header={
          <div className="flex align-items-center gap-3">
            <IconBox
              icon="pi-comments"
              size="48px"
              iconSize="1.3rem"
              color={COLORS.red}
              bg={COLORS.redLight}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.gray800 }}>
                {selectedOpForGestion?.nombre}
              </div>
              <div style={{ fontSize: '0.82rem', color: COLORS.gray500, marginTop: '2px' }}>
                Ingresar gestión para esta oportunidad
              </div>
            </div>
          </div>
        }
        visible={!!selectedOpForGestion}
        onHide={() => setSelectedOpForGestion(null)}
        style={{ width: '680px', borderRadius: '16px', overflow: 'hidden' }}
        breakpoints={{ '960px': '90vw', '641px': '100%' }}
        modal
        headerStyle={{ borderBottom: 'none' }}
        contentStyle={{ borderTop: 'none', padding: '10px 24px 24px' }}
      >
        {selectedOpForGestion && (
          <div className="flex flex-column gap-4">
            {/* Info de la oportunidad */}
            <div style={{
              background: COLORS.gray50,
              borderRadius: '12px',
              padding: '16px 20px',
            }}>
              <div className="grid">
                <div className="col-6">
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Cliente</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{selectedOpForGestion.cliente}</div>
                </div>
                <div className="col-6">
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: COLORS.gray500, textTransform: 'uppercase', marginBottom: '4px' }}>Producto</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: COLORS.gray800 }}>{selectedOpForGestion.producto || '—'}</div>
                </div>
              </div>
            </div>

            <OportunidadSeguimientoBox 
              oportunidad={selectedOpForGestion} 
              onSaveSeguimiento={handleSaveSeguimiento}
              loading={savingGestion}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
};

/*
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
*/

export default DashboardPage;
