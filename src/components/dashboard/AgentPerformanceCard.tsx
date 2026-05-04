import React from 'react';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';
import { Avatar } from '@/components/ui';

interface PerformanceProps {
  agentName: string;
  revenue: { current: number; target: number };
  tasks: number;
  prospects: { current: number; target: number };
  opportunities: { current: number; target: number };
  closings: { current: number; target: number };
  winOpps: number;
  lostOpps: number;
}

export const AgentPerformanceCard: React.FC<PerformanceProps> = ({
  agentName,
  revenue,
  tasks,
  prospects,
  opportunities,
  closings,
  winOpps,
  lostOpps
}) => {
  // Lógica de Estado (basada en ingresos vs meta)
  const ratio = revenue.target > 0 ? (revenue.current / revenue.target) : 0;

  let status = { label: 'ESTABLE', color: '#64748b', bg: '#f8fafc', text: '#475569' };
  if (ratio >= 1.05) {
    status = { label: 'EXCEDE', color: '#059669', bg: '#f0fdf4', text: '#065f46' };
  } else if (ratio >= 0.85) {
    status = { label: 'AL DÍA', color: '#2563eb', bg: '#eff6ff', text: '#1e40af' };
  } else if (ratio < 0.6) {
    status = { label: 'EN RIESGO', color: '#d97706', bg: '#fffbeb', text: '#92400e' };
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
    return `$${val}`;
  };

  const getProgress = (current: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const barColors = {
    prospects: '#3b82f6',
    opportunities: '#10b981',
    closings: '#f59e0b',
    winOpps: '#10b981',
    lostOpps: '#ef4444'
  };

  return (
    <Card className="shadow-1 border-round-lg mb-3 overflow-hidden border-none"
      style={{ borderLeft: `4px solid ${status.color}`, backgroundColor: '#fff' }}
      pt={{ content: { className: 'p-3' } }}
    >
      {/* Header Section */}
      <div className="flex justify-content-between align-items-center mb-3">
        <div className="flex align-items-center gap-2">
          <Avatar name={agentName} size="normal" />
          <div className="flex flex-column">
            <h4 className="m-0 text-base font-bold text-800 line-height-1">{agentName}</h4>
            <div className="flex align-items-center gap-1 mt-1">
              <span className="font-bold uppercase" style={{ color: status.text, fontSize: '0.6rem', letterSpacing: '0.05em' }}>{status.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold text-400 uppercase mb-1" style={{ fontSize: '0.55rem' }}>Ingresos</span>
          <span className="block text-xl font-black text-900 line-height-1">{formatCurrency(revenue.current)}</span>
          <span className="block text-xs font-medium text-400 mt-1" style={{ fontSize: '0.65rem' }}>Meta: {formatCurrency(revenue.target)}</span>
        </div>
      </div>

      {/* Progress Bars Section */}
      <div className="flex flex-column gap-3">
        {/* Tareas Compact */}
        <div className="flex justify-content-between align-items-center py-2 px-3 border-round-md" style={{ backgroundColor: '#f8fafc' }}>
          <span className="text-xs font-bold text-500 uppercase" style={{ fontSize: '0.6rem' }}>Tareas Pendientes</span>
          <div className="flex align-items-center gap-2">
            <span className="text-lg font-black text-800">{String(tasks).padStart(2, '0')}</span>
            {tasks > 4 ? (
              <i className="pi pi-exclamation-triangle text-amber-500" style={{ fontSize: '0.9rem' }}></i>
            ) : tasks > 0 ? (
              <i className="pi pi-clock text-blue-500" style={{ fontSize: '0.9rem' }}></i>
            ) : (
              <i className="pi pi-check-circle text-green-500" style={{ fontSize: '0.9rem' }}></i>
            )}
          </div>
        </div>

        {/* Prospect Goals */}
        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between text-xs font-bold text-500 uppercase" style={{ fontSize: '0.55rem' }}>
            <span>Prospectos</span>
            <span className="text-700">{prospects.current} <span className="text-300">/ {prospects.target}</span></span>
          </div>
          <ProgressBar
            value={getProgress(prospects.current, prospects.target)}
            showValue={false}
            style={{ height: '6px', borderRadius: '3px' }}
            color={barColors.prospects}
          />
        </div>

        {/* Opportunity Goals */}
        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between text-xs font-bold text-500 uppercase" style={{ fontSize: '0.55rem' }}>
            <span>Oportunidades</span>
            <span className="text-700">{opportunities.current} <span className="text-300">/ {opportunities.target}</span></span>
          </div>
          <ProgressBar
            value={getProgress(opportunities.current, opportunities.target)}
            showValue={false}
            style={{ height: '6px', borderRadius: '3px' }}
            color={barColors.opportunities}
          />
        </div>

        {/* Closing Goals */}
        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between text-xs font-bold text-500 uppercase" style={{ fontSize: '0.55rem' }}>
            <span>Cierres</span>
            <span className="text-700">{closings.current} <span className="text-300">/ {closings.target}</span></span>
          </div>
          <ProgressBar
            value={getProgress(closings.current, closings.target)}
            showValue={false}
            style={{ height: '6px', borderRadius: '3px' }}
            color={barColors.opportunities}
          />
        </div>

        {/* Win/Loss Section */}
        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between text-xs font-bold text-500 uppercase" style={{ fontSize: '0.55rem' }}>
            <span>Ganadas</span>
            <span className="text-700">{winOpps} <span className="text-300">/ {opportunities.current}</span></span>
          </div>
          <ProgressBar
            value={getProgress(winOpps, opportunities.current)}
            showValue={false}
            style={{ height: '6px', borderRadius: '3px' }}
            color={barColors.opportunities}
          />
        </div>

        <div className="flex flex-column gap-1">
          <div className="flex justify-content-between text-xs font-bold text-500 uppercase" style={{ fontSize: '0.55rem' }}>
            <span>Perdidas</span>
            <span className="text-700">{lostOpps} <span className="text-300">/ {opportunities.current}</span></span>
          </div>
          <ProgressBar
            value={getProgress(lostOpps, opportunities.current)}
            showValue={false}
            style={{ height: '6px', borderRadius: '3px' }}
            color="#ef4444"
          />
        </div>
      </div>
    </Card>
  );
};
