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
export type EtapaAIDA = 'ATENCION' | 'INTERES' | 'DESEO' | 'ACCION';
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
  cedula?: string;
  producto?: TipoProducto;
  grupo?: string;
  plan?: number;
  marca?: string;
  modelo?: string;
  fuente: FuenteProspecto | string;
  tipo: TipoProducto | string;
  etapa: EtapaAIDA;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  mes: number;
  agente?: string;
  user_create_id?: number | string;
  user_create?: {
    userID: string;
    nombres: string;
    apellidos: string;
  };
  seguimientos?: Seguimiento[];
}

// ─── Oportunidades ───
export type EtapaOportunidad = 'Calificación' | 'Propuesta' | 'Negociación' | 'Cierre' | 'Ganada' | 'Perdida' | 'Caída';

export type TipoProductoOportunidad = 'Vehículo' | 'Vivienda' | 'Remodelación';

export enum EstadoSeguimiento {
  NO_CONTESTA = 'NO CONTESTA',
  VOLVER_A_LLAMAR = 'VOLVER A LLAMAR',
  NO_INTERESA = 'NO INTERESA',
  NUMERO_EQUIVOCADO = 'NÚMERO EQUIVOCADO',
}

export enum EstadoOportunidadSeguimiento {
  EN_SEGUIMIENTO = 'En seguimiento',
  CERRADA = 'Cerrada',
}

export interface Seguimiento {
  id: string | number;
  oportunidad_id?: string | number;
  prospect_id?: string | number;
  gestion_realizada?: string;
  estado: EstadoOportunidadSeguimiento;
  tipo_seguimiento: EstadoSeguimiento;
  fecha?: string;
  hora?: string;
  minuto?: string;
  calificacion_oportunidad?: string;
  fecha_registro: string;
  usuario_id: string;
  numero_seguimiento: number;
}

export interface Oportunidad {
  id: string | number;
  nombre: string;
  cliente: string;          // nombre del prospecto/cliente
  clienteId?: number | string; // id del prospecto seleccionado
  producto: TipoProductoOportunidad | string;
  plan: number | string;    // monto del plan seleccionado
  subProducto?: string;     // ej: "72 Meses"
  compromiso?: string;      // ej: "30% - 21 Cuotas"
  fuente: string;
  notas?: string;
  valor: number;
  probabilidad: number;
  etapa: EtapaOportunidad;
  fecha: string;
  created_at?: string;
  mes: number;
  agente: string;
  user_create_id?: number | string;
  user_create?: {
    userID: string;
    nombres: string;
    apellidos: string;
  };
  color?: string;
  fk_plazo?: number | null;
  fk_plan?: number | null;
  fk_financiamiento?: number | null;
  planData?: PlanFinancieroData;
  seguimientos?: Seguimiento[];
}

// ─── Tareas ───
export type PrioridadTarea = 'alta' | 'media' | 'baja';
export type TipoTarea = 'llamada' | 'correo' | 'visita' | 'reunión';
export type EstadoTarea = 'PENDIENTE' | 'EN SEGUIMIENTO' | 'FINALIZADO';

export interface Tarea {
  id: string | number;
  titulo: string;
  descripcion?: string;
  prioridad: PrioridadTarea;
  tipo: TipoTarea;
  fecha: string;
  hora?: string;
  mes: number;
  agente: string;
  user_create_id?: number | string;
  user_create?: {
    userID: string;
    nombres: string;
    apellidos: string;
  };
  contacto: string;
  completada: boolean;
  recordatorio?: string;
  cliente_id?: string | number | null;
  oportunidad_id?: string | number | null;
  estado: EstadoTarea;
}

// ─── Actividades ───
export type TipoActividad = 'Llamada' | 'Videollamada' | 'Visita Terreno' | 'Reunión';

export interface Actividad {
  id: number;
  titulo: string;
  fecha_inicio: string;
  hora_inicio: string;
  fecha_fin: string;
  hora_fin: string;
  contacto: string;
  tipo: string; // Uppercase: LLAMADA, VIDEOLLAMADA, VISITA, REUNION
  ubicacion_link: string;
  notas?: string;
  mes?: number;
  agente?: string;
}

// ─── Metas (Goals) ───
export interface Meta {
  id?: string | number;
  mes: string; // "Enero", "Febrero", etc.
  anio: number;
  metaProspectos?: number;
  metaOportunidades?: number;
  metaCierres?: number;
  metaIngresos?: number;
  user_id?: string;
  user?: {
    userID: string;
    nombres: string;
    apellidos: string;
  };
}


// ─── Formulario Nuevo Prospecto ───
export interface NuevoProspectoForm {
  nombre: string;
  apellido: string;
  empresa: string;
  cedula: string;
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

// ─── Grupos de Ventas ───
export interface GrupoVentas {
  id: string | number;
  nombre: string;
  descripcion?: string;
  jefeComercialId?: string;
  jefeComercial?: {
    userID: string;
    nombres: string;
    apellidos: string;
    rol?: string;
  };
  agentes?: {
    userID: string;
    nombres: string;
    apellidos: string;
    rol?: string;
  }[];
  leads?: boolean;
  agencia?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Navegación ───
export type PageKey =
  | 'login'
  | 'forgot-password'
  | 'dashboard'
  | 'dashboard-leads'
  | 'dashboard-gerente'
  | 'prospectos'
  | 'planificacion'
  | 'oportunidades'
  | 'tareas'
  | 'forecast'
  | 'actividades'
  | 'usuarios'
  | 'roles'
  | 'permisos'
  | 'leads'
  | 'grupos-ventas'
  | 'listas-precio'
  | 'plazos'
  | 'financiamientos';

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

// ─── Plan Financiero ───
export interface CompromisoOferta {
  tipo: string;             // ej: 30
  cuotas: number;           // ej: 21
  valor_financiamiento: number; // ej: 7245
}

export interface PlanFinancieroData {
  producto: string;                   // "Vehículo"
  subProducto: string;                // "72 Meses"
  montoBase: number;                  // 20000
  montoFinal: number;                 // 24840
  inscripcion: number;                // 1035
  cuotaMensual: number;               // 345
  compromiso?: CompromisoOferta;      // Opcional
}
// ─── Notificaciones ───
export interface RealtimeNotification {
  id: number;
  tipo: 'aviso' | 'asignacion' | 'venta';
  titulo: string;
  mensaje: string;
  leido: boolean;
  createdAt: string;
}
