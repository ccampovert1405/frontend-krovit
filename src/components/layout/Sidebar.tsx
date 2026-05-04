import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageKey } from '@/types';
import { COLORS } from '@/utils/constants';
import { useAuth } from '@/hooks';
import { Avatar } from '@/components/ui';
import { formatUserDisplayName } from '@/utils/formatters';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';

// ═══════════════════════════════════════════════════════════
// SIDEBAR - NAVEGACIÓN PRINCIPAL (responsive)
// ═══════════════════════════════════════════════════════════

// ─── Krivot Logo SVG ───
const KrivotLogo: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    <path d="M20 20L50 50L20 80" stroke="#10B981" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 20L70 50L40 80" stroke="#3B82F6" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="75" cy="30" r="8" fill="#10B981" />
    <circle cx="75" cy="70" r="8" fill="#3B82F6" />
  </svg>
);

interface SidebarProps {
  active: PageKey;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ active, isOpen = false, onClose }) => {
  const { logout, user } = useAuth();
  const [showPwdModal, setShowPwdModal] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const location = useLocation();

  const displayName = formatUserDisplayName(user?.nombres, user?.apellidos);

  const menuItems = user?.menus || [];


  // Mapeo de iconos
  const getIcon = (iconName: string, pageKey?: string) => {
    if (pageKey === 'leads') return 'pi-user-plus';
    const map: Record<string, string> = {
      'dashboard': 'pi-th-large',
      'person': 'pi-users',
      'attach_money': 'pi-money-bill',
      'check_circle': 'pi-check-circle',
      'settings': 'pi-cog',
      'trending_up': 'pi-chart-line',
      'calendar': 'pi-calendar',
      'grupos-ventas': 'pi-sitemap',
      'dashboard-leads': 'pi-chart-line',
      'dashboard-gerente': 'pi-briefcase'
    };
    return map[iconName] || `pi-${iconName}`;
  };

  // Mapear rutas de la API a PageKey internas
  const getPageKey = (ruta: string): PageKey => {
    const r = ruta.toLowerCase();
    if (r.includes('usuario') || r.includes('user') || r.includes('config')) return 'usuarios';
    if (r.includes('rol') || r.includes('role')) return 'roles';
    if (r.includes('permiso') || r.includes('permission')) return 'permisos';
    if (r.includes('prospect')) return 'prospectos';
    if (r.includes('oportunid')) return 'oportunidades';
    if (r.includes('tarea')) return 'tareas';
    if (r.includes('grupo')) return 'grupos-ventas';
    if (r.includes('dashboard-leads')) return 'dashboard-leads';

    return ruta.replace('/', '') as PageKey;
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a nav item is tapped
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className={`sidebar-backdrop${isOpen ? ' is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <div
        className={`sidebar-overlay${isOpen ? ' is-open' : ''} fixed left-0 top-0 flex flex-column`}
        style={{
          width: '220px',
          backgroundColor: COLORS.white,
          borderRight: `1px solid ${COLORS.gray200}`,
          zIndex: 1100,
          height: '100dvh', // Modern mobile height
        }}
      >
        {/* Mobile close button */}
        <button
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <i className="pi pi-times" />
        </button>

        {/* Header - Branding & Profile */}
        <div className="p-4 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
          <div className="flex align-items-center gap-3 mb-4">
            <img src="/logo-planifikt.png" alt="Logo" style={{ height: '32px', objectFit: 'contain' }} />
            <div className="text-xl font-black" style={{ color: COLORS.red, letterSpacing: '-0.5px' }}>PLANIFIKT</div>
          </div>

          {/* User Detail - Clickable for "Tree" menu */}
          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex align-items-center gap-1 p-3 border-round-xl bg-gray-50 border-1 cursor-pointer hover:bg-gray-100 transition-duration-200"
            style={{ borderColor: COLORS.gray100 }}
          >
            <Avatar
              name={displayName}
              size="normal"
            />
            <div style={{ lineHeight: '1.2' }}>
              <div className="font-bold text-900" style={{ fontSize: '0.75rem' }}>{displayName}</div>
              <div className="text-500" style={{ fontSize: '0.5rem' }}>{user?.rol || 'Vendedor'}</div>
            </div>

            <div className="ml-auto">
              <i className={`pi pi-chevron-${isUserMenuOpen ? 'up' : 'down'} text-400`} style={{ fontSize: '0.75rem' }} />
            </div>
          </div>

          {/* User Menu "Tree" */}
          {isUserMenuOpen && (
            <div className="mt-2 flex flex-column gap-1 overflow-hidden transition-all transition-duration-300">
              <button
                onClick={() => { setShowPwdModal(true); setIsUserMenuOpen(false); }}
                className="w-full flex align-items-center gap-1 px-3 py-2 border-round-lg border-none cursor-pointer bg-transparent text-600 hover:text-blue-600 hover:bg-blue-50 transition-duration-200"
              >
                <i className="pi pi-lock" style={{ fontSize: '0.75rem' }} />
                <span className="text-xs font-semibold">Cambiar Contraseña</span>
              </button>

              <button
                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                className="w-full flex align-items-center gap-1 px-3 py-2 border-round-lg border-none cursor-pointer bg-transparent text-600 hover:text-red-600 hover:bg-red-50 transition-duration-200"
              >
                <i className="pi pi-sign-out" style={{ fontSize: '0.9rem' }} />
                <span className="text-xs font-semibold">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="flex-grow-1 overflow-y-auto">
          {/* Navigation */}
          <nav className="p-2">
            {menuItems.map(item => {
              const pageKey = getPageKey(item.ruta);
              const isPageActive = active === pageKey || location.pathname === `/${pageKey}`;

              return (
                <Link
                  key={item.ruta}
                  to={`/${pageKey}`}
                  onClick={handleLinkClick}
                  className="w-full flex align-items-center gap-1 px-3 py-2 mb-1 border-round-lg cursor-pointer no-underline"
                  style={{
                    backgroundColor: isPageActive ? COLORS.redLight : 'transparent',
                    color: isPageActive ? COLORS.red : COLORS.gray600,
                    transition: 'background-color 0.2s ease, color 0.2s ease',
                    border: 'none',
                    display: 'flex'
                  }}
                >
                  <i className={`pi ${getIcon(item.icono, pageKey)}`} style={{ fontSize: '1rem' }} />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {isPageActive && (
                    <i className="pi pi-chevron-right ml-auto" style={{ fontSize: '0.75rem' }} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer - Branding */}
        <div className="mt-auto">

          {/* Original Branding Footer */}
          <div
            className="p-3 border-top-1 bg-gray-50"
            style={{
              borderColor: COLORS.gray200,
              backgroundColor: '#f9fafb',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' // Respect iPhone home bar
            }}
          >
            <div className="flex align-items-start gap-2">
              <KrivotLogo size={18} />
              <div style={{ lineHeight: '1.4' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  Plataforma CRM desarrollada por
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>
                  KRIVOT ECUADOR
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                  CRM Planifikt v1.0
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        visible={showPwdModal}
        onHide={() => setShowPwdModal(false)}
      />
    </>
  );
};

export default Sidebar;
