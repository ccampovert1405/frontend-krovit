export interface TenantColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryBorder: string;
  secondary: string;
  bgGround: string;
  textMain: string;
  textSecondary: string;
}

export interface TenantLogos {
  main: string;
  favicon: string;
  height: string;
}

export interface TenantTypography {
  fontFamily: string;
  fontUrl: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  title: string;
  showTextNextToLogo: boolean;
  colors: TenantColors;
  logos: TenantLogos;
  typography: TenantTypography;
}

export const TENANT_CONFIGS: TenantConfig[] = [
  {
    id: 'planifikt',
    name: 'Planifikt',
    title: 'Planifikt CRM',
    showTextNextToLogo: true,
    colors: {
      primary: '#E31E24',
      primaryDark: '#C41920',
      primaryLight: '#FEF2F2',
      primaryBorder: '#FECACA',
      secondary: '#3B82F6',
      bgGround: '#F9FAFB',
      textMain: '#1A1A1A',
      textSecondary: '#6B7280',
    },
    logos: {
      main: '/logo-planifikt.png',
      favicon: '/favicon.svg',
      height: '32px',
    },
    typography: {
      fontFamily: "'Inter', sans-serif",
      fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
    },
  },
  {
    id: 'autovivienda',
    name: 'AutoVivienda',
    title: 'AutoVivienda CRM',
    showTextNextToLogo: false,
    colors: {
      primary: '#0284C7', // Sky Blue 600
      primaryDark: '#0369A1', // Sky Blue 700
      primaryLight: '#F0F9FF', // Sky Blue 50
      primaryBorder: '#BAE6FD', // Sky Blue 200
      secondary: '#0D9488', // Teal 600
      bgGround: '#F8FAFC', // Slate 50
      textMain: '#0F172A', // Slate 900
      textSecondary: '#475569', // Slate 600
    },
    logos: {
      main: '/logo-autovivienda.svg',
      favicon: '/favicon-autovivienda.svg',
      height: '34px',
    },
    typography: {
      fontFamily: "'Outfit', sans-serif",
      fontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
    },
  },
  {
    id: 'condelpi',
    name: 'Condelpi',
    title: 'Condelpi CRM',
    showTextNextToLogo: false,
    colors: {
      primary: '#152A55',     // Navy blue from logo
      primaryDark: '#0E1D3C', // Darker navy for hovers
      primaryLight: '#F0F4FA', // Light blue background highlight
      primaryBorder: '#D0DCED', // Light blue border
      secondary: '#E2A31B',    // Golden ribbon color from logo
      bgGround: '#F8FAFC',
      textMain: '#0F172A',
      textSecondary: '#475569',
    },
    logos: {
      main: '/logo-condelpi.svg',
      favicon: '/favicon-condelpi.svg',
      height: '32px',
    },
    typography: {
      fontFamily: "'Poppins', sans-serif",
      fontUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap',
    },
  },
];

export const DEFAULT_TENANT_ID = 'condelpi';
