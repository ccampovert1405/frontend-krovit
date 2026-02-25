import { useState, useMemo, useCallback, useEffect } from 'react';
import { Prospecto, Oportunidad, EtapaAIDA } from '@/types';
import {
  apiGetProspectos, apiCreateProspecto, apiUpdateProspecto, apiDeleteProspecto,
  apiGetOportunidades, apiCreateOportunidad, apiUpdateOportunidad, apiDeleteOportunidad,
  ProspectoAPI, OportunidadAPI,
} from '@/services/api';
import { TAREAS } from '@/data/sampleData';

// ─── Mapa etapa API → EtapaAIDA del frontend ─────────────────
const ETAPA_MAP: Record<string, EtapaAIDA> = {
  // Valores que devuelve el backend (mayúsculas)
  'ATENCION': 'Atención',
  'INTERES': 'Interés',
  'DESEO': 'Deseo',
  'ACCION': 'Acción',
  // Por si el backend ya devuelve el valor correcto
  'Atención': 'Atención',
  'Interés': 'Interés',
  'Deseo': 'Deseo',
  'Acción': 'Acción',
};
const mapEtapa = (raw?: string): EtapaAIDA => ETAPA_MAP[raw ?? ''] ?? 'Atención';

// ─── Mapa EtapaAIDA → enum del backend ───────────────────────
const ETAPA_TO_API: Record<string, string> = {
  'Atención': 'ATENCION',
  'Interés': 'INTERES',
  'Deseo': 'DESEO',
  'Acción': 'ACCION',
  // Por si ya viene en mayúsculas (re-envío seguro)
  'ATENCION': 'ATENCION',
  'INTERES': 'INTERES',
  'DESEO': 'DESEO',
  'ACCION': 'ACCION',
};
const toApiEtapa = (etapa?: string): string | undefined =>
  etapa ? (ETAPA_TO_API[etapa] ?? etapa.toUpperCase()) : undefined;


// ─── Helpers de normalización ────────────────────────────────
const toProspecto = (p: ProspectoAPI): Prospecto => ({
  id: p.id,
  nombre: p.nombre ?? '',
  apellido: p.apellido ?? '',
  email: p.email ?? '',
  telefono: p.telefono ?? '',
  celular: p.celular ?? '',
  ciudad: p.ciudad ?? '',
  empresa: p.empresa ?? '',
  etapa: mapEtapa(p.etapa),   // convierte ATENCION → 'Atención', etc.
  fuente: p.fuente ?? '',
  tipo: '',          // campo interno del frontend, no viene del backend
  fecha: '',         // campo interno del frontend, no viene del backend
  notas: p.notas,
  mes: p.mes ?? new Date().getMonth(),
  agente: p.agente ?? '',
});

const toOportunidad = (o: OportunidadAPI): Oportunidad => ({
  id: o.id,
  nombre: o.nombre ?? '',
  cliente: o.cliente ?? '',
  clienteId: o.clienteId,
  producto: o.producto ?? '',
  plan: o.plan ?? 0,
  fuente: o.fuente ?? '',
  notas: o.notas,
  valor: o.valor ?? 0,
  probabilidad: o.probabilidad ?? 0,
  etapa: (o.etapa as Oportunidad['etapa']) ?? 'Calificación',
  fecha: o.fecha ?? '',
  mes: o.mes ?? new Date().getMonth(),
  agente: o.agente ?? '',
  color: o.color,
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
interface FilterParams { mes: number; agente: string; }

export const useFilteredData = ({ mes, agente }: FilterParams) => {
  const { prospectos } = useProspectos();
  const { oportunidades } = useOportunidades();
  const tareasFiltradas = useMemo(() => TAREAS.filter(t => t.mes === mes), [mes]);

  const filtrar = useCallback(<T extends { mes: number; agente: string }>(arr: T[]): T[] => {
    let result = arr.filter(item => item.mes === mes);
    if (agente !== 'Todos') result = result.filter(item => item.agente === agente);
    return result;
  }, [mes, agente]);

  return {
    prospectosFiltrados: useMemo(() => filtrar(prospectos), [filtrar, prospectos]),
    oportunidadesFiltradas: useMemo(() => filtrar(oportunidades), [filtrar, oportunidades]),
    tareasFiltradas,
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
    const etapas: EtapaAIDA[] = ['Atención', 'Interés', 'Deseo', 'Acción'];
    return etapas.map(etapa => ({ etapa, count: prospectos.filter(p => p.etapa === etapa).length }));
  }, [prospectos]);
};

// ═══════════════════════════════════════════════════════════
// HOOK: useProspectos — conectado a API real
// ═══════════════════════════════════════════════════════════
export const useProspectos = () => {
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial desde la API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGetProspectos()
      .then(data => { if (!cancelled) setProspectos(data.map(toProspecto)); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar prospectos'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const addProspecto = useCallback(async (prospecto: Omit<Prospecto, 'id'>) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { etapa: _etapa, ...payload } = prospecto; // el backend asigna etapa=ATENCION por defecto
      const created = await apiCreateProspecto(payload);
      setProspectos(prev => [...prev, toProspecto(created)]);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear prospecto');
      throw err;
    }
  }, []);

  const updateProspecto = useCallback(async (id: string | number, changes: Partial<Prospecto>) => {
    try {
      // Convertir etapa al formato del backend antes de enviar
      const apiPayload = {
        ...changes,
        ...(changes.etapa !== undefined && { etapa: toApiEtapa(changes.etapa) }),
      };
      const updated = await apiUpdateProspecto(id, apiPayload);
      setProspectos(prev => prev.map(p => (p.id === id ? toProspecto(updated) : p)));
    } catch (err) {
      setError((err as Error).message ?? 'Error al actualizar prospecto');
      throw err;
    }
  }, []);

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

  return { prospectos, loading, error, modalVisible, addProspecto, updateProspecto, deleteProspecto, openModal, closeModal };
};

// ═══════════════════════════════════════════════════════════
// HOOK: useOportunidades — conectado a API real
// ═══════════════════════════════════════════════════════════
export const useOportunidades = () => {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial desde la API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGetOportunidades()
      .then(data => { if (!cancelled) setOportunidades(data.map(toOportunidad)); })
      .catch(err => { if (!cancelled) setError(err.message ?? 'Error al cargar oportunidades'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const addOportunidad = useCallback(async (oportunidad: Omit<Oportunidad, 'id'>) => {
    try {
      const created = await apiCreateOportunidad(oportunidad);
      setOportunidades(prev => [...prev, toOportunidad(created)]);
    } catch (err) {
      setError((err as Error).message ?? 'Error al crear oportunidad');
      throw err;
    }
  }, []);

  const updateOportunidad = useCallback(async (id: number, changes: Partial<Oportunidad>) => {
    try {
      const updated = await apiUpdateOportunidad(id, changes);
      setOportunidades(prev => prev.map(o => (o.id === id ? toOportunidad(updated) : o)));
    } catch (err) {
      setError((err as Error).message ?? 'Error al actualizar oportunidad');
      throw err;
    }
  }, []);

  const deleteOportunidad = useCallback(async (id: number) => {
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
