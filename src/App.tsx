import React, { useState, useEffect } from 'react'; // v2.1.0-refresh
import { PrimeReactProvider } from 'primereact/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { ProspectosPage } from '@/components/prospectos';
import { OportunidadesPage } from '@/components/oportunidades';
import { TareasPage } from '@/components/tareas';
import { ActividadesPage } from '@/components/actividades';
import { PlanificacionPage, ForecastPage } from '@/components/pages';
import { LoginPage } from '@/components/auth/LoginPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { PageKey } from '@/types';
import { COLORS } from '@/utils/constants';

// PrimeReact styles
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// ═══════════════════════════════════════════════════════════
// CONTENIDO PRINCIPAL (con auth guard)
// ═══════════════════════════════════════════════════════════

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState<PageKey>('prospectos');
  const [authView, setAuthView] = useState<'login' | 'forgot-password'>('login');

  // Al autenticarse, ir a prospectos
  useEffect(() => {
    if (isAuthenticated) {
      setActivePage('prospectos');
    }
  }, [isAuthenticated]);

  // Loading
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A1A1A'
        }}
      >
        <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', color: '#E31E24' }} />
      </div>
    );
  }

  // No autenticado → mostrar auth pages
  if (!isAuthenticated) {
    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  // Autenticado → app principal
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage setActive={setActivePage} />;
      case 'prospectos':
        return <ProspectosPage />;
      case 'oportunidades':
        return <OportunidadesPage />;
      case 'tareas':
        return <TareasPage />;
      case 'actividades':
        return <ActividadesPage />;
      case 'planificacion':
        return <PlanificacionPage />;
      case 'forecast':
        return <ForecastPage />;
      default:
        return <DashboardPage setActive={setActivePage} />;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: COLORS.gray50,
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif"
      }}
    >
      {/* Sidebar */}
      <Sidebar active={activePage} setActive={setActivePage} />

      {/* Main Content */}
      <main
        style={{
          marginLeft: '220px',
          padding: '24px',
          minHeight: '100vh'
        }}
      >
        {renderPage()}
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
