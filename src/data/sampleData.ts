import { Agente, Prospecto, Oportunidad, Tarea, Actividad } from '@/types';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════

// ─── Agentes ───
export const AGENTES: Agente[] = [
  { id: 1, nombre: 'Roberto Mendoza', activo: true },
  { id: 2, nombre: 'Gabriela Torres', activo: true },
  { id: 3, nombre: 'Fernando Díaz', activo: true },
];

// ─── Prospectos ───
export const PROSPECTOS: Prospecto[] = [
  {
    id: 1,
    nombre: 'Ana Martínez',
    empresa: '',
    email: 'ana.martinez@email.com',
    telefono: '+58 424 555 9012',
    fuente: 'Redes Sociales',
    tipo: 'Vivienda',
    etapa: 'Atención',
    fecha: '27 ene 2026',
    mes: 0,
    agente: 'Roberto Mendoza',
    color: COLORS.blue
  },
  {
    id: 2,
    nombre: 'Laura Fernández',
    empresa: '',
    email: 'laura.fernandez@email.com',
    telefono: '+58 412 555 7890',
    fuente: 'Web',
    tipo: 'Vehículo',
    etapa: 'Interés',
    fecha: '27 ene 2026',
    mes: 0,
    agente: 'Gabriela Torres',
    color: COLORS.yellow
  },
  {
    id: 3,
    nombre: 'María García López',
    empresa: 'Inversiones García',
    email: 'maria.garcia@email.com',
    telefono: '+58 412 555 1234',
    fuente: 'Web',
    tipo: 'Vivienda',
    etapa: 'Interés',
    fecha: '27 ene 2026',
    mes: 0,
    agente: 'Roberto Mendoza',
    color: COLORS.yellow
  },
  {
    id: 4,
    nombre: 'Carlos Rodríguez',
    empresa: 'Comercial CR',
    email: 'carlos.rodriguez@email.com',
    telefono: '+58 414 555 5678',
    fuente: 'Referido',
    tipo: 'Vehículo',
    etapa: 'Deseo',
    fecha: '27 ene 2026',
    mes: 0,
    agente: 'Fernando Díaz',
    color: COLORS.purple
  },
  {
    id: 5,
    nombre: 'Pedro Sánchez',
    empresa: 'Construcciones PS',
    email: 'pedro.sanchez@email.com',
    telefono: '+58 416 555 3456',
    fuente: 'Evento',
    tipo: 'Remodelación',
    etapa: 'Acción',
    fecha: '27 ene 2026',
    mes: 0,
    agente: 'Gabriela Torres',
    color: COLORS.green
  },
  {
    id: 6,
    nombre: 'Lucía Romero',
    empresa: '',
    email: 'lucia.romero@email.com',
    telefono: '+58 412 555 4321',
    fuente: 'Web',
    tipo: 'Vivienda',
    etapa: 'Atención',
    fecha: '03 feb 2026',
    mes: 1,
    agente: 'Roberto Mendoza',
    color: COLORS.blue
  },
  {
    id: 7,
    nombre: 'Diego Herrera',
    empresa: 'Importaciones DH',
    email: 'diego.herrera@email.com',
    telefono: '+58 414 555 8765',
    fuente: 'Referido',
    tipo: 'Vehículo',
    etapa: 'Interés',
    fecha: '02 feb 2026',
    mes: 1,
    agente: 'Fernando Díaz',
    color: COLORS.yellow
  },
];

// ─── Oportunidades ───
export const OPORTUNIDADES: Oportunidad[] = [
  {
    id: 1,
    nombre: 'Sedan compacto',
    cliente: 'Laura Fernández',
    producto: 'Vehículo',
    plan: 28000,
    fuente: 'Web',
    valor: 28000,
    probabilidad: 20,
    etapa: 'Calificación',
    fecha: '28 feb',
    mes: 1,
    agente: 'Gabriela Torres',
    color: COLORS.gray500
  },
  {
    id: 2,
    nombre: 'Casa sector norte',
    cliente: 'María García',
    producto: 'Vivienda',
    plan: 60000,
    fuente: 'Referido',
    valor: 60000,
    probabilidad: 40,
    etapa: 'Cierre',
    fecha: '14 feb',
    mes: 1,
    agente: 'Roberto Mendoza',
    color: COLORS.blue
  },
  {
    id: 3,
    nombre: 'SUV Familiar',
    cliente: 'Carlos Rodríguez',
    producto: 'Vehículo',
    plan: 25000,
    fuente: 'Web',
    valor: 25000,
    probabilidad: 60,
    etapa: 'Negociación',
    fecha: '29 ene',
    mes: 0,
    agente: 'Fernando Díaz',
    color: COLORS.yellow
  },
  {
    id: 4,
    nombre: 'Remodelación cocina',
    cliente: 'Pedro Sánchez',
    producto: 'Remodelación',
    plan: 15000,
    fuente: 'Evento',
    valor: 15000,
    probabilidad: 80,
    etapa: 'Cierre',
    fecha: '24 ene',
    mes: 0,
    agente: 'Gabriela Torres',
    color: COLORS.purple
  },
  {
    id: 5,
    nombre: 'Apartamento Centro',
    cliente: 'Ana Martínez',
    producto: 'Vivienda',
    plan: 40000,
    fuente: 'Redes Sociales',
    valor: 40000,
    probabilidad: 100,
    etapa: 'Ganada',
    fecha: '20 ene',
    mes: 0,
    agente: 'Roberto Mendoza',
    color: COLORS.green
  },
];


// ─── Tareas ───
export const TAREAS: Tarea[] = [
  {
    id: 1,
    titulo: 'Llamar a María García',
    descripcion: 'Seguimiento propuesta vivienda sector norte',
    prioridad: 'alta',
    tipo: 'llamada',
    fecha: '20 ene 10:00',
    mes: 0,
    agente: 'Roberto Mendoza',
    contacto: 'María García López',
    completada: false
  },
  {
    id: 2,
    titulo: 'Enviar cotización actualizada',
    descripcion: 'Cotización SUV con financiamiento',
    prioridad: 'media',
    tipo: 'correo',
    fecha: '21 ene 14:00',
    mes: 0,
    agente: 'Fernando Díaz',
    contacto: 'Carlos Rodríguez',
    completada: false
  },
  {
    id: 3,
    titulo: 'Preparar contrato remodelación',
    descripcion: 'Documentos para firma de contrato',
    prioridad: 'alta',
    tipo: 'reunión',
    fecha: '22 ene 09:00',
    mes: 0,
    agente: 'Gabriela Torres',
    contacto: 'Pedro Sánchez',
    completada: false
  },
  {
    id: 4,
    titulo: 'Seguimiento post-venta',
    descripcion: 'Verificar satisfacción del cliente',
    prioridad: 'baja',
    tipo: 'llamada',
    fecha: '25 ene 11:00',
    mes: 0,
    agente: 'Roberto Mendoza',
    contacto: 'Ana Martínez',
    completada: false
  },
  {
    id: 5,
    titulo: 'Confirmar visita propiedad',
    descripcion: 'Confirmar cita con cliente',
    prioridad: 'alta',
    tipo: 'llamada',
    fecha: '03 feb 10:00',
    mes: 1,
    agente: 'Roberto Mendoza',
    contacto: 'Lucía Romero',
    completada: false
  },
];

// ─── Actividades ───
export const ACTIVIDADES: Actividad[] = [
  {
    id: 1,
    titulo: 'Llamada seguimiento financiamiento',
    hora: '11:00 - 11:30',
    contacto: 'Carlos Rodríguez',
    tipo: 'Llamada',
    duracion: '15 min',
    dia: 'Lunes 20 De Enero',
    mes: 0,
    agente: 'Fernando Díaz',
    color: COLORS.blue,
    icon: 'phone'
  },
  {
    id: 2,
    titulo: 'Videollamada presentación opciones',
    hora: '15:00 - 16:00',
    contacto: 'Laura Fernández',
    tipo: 'Videollamada',
    duracion: '30 min',
    dia: 'Martes 21 De Enero',
    mes: 0,
    agente: 'Gabriela Torres',
    color: COLORS.yellow,
    icon: 'video',
    ubicacion: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 3,
    titulo: 'Visita propiedad sector norte',
    hora: '10:00 - 11:30',
    contacto: 'María García López',
    tipo: 'Visita Terreno',
    duracion: '60 min',
    dia: 'Miércoles 22 De Enero',
    mes: 0,
    agente: 'Roberto Mendoza',
    color: COLORS.green,
    icon: 'map',
    ubicacion: 'Av. Principal, Sector Norte'
  },
  {
    id: 4,
    titulo: 'Firma de contrato',
    hora: '09:00 - 10:00',
    contacto: 'Pedro Sánchez',
    tipo: 'Reunión',
    duracion: '1440 min',
    dia: 'Jueves 23 De Enero',
    mes: 0,
    agente: 'Gabriela Torres',
    color: COLORS.purple,
    icon: 'file',
    ubicacion: 'Oficina'
  },
];
