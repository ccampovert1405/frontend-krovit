import React, { useState } from 'react'; // v2.1.0-refresh
import { PrimeReactProvider } from 'primereact/api';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { DashboardLeadsPage } from '@/components/dashboard-leads';
import { DashboardGerentePage } from '@/components/dashboard-gerente';
import { ProspectosPage } from '@/components/prospectos';
import { OportunidadesPage } from '@/components/oportunidades';
import { TareasPage } from '@/components/tareas';
import { ActividadesPage } from '@/components/actividades';
import { PlanificacionPage } from '@/components/pages';
import { ForecastPage } from '@/components/forecast';
import { LoginPage } from '@/components/auth/LoginPage';
import { LeadsPage } from '@/components/leads';
import AuthProvider from '@/context/AuthContext';
import { useAuth } from '@/hooks';
import { NotificationProvider } from '@/context/NotificationContext';
import { PageKey } from '@/types';
import { COLORS } from '@/utils/constants';
import { UsuariosPage } from '@/components/usuarios';
import { RolesPage } from '@/components/roles';
import { PermisosPage } from '@/components/permisos';
import { GruposVentasPage } from '@/components/grupos-ventas';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// PrimeReact styles
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';


// ─── Guard para rutas protegidas ───
const AuthGuard: React.FC<{ children: React.ReactNode; permission?: string }> = ({ children, permission }) => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#E31E24' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-column align-items-center justify-content-center h-full text-center p-8">
        <i className="pi pi-lock text-6xl mb-4" style={{ color: COLORS.red }} />
        <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para ver esta sección.</p>
        <Navigate to="/dashboard" replace />
      </div>
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const defaultDashboard = '/dashboard';

  // Helper to determine active page from URL
  const getActivePage = (): PageKey => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'dashboard';
    return path as PageKey;
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#E31E24' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.gray50 }}>
      {/* Mobile Top Bar */}
      <header className="topbar">
        <div className="topbar__logo">
          <img src="/logo-planifikt.png" alt="Logo" />
          <span className="topbar__logo-text">PLANIFIKT</span>
        </div>
        <div className="flex align-items-center gap-3">
          <NotificationBell />
          <button
            className="topbar__hamburger"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <i className="pi pi-bars" />
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        active={getActivePage()}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="app-main">
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Navigate to={defaultDashboard} replace />} />
            <Route path="/dashboard" element={<AuthGuard permission="dashboard.read"><DashboardPage /></AuthGuard>} />
            <Route path="/dashboard-leads" element={<AuthGuard><DashboardLeadsPage /></AuthGuard>} />
            <Route path="/dashboard-gerente" element={<AuthGuard><DashboardGerentePage /></AuthGuard>} />
            <Route path="/prospectos" element={<AuthGuard permission="prospect.read"><ProspectosPage /></AuthGuard>} />
            <Route path="/oportunidades" element={<AuthGuard permission="oportunidad.read"><OportunidadesPage /></AuthGuard>} />
            <Route path="/tareas" element={<AuthGuard permission="tarea.read"><TareasPage /></AuthGuard>} />
            <Route path="/actividades" element={<AuthGuard permission="tarea.read"><ActividadesPage /></AuthGuard>} />
            <Route path="/planificacion" element={<AuthGuard><PlanificacionPage /></AuthGuard>} />
            <Route path="/forecast" element={<AuthGuard><ForecastPage /></AuthGuard>} />
            <Route path="/usuarios" element={<AuthGuard><UsuariosPage /></AuthGuard>} />
            <Route path="/roles" element={<AuthGuard><RolesPage /></AuthGuard>} />
            <Route path="/permisos" element={<AuthGuard><PermisosPage /></AuthGuard>} />
            <Route path="/leads" element={<AuthGuard><LeadsPage /></AuthGuard>} />
            <Route path="/grupos-ventas" element={<AuthGuard><GruposVentasPage /></AuthGuard>} />
            <Route path="/" element={<Navigate to={defaultDashboard} replace />} />
            <Route path="*" element={<Navigate to={defaultDashboard} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN APPLICATION
// ═══════════════════════════════════════════════════════════

const App: React.FC = () => {
  return (
    <PrimeReactProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </PrimeReactProvider>
  );
};

export default App;
