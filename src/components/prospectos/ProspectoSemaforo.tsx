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
  level: 'green' | 'yellow' | 'orange' | 'red';
  value: number;
}

export const getSemaforoInfo = (prospecto: Prospecto): SemaforoInfo => {
  const hasSeguimientos = prospecto.seguimientos && prospecto.seguimientos.length > 0;
  
  if (hasSeguimientos) {
    return {
      color: COLORS.green,
      bg: `${COLORS.green}15`,
      text: 'Gestionado',
      tooltip: 'Este prospecto ya cuenta con seguimiento registrado.',
      hours: 0,
      level: 'green',
      value: 0
    };
  }

  const now = new Date();
  const createdTime = prospecto.created_at ? new Date(prospecto.created_at) : now;
  
  if (isNaN(createdTime.getTime())) {
    return {
      color: COLORS.green,
      bg: `${COLORS.green}15`,
      text: 'Al día',
      tooltip: 'Fecha de creación no válida o no registrada.',
      hours: 0,
      level: 'green',
      value: 0
    };
  }

  const diffMs = now.getTime() - createdTime.getTime();
  const diffHours = Math.max(0, diffMs / (1000 * 60 * 60));

  if (diffHours >= 72) {
    return {
      color: COLORS.red,
      bg: `${COLORS.red}15`,
      text: 'Crítico (72h+)',
      tooltip: `Sin seguimiento por ${Math.floor(diffHours)} horas desde su creación.`,
      hours: diffHours,
      level: 'red',
      value: 3
    };
  }

  if (diffHours >= 48) {
    return {
      color: COLORS.orange,
      bg: `${COLORS.orange}15`,
      text: 'Urgente (48h+)',
      tooltip: `Sin seguimiento por ${Math.floor(diffHours)} horas desde su creación.`,
      hours: diffHours,
      level: 'orange',
      value: 2
    };
  }

  if (diffHours >= 24) {
    return {
      color: COLORS.yellow,
      bg: `${COLORS.yellow}15`,
      text: 'Por contactar (24h+)',
      tooltip: `Sin seguimiento por ${Math.floor(diffHours)} horas desde su creación.`,
      hours: diffHours,
      level: 'yellow',
      value: 1
    };
  }

  return {
    color: COLORS.green,
    bg: `${COLORS.green}15`,
    text: 'Al día (<24h)',
    tooltip: `Creado recientemente (hace ${Math.floor(diffHours)} horas) sin seguimiento.`,
    hours: diffHours,
    level: 'green',
    value: 0
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
