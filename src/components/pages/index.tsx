import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import {
  PageHeader,
  CustomBadge,
  FilterTabs,
  EmptyState,
} from '@/components/ui';
import { useTareas } from '@/hooks';
import {
  COLORS,
} from '@/utils/constants';

// OPORTUNIDADES PAGE y TAREAS PAGE locales fueron eliminadas para usar las de sus propios directorios


// ═══════════════════════════════════════════════════════════
// PLANIFICACION PAGE
// ═══════════════════════════════════════════════════════════
export const PlanificacionPage: React.FC = () => {
  const [filter, setFilter] = useState('Todas');
  const { tareas } = useTareas();
  const visitas = tareas.filter(t => t.tipo === 'visita').length;
  const digitales = tareas.filter(t => ['llamada', 'correo'].includes(t.tipo)).length;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);

  const hoyTasks = tareas.filter(t => {
    const d = new Date(t.fecha);
    return d >= hoy && d < manana;
  }).length;

  const mananaTasks = tareas.filter(t => {
    const d = new Date(t.fecha);
    const mLimit = new Date(manana);
    mLimit.setDate(manana.getDate() + 1);
    return d >= manana && d < mLimit;
  }).length;

  return (
    <div>
      <PageHeader title="Planificación" subtitle="Programa visitas, llamadas y actividades con prospectos">
        <Button label="Nueva Actividad" icon="pi pi-plus" style={{ backgroundColor: COLORS.red, borderColor: COLORS.red }} />
      </PageHeader>

      <div className="flex gap-3 mb-4 flex-wrap">
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.red }}>{hoyTasks}</div>
          <div className="text-sm text-500">Hoy</div>
        </Card>
        <Card className="shadow-1 flex-1 text-center" style={{ minWidth: '120px' }}>
          <div className="text-3xl font-bold" style={{ color: COLORS.yellow }}>{mananaTasks}</div>
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
        {tareas.length === 0 ? <EmptyState message="No hay actividades programadas" /> :
          tareas.map(tarea => {
            const iconMap: Record<string, string> = { 'llamada': 'pi-phone', 'correo': 'pi-envelope', 'visita': 'pi-map-marker', 'reunión': 'pi-users' };
            const colorMap: Record<string, string> = { 'llamada': COLORS.blue, 'correo': COLORS.yellow, 'visita': COLORS.green, 'reunión': COLORS.purple };
            return (
              <div key={tarea.id} className="mb-4">
                <div className="text-sm font-semibold text-500 uppercase mb-2">
                  {new Date(tarea.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div className="flex align-items-center gap-3 p-3 border-round-lg" style={{ backgroundColor: COLORS.gray50, borderLeft: `4px solid ${colorMap[tarea.tipo]}` }}>
                  <div className="flex align-items-center justify-content-center border-round-lg" style={{ width: '40px', height: '40px', backgroundColor: `${colorMap[tarea.tipo]}18` }}>
                    <i className={`pi ${iconMap[tarea.tipo]}`} style={{ color: colorMap[tarea.tipo], fontSize: '1.1rem' }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-900">{tarea.titulo}</div>
                    <div className="text-sm text-500 flex align-items-center gap-2">
                      <i className="pi pi-clock mr-1" style={{ fontSize: '0.7rem' }} /> {new Date(tarea.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <i className="pi pi-user mr-1" style={{ fontSize: '0.7rem', marginLeft: '8px' }} /> {tarea.contacto}
                    </div>
                  </div>
                  <div className="text-right">
                    <CustomBadge color={colorMap[tarea.tipo]} bg={`${colorMap[tarea.tipo]}18`}>{tarea.tipo}</CustomBadge>
                  </div>
                </div>
              </div>
            );
          })
        }
      </Card>

    </div>
  );
};

