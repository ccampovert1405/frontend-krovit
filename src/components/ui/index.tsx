import React from 'react';
import { Avatar as PrimeAvatar } from 'primereact/avatar';
import { Card } from 'primereact/card';
import { COLORS } from '@/utils/constants';

// ═══════════════════════════════════════════════════════════
// COMPONENTES UI REUTILIZABLES
// ═══════════════════════════════════════════════════════════

// ─── Badge Personalizado ───
interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export const CustomBadge: React.FC<BadgeProps> = ({
  children,
  color = COLORS.white,
  bg = COLORS.red,
  className = ''
}) => (
  <span
    className={`inline-block px-2 py-1 border-round-lg text-xs font-semibold ${className}`}
    style={{
      color,
      backgroundColor: bg,
      letterSpacing: '0.3px'
    }}
  >
    {children}
  </span>
);

// ─── Avatar con Iniciales ───
interface AvatarProps {
  name: string;
  size?: 'normal' | 'large' | 'xlarge';
  color?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'normal', color }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const bgColor = color || ['#E31E24', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'][name.charCodeAt(0) % 5];

  return (
    <PrimeAvatar
      label={initial}
      size={size}
      shape="circle"
      style={{
        backgroundColor: `${bgColor}20`,
        color: bgColor,
        fontWeight: 700,
      }}
    />
  );
};

// ─── KPI Card ───
interface KPICardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  icon,
  label,
  value,
  sub,
  trend,
  trendLabel,
  color = COLORS.red
}) => {
  const trendIcon = trend === 'up' ? 'pi-arrow-up' : trend === 'down' ? 'pi-arrow-down' : 'pi-minus';
  const trendColor = trend === 'up' ? COLORS.green : trend === 'down' ? COLORS.red : COLORS.gray500;

  return (
    <Card className="shadow-1 border-round-xl" style={{ flex: 1, minWidth: '180px' }}>
      <div className="flex justify-content-between align-items-center mb-2">
        <span className="text-xs text-500 font-semibold uppercase" style={{ letterSpacing: '0.5px' }}>
          {label}
        </span>
        <div
          className="flex align-items-center justify-content-center border-round-lg"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: `${color}18`
          }}
        >
          <i className={`pi ${icon}`} style={{ color, fontSize: '1rem' }} />
        </div>
      </div>
      <div className="text-3xl font-bold text-900">{value}</div>
      {sub && <div className="text-xs text-400 mt-1">{sub}</div>}
      {trend && (
        <div className="flex align-items-center gap-2 mt-2 text-xs">
          <i className={`pi ${trendIcon}`} style={{ color: trendColor, fontSize: '0.75rem' }} />
          <span style={{ color: trendColor, fontWeight: 500 }}>{trendLabel}</span>
          <span className="text-400">vs mes anterior</span>
        </div>
      )}
    </Card>
  );
};

// ─── Section Title ───
interface SectionTitleProps {
  icon?: string;
  title: string;
  badge?: string | number;
  action?: () => void;
  actionLabel?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  badge,
  action,
  actionLabel
}) => (
  <div className="flex justify-content-between align-items-center mb-3">
    <div className="flex align-items-center gap-2">
      {icon && <i className={`pi ${icon}`} style={{ color: COLORS.red, fontSize: '1.1rem' }} />}
      <span className="text-lg font-bold text-900">{title}</span>
      {badge != null && (
        <CustomBadge color={COLORS.red} bg={COLORS.redLight}>{badge}</CustomBadge>
      )}
    </div>
    {action && (
      <button
        onClick={action}
        className="flex align-items-center gap-1 bg-transparent border-none cursor-pointer text-sm font-semibold"
        style={{ color: COLORS.red }}
      >
        {actionLabel} <i className="pi pi-arrow-right" style={{ fontSize: '0.8rem' }} />
      </button>
    )}
  </div>
);

// ─── Page Header ───
interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children
}) => (
  <div className="flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
    <div>
      <h1 className="text-2xl font-bold text-900 m-0">{title}</h1>
      <p className="text-sm text-500 mt-1 mb-0">{subtitle}</p>
    </div>
    {children}
  </div>
);

// ─── Filter Tabs ───
interface FilterTabsProps {
  tabs: string[];
  active: string;
  setActive: (tab: string) => void;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ tabs, active, setActive }) => (
  <div className="flex gap-1 flex-wrap">
    {tabs.map(tab => (
      <button
        key={tab}
        onClick={() => setActive(tab)}
        className="px-3 py-2 border-round-lg text-sm font-medium cursor-pointer"
        style={{
          border: `1px solid ${active === tab ? COLORS.gray700 : COLORS.gray200}`,
          backgroundColor: active === tab ? COLORS.gray800 : COLORS.white,
          color: active === tab ? COLORS.white : COLORS.gray600,
          transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease',
        }}
      >
        {tab}
      </button>
    ))}
  </div>
);

// ─── Empty State ───
interface EmptyStateProps {
  message: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = 'pi-inbox'
}) => (
  <div className="text-center py-5">
    <i className={`pi ${icon} text-400 mb-2`} style={{ fontSize: '2rem' }} />
    <p className="text-sm text-400 m-0">{message}</p>
  </div>
);

// ─── Re-exports de componentes de formulario ───
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { ModalSectionHeader } from './ModalSectionHeader';
export type { ModalSectionHeaderProps } from './ModalSectionHeader';
