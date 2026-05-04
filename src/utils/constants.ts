// ═══════════════════════════════════════════════════════════
// CONSTANTES Y CONFIGURACIÓN DE TEMA
// ═══════════════════════════════════════════════════════════

// ─── Colores de Marca ───
export const COLORS = {
  // Primarios
  red: '#E31E24',
  redDark: '#C41920',
  redLight: '#FEF2F2',
  redBorder: '#FECACA',

  // Neutros
  black: '#1A1A1A',
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',

  // Semánticos
  green: '#10B981',
  greenLight: '#D1FAE5',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  yellow: '#F59E0B',
  yellowLight: '#FEF3C7',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
} as const;

// ─── Nombres de Meses ───
export const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

// ─── Opciones de Planes ($13,000 a $80,000 en múltiplos de $5,000) ───
export const PLAN_OPTIONS: number[] = [];
for (let i = 13000; i <= 80000; i += 5000) {
  PLAN_OPTIONS.push(i);
}

// ─── Etapas AIDA ───
export const ETAPAS_AIDA = ['ATENCION', 'INTERES', 'DESEO', 'ACCION'] as const;

export const ETAPA_COLORS = {
  'ATENCION': COLORS.blue,
  'INTERES': COLORS.yellow,
  'DESEO': COLORS.purple,
  'ACCION': COLORS.green,
} as const;

// ─── Etapas Oportunidades ───
export const ETAPAS_OPORTUNIDAD = ['Calificación', 'Propuesta', 'Negociación', 'Cierre', 'Caída'] as const;

export const ETAPA_OPORTUNIDAD_COLORS = {
  'Calificación': COLORS.gray500,
  'Propuesta': COLORS.blue,
  'Negociación': COLORS.yellow,
  'Cierre': COLORS.purple,
  'Ganada': COLORS.green,
  'Perdida': COLORS.red,
  'Caída': COLORS.red,
} as const;

// ─── Fuentes de Prospección ───
export const FUENTES_PROSPECCION = [
  'Web',
  'Redes Sociales',
  'Referido',
  'Evento',
  'Llamada',
  'Directo',
  'Pauta en redes'
] as const;

// ─── Tipos de Tareas ───
export const TIPOS_TAREA = ['llamada', 'correo', 'visita', 'reunión'] as const;

export const TIPO_TAREA_ICONS = {
  'llamada': 'pi-phone',
  'correo': 'pi-envelope',
  'visita': 'pi-map-marker',
  'reunión': 'pi-video',
} as const;

// ─── Prioridades ───
export const PRIORIDADES = ['alta', 'media', 'baja'] as const;

export const PRIORIDAD_COLORS = {
  'alta': { color: COLORS.red, bg: COLORS.redLight },
  'media': { color: COLORS.yellow, bg: COLORS.yellowLight },
  'baja': { color: COLORS.green, bg: COLORS.greenLight },
} as const;
