// ═══════════════════════════════════════════════════════════
// TIPOS PRINCIPALES DEL CRM
// ═══════════════════════════════════════════════════════════

// ─── Agentes ───
export interface Agente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  rol?: 'Administrador' | 'Supervisor' | 'Agente';
  equipo?: string;
  activo: boolean;
}

// ─── Prospectos ───
export type EtapaAIDA = 'Atención' | 'Interés' | 'Deseo' | 'Acción';
export type TipoProducto = 'Vehículo' | 'Vivienda' | 'Remodelación';
export type FuenteProspecto = 'Web' | 'Redes Sociales' | 'Referido' | 'Evento' | 'Llamada' | 'Directo';

export interface Prospecto {
  id: string | number;
  nombre: string;
  apellido?: string;
  empresa?: string;
  email: string;
  telefono: string;
  celular?: string;
  direccion?: string;
  ciudad?: string;
  cargo?: string;
  producto?: TipoProducto;
  grupo?: string;
  plan?: number;
  marca?: string;
  modelo?: string;
  fuente: FuenteProspecto | string;
  tipo: TipoProducto | string;
  etapa: EtapaAIDA;
  notas?: string;
  fecha: string;
  mes: number;
  agente: string;
  color?: string;
}

// ─── Oportunidades ───
export type EtapaOportunidad = 'Calificación' | 'Propuesta' | 'Negociación' | 'Cierre' | 'Ganada' | 'Perdida';

export type TipoProductoOportunidad = 'Vehículo' | 'Vivienda' | 'Remodelación';

export interface Oportunidad {
  id: number;
  nombre: string;
  cliente: string;          // nombre del prospecto/cliente
  clienteId?: number;       // id del prospecto seleccionado
  producto: TipoProductoOportunidad | string;
  plan: number | string;    // monto del plan seleccionado
  fuente: string;
  notas?: string;
  valor: number;
  probabilidad: number;
  etapa: EtapaOportunidad;
  fecha: string;
  mes: number;
  agente: string;
  color?: string;
}

// ─── Tareas ───
export type PrioridadTarea = 'alta' | 'media' | 'baja';
export type TipoTarea = 'llamada' | 'correo' | 'visita' | 'reunión';

export interface Tarea {
  id: number;
  titulo: string;
  descripcion?: string;
  prioridad: PrioridadTarea;
  tipo: TipoTarea;
  fecha: string;
  mes: number;
  agente: string;
  contacto: string;
  completada: boolean;
}

// ─── Actividades ───
export type TipoActividad = 'Llamada' | 'Videollamada' | 'Visita Terreno' | 'Reunión';

export interface Actividad {
  id: number;
  titulo: string;
  hora: string;
  contacto: string;
  tipo: TipoActividad;
  duracion: string;
  dia: string;
  mes: number;
  agente: string;
  color?: string;
  icon?: string;
  ubicacion?: string;
}

// ─── Formulario Nuevo Prospecto ───
export interface NuevoProspectoForm {
  nombre: string;
  apellido: string;
  empresa: string;
  cargo: string;
  email: string;
  telefono: string;
  celular: string;
  direccion: string;
  ciudad: string;
  producto: string;
  grupo: string;
  plan: string;
  marca: string;
  modelo: string;
  fuente: string;
  etapa: EtapaAIDA;
  notas: string;
}

// ─── Navegación ───
export type PageKey =
  | 'login'
  | 'forgot-password'
  | 'dashboard'
  | 'prospectos'
  | 'planificacion'
  | 'oportunidades'
  | 'tareas'
  | 'forecast'
  | 'actividades';

export interface MenuItem {
  key: PageKey;
  label: string;
  icon: string;
}

// ─── Filtros Dashboard ───
export interface DashboardFilters {
  selectedMes: number;
  selectedAgente: string;
}

// ─── KPIs ───
export interface KPIData {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon: string;
  color: string;
}
