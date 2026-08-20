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

// ─── Bottom Navigation Bar (Mobile) ───
// Muestra 5 accesos rápidos en la barra inferior (estilo app nativa)
const BOTTOM_NAV_LINKS = [
  { key: 'dashboard', icon: 'pi-th-large', label: 'Inicio', to: '/dashboard' },
  { key: 'prospectos', icon: 'pi-users', label: 'Prospectos', to: '/prospectos' },
  { key: 'oportunidades', icon: 'pi-money-bill', label: 'Ventas', to: '/oportunidades' },
];

interface BottomNavProps {
  activeKey: string;
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeKey, onOpenMenu }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showPwdModal, setShowPwdModal] = React.useState(false);
  const displayName = formatUserDisplayName(user?.nombres, user?.apellidos);

  return (
    <>
      <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
        {BOTTOM_NAV_LINKS.map(item => {
          const isActive = location.pathname === item.to || activeKey === item.key;
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`bottom-nav__item${isActive ? ' active' : ''}`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <i className={`pi ${item.icon}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Perfil del usuario */}
        <button
          className={`bottom-nav__item${showUserMenu ? ' active' : ''}`}
          onClick={() => setShowUserMenu(prev => !prev)}
          aria-label="Mi perfil"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          <i className="pi pi-user" />
          <span>Perfil</span>
        </button>

        {/* Menú completo */}
        <button
          className="bottom-nav__item"
          onClick={onOpenMenu}
          aria-label="Abrir menú completo"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          <i className="pi pi-bars" />
          <span>Menú</span>
        </button>
      </nav>

      {/* Mini menú de usuario (popup sobre bottom nav) */}
      {showUserMenu && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 1050,
            }}
            onClick={() => setShowUserMenu(false)}
          />
          <div style={{
            position: 'fixed',
            bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 8px)',
            right: '12px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #F3F4F6',
            zIndex: 1060,
            minWidth: '200px',
            overflow: 'hidden',
          }}>
            {/* Header del usuario */}
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid #F3F4F6',
              background: '#FAFAFA',
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1A1A1A' }}>{displayName}</div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '2px' }}>{user?.rol || 'Vendedor'}</div>
            </div>
            {/* Opciones */}
            <div style={{ padding: '6px' }}>
              <button
                onClick={() => { setShowPwdModal(true); setShowUserMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '10px 12px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
                  color: '#374151', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <i className="pi pi-lock" style={{ fontSize: '0.9rem', color: '#3B82F6', margin: 0 }} />
                Cambiar Contraseña
              </button>
              <button
                onClick={() => { logout(); setShowUserMenu(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '10px 12px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600,
                  color: '#374151', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <i className="pi pi-sign-out" style={{ fontSize: '0.9rem', color: '#E31E24', margin: 0 }} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}

      <ChangePasswordModal
        visible={showPwdModal}
        onHide={() => setShowPwdModal(false)}
      />
    </>
  );
};


export const Sidebar: React.FC<SidebarProps> = ({ active, isOpen = false, onClose }) => {
  const { logout, user } = useAuth();
  const [showPwdModal, setShowPwdModal] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const location = useLocation();

  const displayName = formatUserDisplayName(user?.nombres, user?.apellidos);

  const rawMenuItems = (user?.menus || []).filter(item =>
    !item.ruta.toLowerCase().includes('tarea') &&
    !item.ruta.toLowerCase().includes('actividad') &&
    !item.ruta.toLowerCase().includes('activities')
  );
  const hasListasPrecio = rawMenuItems.some(item => item.ruta.toLowerCase().includes('lista-precio') || item.ruta.toLowerCase().includes('listas-precio'));
  const menuItems = [...rawMenuItems];
  const isUserAdmin = user?.rol === 'Admin' || user?.rol === 'Administrador' || (typeof user?.rol === 'object' && ((user?.rol as any).nombreRol === 'Admin' || (user?.rol as any).nombreRol === 'Administrador'));
  if (!hasListasPrecio && isUserAdmin) {
    menuItems.push({ ruta: '/listas-precio', label: 'Listas de Precios', icono: 'attach_money' });
  }
  const hasPlazos = rawMenuItems.some(item => item.ruta.toLowerCase().includes('plazo'));
  if (!hasPlazos && isUserAdmin) {
    menuItems.push({ ruta: '/plazos', label: 'Plazos', icono: 'clock' });
  }
  const hasFinanciamientos = rawMenuItems.some(item => item.ruta.toLowerCase().includes('financiamiento'));
  if (!hasFinanciamientos && isUserAdmin) {
    menuItems.push({ ruta: '/financiamientos', label: 'Financiamientos', icono: 'percentage' });
  }

  const getIcon = (iconName: string, pageKey?: string) => {
    if (pageKey === 'leads') return 'pi-user-plus';
    if (pageKey === 'plazos') return 'pi-clock';
    if (pageKey === 'financiamientos') return 'pi-percentage';
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
    if (r.includes('lista-precio') || r.includes('listas-precio')) return 'listas-precio';
    if (r.includes('plazo')) return 'plazos';
    if (r.includes('financiamiento')) return 'financiamientos';
    return ruta.replace('/', '') as PageKey;
  };

  const handleLinkClick = () => {
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
          height: '100dvh',
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
          <div className="flex justify-content-center mb-4">
            <img src="/logo-planifikt.png" alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
          </div>

          <div
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex align-items-center gap-1 p-3 border-round-xl bg-gray-50 border-1 cursor-pointer hover:bg-gray-100 transition-duration-200"
            style={{ borderColor: COLORS.gray100 }}
          >
            <Avatar name={displayName} size="normal" />
            <div style={{ lineHeight: '1.2' }}>
              <div className="font-bold text-900" style={{ fontSize: '0.75rem' }}>{displayName}</div>
              <div className="text-500" style={{ fontSize: '0.5rem' }}>{user?.rol || 'Vendedor'}</div>
            </div>
            <div className="ml-auto">
              <i className={`pi pi-chevron-${isUserMenuOpen ? 'up' : 'down'} text-400`} style={{ fontSize: '0.75rem' }} />
            </div>
          </div>

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
          <div
            className="p-3 border-top-1 bg-gray-50"
            style={{
              borderColor: COLORS.gray200,
              backgroundColor: '#f9fafb',
              paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))'
            }}
          >
            <div className="flex align-items-start gap-2">
              <KrivotLogo size={18} />
              <div style={{ lineHeight: '1.4' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Plataforma CRM desarrollada por</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>KRIVOT ECUADOR</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>CRM Planifikt v1.0</div>
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
