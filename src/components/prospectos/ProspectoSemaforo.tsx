import React, { useMemo } from 'react';
import { Tag } from 'primereact/tag';
import { Prospecto } from '@/types';
import { COLORS } from '@/utils/constants';

interface ProspectoSemaforoProps {
  prospecto: Prospecto;
  showText?: boolean;
}

export interface SemaforoInfo {
  color: string;
  bg: string;
  text: string;
  tooltip: string;
  hours: number;
  level: 'green' | 'yellow' | 'orange' | 'red' | 'libre';
  value: number;
  isLocked: boolean;
  icon: string;
}

export const getSemaforoInfo = (prospecto: Prospecto): SemaforoInfo => {
  const now = new Date();
  
  // Obtener fecha del último seguimiento o creación
  let hasFollowUps = false;
  let refTime = prospecto.created_at ? new Date(prospecto.created_at) : now;
  if (prospecto.seguimientos && prospecto.seguimientos.length > 0) {
    const sorted = [...prospecto.seguimientos].sort((a, b) => 
      new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
    );
    const lastDate = new Date(sorted[0].fecha_registro);
    if (!isNaN(lastDate.getTime())) {
      refTime = lastDate;
      hasFollowUps = true;
    }
  }

  // Si la fecha de referencia no es válida
  if (isNaN(refTime.getTime())) {
    refTime = now;
  }

  // Diferencia de tiempo absoluta (independiente de la zona horaria)
  const diffMs = Math.max(0, now.getTime() - refTime.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  // Formateador en zona horaria de Ecuador (America/Guayaquil, UTC-5)
  const formatEcuadorDate = (date: Date) => {
    try {
      return date.toLocaleString('es-EC', {
        timeZone: 'America/Guayaquil',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' (Ecuador)';
    } catch {
      return date.toString();
    }
  };

  const formattedRef = formatEcuadorDate(refTime);
  const timeDiffString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  const tooltipText = `Última actividad: ${formattedRef}\nSin seguimiento por: ${timeDiffString}.`;

  // Comprobar asignación y estado bloqueado (candado cerrado <= 5 días)
  const hasAgent = !!(prospecto.user_create_id || prospecto.user_create || (prospecto.agente && prospecto.agente !== '—'));
  const isLocked = hasAgent && totalHours <= 120;
  const icon = isLocked ? 'pi pi-lock' : 'pi pi-lock-open';

  // Texto del Tag en la columna de SEGUIMIENTO
  const text = hasFollowUps ? 'En seguimiento' : 'Sin gestión';

  // Estado y color según rango de horas:
  // - Verde <= 24h
  // - Amarillo 24h - 48h
  // - Naranja 48h - 72h
  // - Rojo > 72h (incluyendo inactividad mayor a 5 días)
  if (totalHours <= 24) {
    return {
      color: COLORS.green,
      bg: `${COLORS.green}15`,
      text,
      tooltip: tooltipText,
      hours: totalHours,
      level: 'green',
      value: 0,
      isLocked,
      icon
    };
  }

  if (totalHours <= 48) {
    return {
      color: COLORS.yellow,
      bg: `${COLORS.yellow}15`,
      text,
      tooltip: tooltipText,
      hours: totalHours,
      level: 'yellow',
      value: 1,
      isLocked,
      icon
    };
  }

  if (totalHours <= 72) {
    return {
      color: COLORS.orange,
      bg: `${COLORS.orange}15`,
      text,
      tooltip: tooltipText,
      hours: totalHours,
      level: 'orange',
      value: 2,
      isLocked,
      icon
    };
  }

  // Más de 72h -> Rojo
  return {
    color: COLORS.red,
    bg: `${COLORS.red}15`,
    text,
    tooltip: tooltipText,
    hours: totalHours,
    level: totalHours > 120 || !hasAgent ? 'libre' : 'red',
    value: 3,
    isLocked,
    icon
  };
};

export const ProspectoSemaforo: React.FC<ProspectoSemaforoProps> = ({ prospecto, showText = true }) => {
  const info = useMemo(() => getSemaforoInfo(prospecto), [prospecto]);

  if (!showText) {
    return (
      <span
        className="p-tooltip-target"
        title={info.tooltip}
        style={{
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: info.color,
          boxShadow: `0 0 6px ${info.color}80`,
          verticalAlign: 'middle',
          cursor: 'help'
        }}
      />
    );
  }

  return (
    <Tag
      value={info.text}
      title={info.tooltip}
      style={{
        backgroundColor: info.bg,
        color: info.color,
        borderRadius: '8px',
        fontWeight: 600,
        padding: '4px 10px',
        fontSize: '0.8rem',
        border: `1px solid ${info.color}30`,
        cursor: 'help'
      }}
    />
  );
};
