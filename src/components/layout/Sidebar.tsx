import React from 'react';
import { PageKey, MenuItem } from '@/types';
import { COLORS } from '@/utils/constants';
import { useAuth } from '@/context/AuthContext';

// ═══════════════════════════════════════════════════════════
// SIDEBAR - NAVEGACIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════

// ─── Logo SVG ───
const Logo: React.FC<{ size?: number }> = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M50 5L15 25V65L50 85L85 65V25L50 5Z" fill={COLORS.red} />
    <path d="M50 5L15 25V65L50 45V5Z" fill={COLORS.black} opacity="0.3" />
    <circle cx="50" cy="52" r="14" fill={COLORS.white} />
    <circle cx="50" cy="52" r="7" fill={COLORS.black} />
  </svg>
);

// ─── Krivot Logo SVG ───
const KrivotLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M20 20L50 50L20 80" stroke="#10B981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 20L70 50L40 80" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="75" cy="30" r="8" fill="#10B981" />
    <circle cx="75" cy="70" r="8" fill="#3B82F6" />
  </svg>
);

// ─── Menu Items Configuration ───
const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'pi-th-large' },
  { key: 'prospectos', label: 'Prospectos', icon: 'pi-users' },
  { key: 'oportunidades', label: 'Oportunidades', icon: 'pi-sync' },
  { key: 'tareas', label: 'Tareas', icon: 'pi-check-circle' },
  { key: 'actividades', label: 'Actividades', icon: 'pi-calendar-plus' },
  { key: 'forecast', label: 'Forecast', icon: 'pi-chart-line' },
];

interface SidebarProps {
  active: PageKey;
  setActive: (page: PageKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, setActive }) => {
  const { logout } = useAuth();

  return (
    <div
      className="fixed left-0 top-0 h-screen flex flex-column justify-content-between"
      style={{
        width: '220px',
        backgroundColor: COLORS.white,
        borderRight: `1px solid ${COLORS.gray200}`,
        zIndex: 100
      }}
    >
      {/* Header */}
      <div>
        <div className="flex align-items-center gap-2 p-3 border-bottom-1" style={{ borderColor: COLORS.gray200 }}>
          <Logo size={36} />
          <div>
            <div className="text-lg font-bold" style={{ color: COLORS.red }}>PLANIFIKT</div>
            <div className="text-xs text-400">Viviendas y Vehículos para todos.</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-2">
          {MENU_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="w-full flex align-items-center gap-3 px-3 py-2 mb-1 border-round-lg border-none cursor-pointer"
              style={{
                backgroundColor: active === item.key ? COLORS.redLight : 'transparent',
                color: active === item.key ? COLORS.red : COLORS.gray600,
                transition: 'background-color 0.2s ease, color 0.2s ease',
              }}
            >
              <i className={`pi ${item.icon}`} style={{ fontSize: '1rem' }} />
              <span className="font-semibold text-sm">{item.label}</span>
              {active === item.key && (
                <i className="pi pi-chevron-right ml-auto" style={{ fontSize: '0.75rem' }} />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div>
        {/* Cerrar Sesión */}
        <div className="px-2 mb-2">
          <button
            onClick={logout}
            className="w-full flex align-items-center gap-3 px-3 py-2 border-round-lg border-none cursor-pointer"
            style={{
              backgroundColor: 'transparent',
              color: COLORS.gray500,
              transition: 'background-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.redLight;
              e.currentTarget.style.color = COLORS.red;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.gray500;
            }}
          >
            <i className="pi pi-sign-out" style={{ fontSize: '1rem' }} />
            <span className="font-semibold text-sm">Cerrar Sesión</span>
          </button>
        </div>

        {/* Branding */}
        <div
          className="p-3 border-top-1"
          style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }}
        >
          <div className="flex align-items-start gap-2">
            <KrivotLogo size={16} />
            <div style={{ lineHeight: '1.4' }}>
              <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>
                Plataforma CRM desarrollada por
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#374151' }}>
                KRIVOT ECUADOR
              </div>
              <div style={{ fontSize: '0.6rem', color: '#9CA3AF', marginTop: '2px' }}>
                CRM Planifikt v1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
