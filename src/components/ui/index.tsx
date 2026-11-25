import React from 'react';
import { Avatar as PrimeAvatar } from 'primereact/avatar';
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
  bg = 'var(--primary-color, #E31E24)',
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
  style?: React.CSSProperties;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'normal', color, style, className = '' }) => {
  const getInitials = (fullName: string) => {
    if (!fullName || !fullName.trim()) return '?';

    // Split and filter out empty strings
    const parts = fullName.trim().split(/\s+/).filter(p => p.length > 0);

    if (parts.length === 0) return '?';
    if (parts.length === 1) {
      return parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }

    // Take first letter of first part and first letter of last part
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };

  const displayName = name || '';
  const initials = getInitials(displayName);

  // Deterministic background color based on the name or initials
  const seed = displayName || initials || '?';
  const colorIndex = Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 5;
  const bgColor = color || ['#E31E24', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6'][colorIndex];

  return (
    <PrimeAvatar
      label={initials}
      size={size}
      shape="circle"
      className={`custom-avatar ${className}`}
      style={{
        backgroundColor: `${bgColor}20`,
        color: bgColor,
        fontWeight: 700,
        border: `1px solid ${bgColor}30`,
        ...style
      }}
    />
  );
};

// ─── Icon Box (Standardized Container) ───
export interface IconBoxProps {
  icon: string;
  size?: string;
  iconSize?: string;
  color?: string;
  bg?: string;
  rounded?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const IconBox: React.FC<IconBoxProps> = ({
  icon,
  size = '32px',
  iconSize = '0.9rem',
  color = COLORS.red,
  bg = COLORS.redLight,
  rounded = true,
  className = '',
  style = {}
}) => (
  <div
    className={`flex align-items-center justify-content-center icon-box-standard ${rounded ? 'border-round-lg' : ''} ${className}`}
    style={{
      width: size,
      height: size,
      backgroundColor: bg,
      flexShrink: 0,
      transition: 'all 0.2s ease',
      ...style
    }}
  >
    <i
      className={`pi ${icon} flex align-items-center justify-content-center`}
      style={{
        color,
        fontSize: iconSize,
        width: '100%',
        height: '100%',
        lineHeight: 1,
        margin: 0
      }}
    />
  </div>
);

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
    <div
      className="shadow-premium transition-all transition-duration-300"
      style={{
        background: COLORS.white,
        borderRadius: '24px',
        padding: '24px',
        flex: 1,
        minWidth: '220px',
        border: `1px solid ${COLORS.gray100}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '4px',
        width: '40px',
        backgroundColor: color,
        opacity: 0.8,
        borderRadius: '0 0 4px 0'
      }} />
      <div className="flex justify-content-between align-items-center mb-4">
        <span style={{
          fontSize: '0.72rem',
          color: COLORS.gray400,
          fontWeight: 800,
          letterSpacing: '1.2px',
          textTransform: 'uppercase'
        }}>
          {label}
        </span>
        <IconBox
          icon={icon}
          color={color}
          bg={`${color}10`}
          size="36px"
          iconSize="1rem"
          rounded={true}
        />
      </div>

      <div style={{
        fontSize: '1.6rem',
        fontWeight: 900,
        color: COLORS.black,
        letterSpacing: '-1px',
        lineHeight: 1
      }}>
        {value}
      </div>

      {(sub || trend) && (
        <div className="mt-4">
          {sub && <div style={{ fontSize: '0.8rem', color: COLORS.gray400, fontWeight: 500 }}>{sub}</div>}
          {trend && (
            <div className="flex align-items-center gap-3 text-xs">
              <i className={`pi ${trendIcon}`} style={{ color: trendColor, fontSize: '0.9rem' }} />
              <span style={{ color: trendColor, fontWeight: 700 }}>{trendLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
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
  <div className="flex justify-content-between align-items-center mb-2">
    <div className="flex align-items-center gap-3" style={{ minHeight: '32px' }}>
      {icon && <i className={`pi ${icon}`} style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }} />}
      <span className="text-lg font-bold text-900" style={{ letterSpacing: '-0.3px', fontWeight: 800, lineHeight: 1 }}>{title}</span>
      {badge != null && (
        <CustomBadge color="var(--primary-color)" bg="var(--primary-color-light)">{badge}</CustomBadge>
      )}
    </div>
    {action && (
      <button
        onClick={action}
        className="flex align-items-center gap-3 bg-transparent border-none cursor-pointer text-sm font-semibold p-0"
        style={{ color: 'var(--primary-color)', lineHeight: 1 }}
      >
        {actionLabel} <i className="pi pi-arrow-right" style={{ fontSize: '0.9rem' }} />
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
}) => {
  return (
    <div className="flex flex-column md:flex-row justify-content-between md:align-items-center mb-5 gap-3">
      <div>
        <h1 className="page-header-title" style={{ fontWeight: 900, margin: 0 }}>{title}</h1>
        {subtitle && <p className="text-600 m-0 mt-1 font-medium">{subtitle}</p>}
      </div>

      <div className="flex align-items-center gap-3 flex-wrap">
        {children}
      </div>
    </div>
  );
};

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

// ─── Search Bar ───
export interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ className = '', ...props }) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className={`w-full ${className}`} style={{ position: 'relative' }}>
      <i
        className="pi pi-search"
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? COLORS.gray600 : COLORS.gray400,
          fontSize: '1rem',
          transition: 'color 0.2s ease'
        }}
      />
      <input
        type="text"
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%',
          padding: '14px 16px 14px 44px',
          borderRadius: '8px',
          border: `1px solid ${focused ? COLORS.gray300 : COLORS.gray200}`,
          fontSize: '0.95rem',
          fontWeight: 400,
          color: COLORS.gray700,
          backgroundColor: COLORS.white,
          outline: 'none',
          boxShadow: focused ? `0 2px 8px rgba(0,0,0,0.04)` : 'none',
          transition: 'all 0.2s ease',
          ...props.style
        }}
      />
    </div>
  );
};

// ─── Re-exports de componentes de formulario ───
export { FormField } from './FormField';
export type { FormFieldProps } from './FormField';
export { ModalSectionHeader } from './ModalSectionHeader';
export type { ModalSectionHeaderProps } from './ModalSectionHeader';
