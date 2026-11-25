import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
export { useAuth };
import { Prospecto, Oportunidad, EtapaAIDA, PlanFinancieroData, Tarea, Meta, EstadoSeguimiento } from '@/types';
import {
  apiGetProspectos, apiCreateProspecto, apiUpdateProspecto, apiDeleteProspecto,
  apiGetOportunidades, apiCreateOportunidad, apiUpdateOportunidad, apiDeleteOportunidad,
  apiGetTareas, apiCreateTarea, apiUpdateTarea, apiDeleteTarea,
  apiGetDashboardIndex, apiGetDashboardUserIndex, apiGetForecastsByUser, apiGetForecastsFilter,
  apiGetDashboardJefeDetails,
  ProspectoAPI, OportunidadAPI, TareaAPI, DashboardIndices, DashboardJefeDetailsAPI
} from '@/services/api';
import { MESES_NOMBRES } from '@/utils/constants';
import { useNotification } from '@/context/NotificationContext';
import { notifyApiError } from '@/utils/errorHelpers';
import { formatUserDisplayName } from '@/utils/formatters';

// ─── Mapa etapa API → EtapaAIDA del frontend ─────────────────
const ETAPA_MAP: Record<string, EtapaAIDA> = {
  'ATENCION': 'ATENCION',
  'INTERES': 'INTERES',
  'DESEO': 'DESEO',
  'ACCION': 'ACCION',
};
const mapEtapa = (raw?: string): EtapaAIDA => ETAPA_MAP[(raw ?? '').toUpperCase()] ?? 'ATENCION';

// ─── Mapa EtapaAIDA → enum del backend ───────────────────────
const ETAPA_TO_API: Record<string, string> = {
  'ATENCION': 'ATENCION',
  'INTERES': 'INTERES',
  'DESEO': 'DESEO',
  'ACCION': 'ACCION',
};
const toApiEtapa = (etapa?: string): string | undefined =>
  etapa ? (ETAPA_TO_API[etapa] ?? etapa.toUpperCase()) : undefined;
// ─── Helpers de normalización ────────────────────────────────
const toProspecto = (p: ProspectoAPI, fallbackMes?: number): Prospecto => ({
  id: p.id,
  nombre: p.nombre ?? '',
  apellido: p.apellido ?? '',
  email: p.email ?? '',
  telefono: p.telefono ?? '',
  celular: p.celular ?? '',
  ciudad: p.ciudad ?? '',
  empresa: p.empresa ?? '',
  etapa: mapEtapa(p.etapa),   // mapeo a EtapaAIDA (AHORA EN MAYUSCULAS)
  fuente: p.fuente ?? '',
  tipo: '',          // campo interno del frontend, no viene del backend
  notas: p.notas,
  mes: p.mes !== undefined ? p.mes : (fallbackMes ?? new Date().getMonth()),
  agente: p.user_create
    ? formatUserDisplayName(p.user_create.nombres, p.user_create.apellidos)
    : (p.agente || ''),
  user_create_id: p.user_create_id || p.user_create?.userID,
  user_create: p.user_create,
  created_at: p.createdAt || p.created_at || '',
  updated_at: p.updatedAt || p.updated_at || '',
  seguimientos: p.seguimientos ? p.seguimientos.map(s => ({
    id: s.id,
    oportunidad_id: s.oportunidad_id,
    prospect_id: s.prospect_id,
    gestion_realizada: s.gestion_realizada,
    estado: s.estado as any,
    tipo_seguimiento: s.tipo_seguimiento as any,
    fecha: s.fecha,
    hora: s.hora,
    minuto: s.minuto,
    calificacion_oportunidad: s.calificacion_oportunidad,
    fecha_registro: s.fecha_registro,
    usuario_id: s.usuario_id,
    numero_seguimiento: s.numero_seguimiento,
  })) : [],
});

const toOportunidad = (o: OportunidadAPI, fallbackMes?: number): Oportunidad => {
  const prospectName = o.prospecto
    ? `${o.prospecto.nombre} ${o.prospecto.apellido}`.trim()
    : '';

  const montoPlan = o.plan_detalle?.monto ? Number(o.plan_detalle.monto) : 0;

  // Normalizar producto (Vehiculo -> Vehículo)
  let producto = o.producto ?? '';
  if (producto === 'Vehiculo') producto = 'Vehículo';

  const planData: PlanFinancieroData = {
    producto: producto,
    subProducto: o.plazo_detalle?.id ? `${o.plazo_detalle.id} Meses` : (o.producto || 'Plan'),
    montoBase: montoPlan,
    montoFinal: o.plan_detalle?.monto_final ? Number(o.plan_detalle.monto_final) : montoPlan,
    inscripcion: o.plan_detalle?.valor_inscripcion ? Number(o.plan_detalle.valor_inscripcion) : 0,
    cuotaMensual: o.plazo_detalle?.valor_cuota ? Number(o.plazo_detalle.valor_cuota) : 0,
    compromiso: o.financiamiento_detalle ? {
      tipo: String(o.financiamiento_detalle.financiamiento?.tipo ?? o.financiamiento_detalle.porcentaje ?? o.financiamiento_detalle.tipo ?? '0'),
      cuotas: o.financiamiento_detalle.cuotas ?? o.financiamiento_detalle.financiamiento?.cuotas ?? 0,
      valor_financiamiento: Number(o.financiamiento_detalle.valor_financiamiento ?? 0),
    } : undefined
  };

  return {
    id: o.id,
    nombre: o.nombre_oportunidad ?? '',
    cliente: prospectName,
    clienteId: o.prospecto_id,
    producto: producto,
    plan: montoPlan,
    fuente: o.fuente ?? '',
    notas: o.notas,
    valor: montoPlan || (o.valor ?? 0),
    probabilidad: o.probabilidad ?? 0,
    etapa: (o.estado as Oportunidad['etapa']) ?? 'Calificación',
    fecha: o.fecha ?? '',
    created_at: o.createdAt || o.created_at || o.fecha || '',
    mes: o.mes !== undefined ? o.mes : (fallbackMes ?? new Date().getMonth()),
    agente: o.user_create
      ? formatUserDisplayName(o.user_create.nombres, o.user_create.apellidos)
      : (o.agente ?? ''),
    user_create_id: o.user_create_id || o.user_create?.userID,
    user_create: o.user_create,
    color: o.color,
    fk_plan: o.plan_id,
    fk_plazo: o.plazo_id,
    fk_financiamiento: o.financiamiento_id,
    planData,
  };
};

const toTarea = (t: TareaAPI): Tarea => ({
  id: t.id,
  titulo: t.titulo || '',
  descripcion: t.descripcion,
  prioridad: (t.prioridad?.toLowerCase() as any) || 'baja',
  tipo: (t.tipo?.toLowerCase() as any) || 'llamada',
  fecha: t.fecha || '',
  hora: t.hora,
  mes: t.fecha ? new Date(t.fecha).getMonth() : new Date().getMonth(),
  agente: t.user_create
    ? formatUserDisplayName(t.user_create.nombres, t.user_create.apellidos)
    : (t.agente || ''),
  user_create_id: t.user_create_id || t.user_create?.userID,
  user_create: t.user_create,
  contacto: t.contacto || 'Sin contacto',
  completada: !!t.completada,
  recordatorio: t.recordatorio,
  cliente_id: t.cliente_id,
  oportunidad_id: t.oportunidad_id,
  estado: (t.estado as any) || 'PENDIENTE',
});


// ═══════════════════════════════════════════════════════════
// HOOK: useFilters
// ═══════════════════════════════════════════════════════════
export const useFilters = () => {
  const mesActual = new Date().getMonth();
  const [selectedMes, setSelectedMes] = useState<number>(mesActual);
  const [selectedAgente, setSelectedAgente] = useState<string>('Todos');

  const resetFilters = useCallback(() => {
    setSelectedMes(mesActual);
    setSelectedAgente('Todos');
  }, [mesActual]);

  const hasActiveFilters = useMemo(() => {
    return selectedAgente !== 'Todos' || selectedMes !== mesActual;
  }, [selectedAgente, selectedMes, mesActual]);

  return { selectedMes, setSelectedMes, selectedAgente, setSelectedAgente, resetFilters, hasActiveFilters, mesActual };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useFilteredData
// ═══════════════════════════════════════════════════════════
interface FilterParams { mes: number; agente: string; userId?: string | number; }

export const useFilteredData = ({ mes, agente, userId }: FilterParams) => {
  const currentAnio = new Date().getFullYear().toString();
  const { prospectos } = useProspectos({ mes, anio: currentAnio, userId });
  const { oportunidades } = useOportunidades({ mes, anio: currentAnio, userId });
  const { tareas } = useTareas({ mes, anio: currentAnio, userId });

  const filtrar = useCallback(<T extends { mes: number; agente?: string }>(arr: T[]): T[] => {
    let result = arr.filter(item => item.mes === mes);
    if (agente !== 'Todos') {
      result = result.filter(item => {
        // En tareas el agente viene como string de nombre, en prospectos/oportunidades también lo mapeamos a string
        return item.agente === agente;
      });
    }
    return result;
  }, [mes, agente]);

  return {
    prospectosFiltrados: useMemo(() => filtrar(prospectos), [filtrar, prospectos]),
    oportunidadesFiltradas: useMemo(() => filtrar(oportunidades), [filtrar, oportunidades]),
    tareasFiltradas: useMemo(() => filtrar(tareas), [filtrar, tareas]),
  };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useKPIs
// ═══════════════════════════════════════════════════════════
interface UseKPIsParams { prospectos: Prospecto[]; oportunidades: Oportunidad[]; }

export const useKPIs = ({ prospectos, oportunidades }: UseKPIsParams) => {
  return useMemo(() => {
    const planificadas = 35;
    const totalProspectos = prospectos.length;
    const produccion = planificadas > 0 ? ((totalProspectos / planificadas) * 100).toFixed(1) : '0.0';

    const ganadas = oportunidades.filter(o => o.etapa === 'Ganada');
    const totalOps = oportunidades.length;
    const eficacia = totalOps > 0 ? ((ganadas.length / totalOps) * 100).toFixed(1) : '0.0';

    const totalGanado = ganadas.reduce((s, o) => s + o.valor, 0);
    const totalPipeline = oportunidades.reduce((s, o) => s + o.valor, 0);
    const contribucion = totalPipeline > 0 ? ((totalGanado / totalPipeline) * 100).toFixed(1) : '0.0';
    const cicloVenta = ganadas.length > 0 ? Math.round(-384 / ganadas.length) : 0;

    return { produccion, totalProspectos, planificadas, eficacia, ganadas: ganadas.length, totalOps, contribucion, totalGanado, totalPipeline, cicloVenta };
  }, [prospectos, oportunidades]);
};

// ═══════════════════════════════════════════════════════════
// HOOK: useAIDAFunnel
// ═══════════════════════════════════════════════════════════
export const useAIDAFunnel = (prospectos: Prospecto[]) => {
  return useMemo(() => {
    const etapas: EtapaAIDA[] = ['ATENCION', 'INTERES', 'DESEO', 'ACCION'];
    return etapas.map(etapa => ({
      etapa,
      count: prospectos.filter(p => 
        p.etapa === etapa && 
        !p.seguimientos?.some(s => s.tipo_seguimiento === EstadoSeguimiento.NUMERO_EQUIVOCADO)
      ).length
    }));
  }, [prospectos]);
};

// ═══════════════════════════════════════════════════════════
// HOOK: useDashboardIndices — conectado a KPI dinámicos
// ═══════════════════════════════════════════════════════════
export const useDashboardIndices = (params: { mes: number; anio: string; userId?: string | number; grupoId?: string | number }) => {
  const { user } = useAuth();
  const [indices, setIndices] = useState<DashboardIndices | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente' || user?.rol === 'Gerente Comercial';
    const mesNombre = MESES_NOMBRES[params.mes];
    const apiParams = { mes: mesNombre, anio: params.anio, userId: params.userId || user?.id || '', grupoId: params.grupoId };

    const fetchAction = (isPrivileged && !params.userId)
      ? apiGetDashboardIndex(apiParams)
      : apiGetDashboardUserIndex(params.userId || user?.id || '', apiParams);

    fetchAction
      .then(data => { if (!cancelled) setIndices(data); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar índices'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [params.mes, params.anio, params.userId, params.grupoId, user]);

  return { indices, loading, error };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useProspectos — conectado a API real
// ═══════════════════════════════════════════════════════════
export const useProspectos = (params?: { mes: number; anio: string; userId?: string | number }) => {
  const { user } = useAuth();
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial desde la API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Visibilidad: Solo Admin y Jefe Comercial ven todo. Otros ven solo lo suyo.
    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente' || user?.rol === 'Gerente Comercial';

    // Si se pasa userId explícito (desde un filtro), se usa ese. 
    // Si no, si no es privilegiado, se usa su propio ID.
    const fetchId = params?.userId || (!isPrivileged ? user?.id : undefined);

    const mesNombre = MESES_NOMBRES[params?.mes ?? new Date().getMonth()].toLowerCase();
    const anio = params?.anio ?? new Date().getFullYear().toString();

    apiGetProspectos({ mes: mesNombre, anio, userId: fetchId })
      .then(data => { if (!cancelled) setProspectos(data.map(p => toProspecto(p, params?.mes))); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar prospectos'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user, params?.mes, params?.anio, params?.userId]);

  const refresh = useCallback(() => {
    setLoading(true);
    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente' || user?.rol === 'Gerente Comercial';
    const fetchId = params?.userId || (!isPrivileged ? user?.id : undefined);
    const mesNombre = MESES_NOMBRES[params?.mes ?? new Date().getMonth()];
    const anio = params?.anio ?? '2026';

    return apiGetProspectos({ mes: mesNombre, anio, userId: fetchId })
      .then(data => { setProspectos(data.map(toProspecto)); })
      .catch(err => { setError(err.message ?? 'Error al cargar prospectos'); })
      .finally(() => { setLoading(false); });
  }, [user, params?.mes, params?.anio, params?.userId]);

  const addProspecto = useCallback(async (prospecto: Omit<Prospecto, 'id'>) => {
    try {
      // Separar campos de solo lectura o mapeo interno del payload de la API
      const { etapa: _etapa, user_create, agente, tipo, seguimientos, ...payload } = prospecto;
      const created = await apiCreateProspecto(payload);
      setProspectos(prev => [...prev, toProspecto(created)]);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear prospecto');
      throw err;
    }
  }, []);

  const updateProspecto = useCallback(async (id: string | number, changes: Partial<Prospecto>) => {
    try {
      // Separar campos de solo lectura o mapeo interno del payload de la API
      const { user_create, agente, tipo, seguimientos, ...others } = changes;

      const apiPayload = {
        ...others,
        ...(changes.etapa !== undefined && { etapa: toApiEtapa(changes.etapa) }),
      };
      const updated = await apiUpdateProspecto(id, apiPayload);
      setProspectos(prev => prev.map(p => (p.id === id ? toProspecto(updated) : p)));
      // Refrescar para asegurar consistencia
      await refresh();
    } catch (err) {
      setError((err as Error).message ?? 'Error al actualizar prospecto');
      throw err;
    }
  }, [refresh]);

  const deleteProspecto = useCallback(async (id: string | number) => {
    try {
      await apiDeleteProspecto(id);
      setProspectos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError((err as Error).message ?? 'Error al eliminar prospecto');
      throw err;
    }
  }, []);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  return { prospectos, loading, error, modalVisible, addProspecto, updateProspecto, deleteProspecto, openModal, closeModal, refresh };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useOportunidades — conectado a API real
// ═══════════════════════════════════════════════════════════
export const useOportunidades = (params?: { mes: number; anio: string; userId?: string | number }) => {
  const { user } = useAuth();
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial desde la API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Visibilidad: Solo Admin y Jefe Comercial ven todo. Otros ven solo lo suyo.
    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente' || user?.rol === 'Gerente Comercial';
    const fetchId = params?.userId || (!isPrivileged ? user?.id : undefined);

    const mesNombre = MESES_NOMBRES[params?.mes ?? new Date().getMonth()].toLowerCase();
    const anio = params?.anio ?? new Date().getFullYear().toString();

    apiGetOportunidades({ mes: mesNombre, anio, userId: fetchId })
      .then(data => { if (!cancelled) setOportunidades(data.map(o => toOportunidad(o, params?.mes))); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar oportunidades'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, params?.mes, params?.anio, params?.userId]);

  const addOportunidad = useCallback(async (oportunidad: Omit<Oportunidad, 'id'>) => {
    try {
      const payload: Partial<OportunidadAPI> = {
        nombre_oportunidad: oportunidad.nombre,
        prospecto_id: String(oportunidad.clienteId),
        plan_id: Number(oportunidad.fk_plan),
        plazo_id: Number(oportunidad.fk_plazo),
        financiamiento_id: oportunidad.fk_financiamiento ? Number(oportunidad.fk_financiamiento) : null,
        estado: oportunidad.etapa,
        producto: oportunidad.producto,
        fuente: oportunidad.fuente,
        notas: oportunidad.notas,
        fecha: oportunidad.fecha,
        mes: oportunidad.mes,
      };
      const created = await apiCreateOportunidad(payload);
      setOportunidades(prev => [...prev, toOportunidad(created)]);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear oportunidad');
      throw err;
    }
  }, []);

  const updateOportunidad = useCallback(async (id: number | string, changes: Partial<Oportunidad>) => {
    try {
      const payload: Partial<OportunidadAPI> = {
        ...(changes.nombre && { nombre_oportunidad: changes.nombre }),
        ...(changes.clienteId && { prospecto_id: String(changes.clienteId) }),
        ...(changes.fk_plan && { plan_id: Number(changes.fk_plan) }),
        ...(changes.fk_plazo && { plazo_id: Number(changes.fk_plazo) }),
        ...(changes.fk_financiamiento !== undefined && { financiamiento_id: changes.fk_financiamiento ? Number(changes.fk_financiamiento) : null }),
        ...(changes.etapa && { estado: changes.etapa }),
        ...(changes.producto && { producto: changes.producto }),
        ...(changes.fuente && { fuente: changes.fuente }),
        ...(changes.notas !== undefined && { notas: changes.notas }),
        ...(changes.fecha && { fecha: changes.fecha }),
        ...(changes.mes !== undefined && { mes: changes.mes }),
      };
      const updated = await apiUpdateOportunidad(id, payload);
      setOportunidades(prev => prev.map(o => (o.id === id ? toOportunidad(updated) : o)));
    } catch (err) {
      setError((err as Error).message ?? 'Error al actualizar oportunidad');
      throw err;
    }
  }, []);

  const deleteOportunidad = useCallback(async (id: number | string) => {
    try {
      await apiDeleteOportunidad(id);
      setOportunidades(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      setError((err as Error).message ?? 'Error al eliminar oportunidad');
      throw err;
    }
  }, []);

  const openModal = useCallback(() => setModalVisible(true), []);
  const closeModal = useCallback(() => setModalVisible(false), []);

  return { oportunidades, loading, error, modalVisible, addOportunidad, updateOportunidad, deleteOportunidad, openModal, closeModal };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useTareas — conectado a API real
// ═══════════════════════════════════════════════════════════
export const useTareas = (params?: { mes: number; anio: string; userId?: string | number }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarn } = useNotification();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTareas = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Visibilidad: Solo Admin y Jefe Comercial ven todo. Otros ven solo lo suyo.
    const isPrivileged = user?.rol === 'Admin' || user?.rol === 'Administrador' || user?.rol === 'Jefe Comercial' || user?.rol === 'Gerente' || user?.rol === 'Gerente Comercial';
    const fetchId = params?.userId || (!isPrivileged ? user?.id : undefined);

    const mesNombre = MESES_NOMBRES[params?.mes ?? new Date().getMonth()];
    const anio = params?.anio ?? '2026';

    apiGetTareas({ mes: mesNombre, anio, userId: fetchId })
      .then(data => { if (!cancelled) setTareas(data.map(toTarea)); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar tareas'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user, params?.mes, params?.anio, params?.userId]);

  useEffect(() => {
    const cancel = fetchTareas();
    return cancel;
  }, [fetchTareas]);

  const addTarea = useCallback(async (tarea: Partial<TareaAPI>) => {
    try {
      const created = await apiCreateTarea(tarea);
      showSuccess('Tarea creada exitosamente');
      setTareas(prev => [...prev, toTarea(created)]);
    } catch (err) {
      notifyApiError(err, { showError, showWarn }, 'Error al crear tarea');
      throw err;
    }
  }, [showSuccess, showError, showWarn]);

  const updateTarea = useCallback(async (id: number | string, changes: Partial<TareaAPI>) => {
    try {
      const updated = await apiUpdateTarea(id, changes);
      showSuccess('Tarea actualizada exitosamente');
      setTareas(prev => prev.map(t => (t.id === id ? toTarea(updated) : t)));
    } catch (err) {
      notifyApiError(err, { showError, showWarn }, 'Error al actualizar tarea');
      throw err;
    }
  }, [showSuccess, showError, showWarn]);

  const deleteTarea = useCallback(async (id: number | string) => {
    try {
      await apiDeleteTarea(id);
      showSuccess('Tarea eliminada');
      setTareas(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      notifyApiError(err, { showError, showWarn }, 'Error al eliminar tarea');
      throw err;
    }
  }, [showSuccess, showError, showWarn]);

  return { tareas, loading, error, addTarea, updateTarea, deleteTarea, refresh: fetchTareas };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useForecast
// ═══════════════════════════════════════════════════════════
export const useForecast = (params: { userId?: string | number; mes: number; anio: string }) => {
  const [metas, setMetas] = useState<Meta | null>(null);
  const [allMetas, setAllMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    const mesNombre = MESES_NOMBRES[params.mes];
    try {
      if (params.userId) {
        const data = await apiGetForecastsByUser(params.userId, { mes: mesNombre, anio: params.anio });

        if (data && !Array.isArray(data) && 'total' in data) {
          // New format for Jefe/Admin
          setMetas(data.total);
          setAllMetas(data.detalle || []);
        } else {
          // Old format or Agent format
          const metasArray = data as Meta[];
          setMetas(metasArray && metasArray.length > 0 ? metasArray[0] : null);
          setAllMetas(metasArray || []);
        }
      } else {
        const data = await apiGetForecastsFilter({ mes: mesNombre, anio: params.anio });

        if (data && !Array.isArray(data) && 'total' in data) {
          setMetas(data.total);
          setAllMetas(data.detalle || []);
        } else {
          const metasArray = data as Meta[];
          setAllMetas(metasArray || []);
          if (metasArray && metasArray.length > 0) {
            const globalMeta: Meta = {
              mes: mesNombre,
              anio: Number(params.anio),
              metaProspectos: metasArray.reduce((acc, m) => acc + (m.metaProspectos || 0), 0),
              metaOportunidades: metasArray.reduce((acc, m) => acc + (m.metaOportunidades || 0), 0),
              metaCierres: metasArray.reduce((acc, m) => acc + (m.metaCierres || 0), 0),
              metaIngresos: metasArray.reduce((acc, m) => acc + (m.metaIngresos || 0), 0),
            };
            setMetas(globalMeta);
          } else {
            setMetas(null);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching forecasts", err);
      setMetas(null);
      setAllMetas([]);
    } finally {
      setLoading(false);
    }
  }, [params.userId, params.mes, params.anio]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { metas, allMetas, loading, refresh: fetchForecast };
};

// ─── useDashboardJefeDetails ──────────────────────────────────
export const useDashboardJefeDetails = (params: { mes: number; anio: string; grupoId?: string | number }) => {
  const [details, setDetails] = useState<DashboardJefeDetailsAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const mesNombre = MESES_NOMBRES[params.mes];
    try {
      const data = await apiGetDashboardJefeDetails({ mes: mesNombre, anio: params.anio, grupoId: params.grupoId });
      setDetails(data || []);
    } catch (err) {
      console.error("Error fetching jefe dashboard details", err);
      setError((err as Error).message ?? 'Error al cargar detalles del dashboard');
    } finally {
      setLoading(false);
    }
  }, [params.mes, params.anio, params.grupoId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { details, loading, error, refresh: fetchDetails };
};
