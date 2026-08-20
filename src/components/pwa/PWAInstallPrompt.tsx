import React, { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════
// PWA INSTALL PROMPT
// Detecta el evento beforeinstallprompt y muestra un banner
// elegante para instalar la PWA. En iOS muestra instrucciones
// manuales ya que Safari no dispara dicho evento.
// ═══════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () => {
  const ua = window.navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua);
};

const isInStandaloneMode = () =>
  ('standalone' in window.navigator && (window.navigator as any).standalone) ||
  window.matchMedia('(display-mode: standalone)').matches;

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed before
    if (isInStandaloneMode()) return;
    const alreadyDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (alreadyDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay so user is already in the app
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection — show manual instructions
    if (isIOS() && !isInStandaloneMode()) {
      setTimeout(() => setShowIOSInstructions(true), 3500);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', '1');
  };

  // Android/Chrome banner
  if (showBanner && deferredPrompt && !dismissed) {
    return (
      <div style={styles.overlay} role="dialog" aria-label="Instalar aplicación">
        <div style={styles.banner}>
          <div style={styles.iconWrapper}>
            <img src="/icon-192.png" alt="CRM Planifikt" style={styles.icon} />
          </div>
          <div style={styles.textBlock}>
            <div style={styles.title}>Instala el CRM</div>
            <div style={styles.subtitle}>Accede al instante desde tu pantalla de inicio</div>
          </div>
          <div style={styles.actions}>
            <button style={styles.btnInstall} onClick={handleInstall}>
              <i className="pi pi-download" style={{ marginRight: 6, fontSize: '0.85rem' }} />
              Instalar
            </button>
            <button style={styles.btnDismiss} onClick={handleDismiss} aria-label="Cerrar">
              <i className="pi pi-times" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari instructions
  if (showIOSInstructions && !dismissed) {
    return (
      <div style={styles.overlay} role="dialog" aria-label="Instrucciones iOS">
        <div style={{ ...styles.banner, flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/icon-192.png" alt="Planifikt" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div>
                <div style={styles.title}>Instala la app</div>
                <div style={styles.subtitle}>Añade el CRM a tu pantalla de inicio</div>
              </div>
            </div>
            <button style={styles.btnDismiss} onClick={handleDismiss} aria-label="Cerrar">
              <i className="pi pi-times" />
            </button>
          </div>
          <div style={styles.iosSteps}>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>1</span>
              <span>Toca el botón <strong>Compartir</strong> <span style={{ fontSize: '1.1rem' }}>⎙</span> en Safari</span>
            </div>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>2</span>
              <span>Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
            </div>
            <div style={styles.iosStep}>
              <span style={styles.iosStepNum}>3</span>
              <span>Toca <strong>"Añadir"</strong> para confirmar</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// ─── Estilos inline ───
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 'calc(80px + env(safe-area-inset-bottom))', // por encima del bottom nav
    left: '12px',
    right: '12px',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    animation: 'slideUpFade 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  banner: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
    border: '1px solid #F3F4F6',
  },
  iconWrapper: {
    flexShrink: 0,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(227,30,36,0.25)',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#1A1A1A',
    marginBottom: '2px',
  },
  subtitle: {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.78rem',
    color: '#6B7280',
    lineHeight: 1.3,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  btnInstall: {
    background: '#E31E24',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '9px 16px',
    fontSize: '0.82rem',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    boxShadow: '0 3px 10px rgba(227,30,36,0.3)',
    fontFamily: 'Inter, sans-serif',
  },
  btnDismiss: {
    background: '#F3F4F6',
    color: '#6B7280',
    border: 'none',
    borderRadius: '8px',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  iosSteps: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    background: '#F9FAFB',
    borderRadius: '12px',
    padding: '12px 14px',
  },
  iosStep: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '0.83rem',
    color: '#374151',
    fontFamily: 'Inter, sans-serif',
  },
  iosStepNum: {
    background: '#E31E24',
    color: '#ffffff',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 800,
    flexShrink: 0,
    marginTop: '1px',
  },
};

export default PWAInstallPrompt;
