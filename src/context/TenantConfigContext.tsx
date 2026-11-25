import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantConfig, TENANT_CONFIGS, DEFAULT_TENANT_ID } from '../data/tenantConfigs';

interface TenantConfigContextType {
  activeTenant: TenantConfig;
  switchTenant: (id: string) => void;
  tenants: TenantConfig[];
}

const TenantConfigContext = createContext<TenantConfigContextType | undefined>(undefined);

// Helper to convert hex (e.g. #E31E24) to RGB numbers string (e.g. 227, 30, 36)
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export const TenantConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read tenant from localStorage, fallback to default
  const [activeTenant, setActiveTenant] = useState<TenantConfig>(() => {
    const saved = localStorage.getItem('tenant_id');
    const config = TENANT_CONFIGS.find(t => t.id === saved);
    return config || TENANT_CONFIGS.find(t => t.id === DEFAULT_TENANT_ID) || TENANT_CONFIGS[0];
  });

  const switchTenant = (id: string) => {
    const config = TENANT_CONFIGS.find(t => t.id === id);
    if (config) {
      setActiveTenant(config);
      localStorage.setItem('tenant_id', id);
    }
  };

  useEffect(() => {
    const root = document.documentElement;

    // Apply color variables
    root.style.setProperty('--primary-color', activeTenant.colors.primary);
    root.style.setProperty('--primary-color-dark', activeTenant.colors.primaryDark);
    root.style.setProperty('--primary-color-light', activeTenant.colors.primaryLight);
    root.style.setProperty('--primary-color-border', activeTenant.colors.primaryBorder);
    
    // RGB for transparency uses in tailwind / raw css
    const rgb = hexToRgb(activeTenant.colors.primary);
    root.style.setProperty('--primary-color-rgb', rgb);
    
    // Shadows
    root.style.setProperty('--primary-color-shadow', `rgba(${rgb}, 0.25)`);
    root.style.setProperty('--primary-color-shadow-hover', `rgba(${rgb}, 0.35)`);
    root.style.setProperty('--primary-color-focus-shadow', `rgba(${rgb}, 0.12)`);

    root.style.setProperty('--secondary-color', activeTenant.colors.secondary);
    root.style.setProperty('--surface-ground', activeTenant.colors.bgGround);
    root.style.setProperty('--text-main', activeTenant.colors.textMain);
    root.style.setProperty('--text-secondary', activeTenant.colors.textSecondary);

    // Apply typography
    root.style.setProperty('--font-family', activeTenant.typography.fontFamily);

    // Inject dynamic google fonts link
    if (activeTenant.typography.fontUrl) {
      let fontLink = document.getElementById('tenant-font-link') as HTMLLinkElement;
      if (!fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = 'tenant-font-link';
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
      }
      fontLink.href = activeTenant.typography.fontUrl;
    }

    // Apply favicon
    if (activeTenant.logos.favicon) {
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = activeTenant.logos.favicon;
    }

    // Apply page title
    document.title = activeTenant.title;
  }, [activeTenant]);

  return (
    <TenantConfigContext.Provider value={{ activeTenant, switchTenant, tenants: TENANT_CONFIGS }}>
      {children}
      {/* Floating Tenant Switcher widget (only for dev/demonstration purposes) */}
      <div 
        className="tenant-switcher-badge"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
          padding: '8px 12px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.75rem',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Branding:</span>
        <select
          value={activeTenant.id}
          onChange={(e) => switchTenant(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: '6px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {TENANT_CONFIGS.map(t => (
            <option key={t.id} value={t.id} style={{ background: '#0f172a', color: '#fff' }}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </TenantConfigContext.Provider>
  );
};

export const useTenantConfig = () => {
  const context = useContext(TenantConfigContext);
  if (context === undefined) {
    throw new Error('useTenantConfig must be used within a TenantConfigProvider');
  }
  return context;
};
