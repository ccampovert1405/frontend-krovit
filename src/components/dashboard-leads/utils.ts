import { Lead } from "./types";

export const parseLeadDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date(NaN);

  // Try parsing DD/MM/YYYY format which is common in the source data
  const parts = dateStr.split(/[\/\s-]/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    let p2 = parseInt(parts[2], 10);

    // Basic validation for DD/MM/YYYY
    if (p0 > 0 && p0 <= 31 && p1 > 0 && p1 <= 12 && p2 > 1900) {
      return new Date(p2, p1 - 1, p0);
    }
    
    // Handle YY format
    if (p0 > 0 && p0 <= 31 && p1 > 0 && p1 <= 12 && p2 < 100) {
      return new Date(2000 + p2, p1 - 1, p0);
    }
  }

  // Fallback to standard parsing
  return new Date(dateStr);
};

export function normalizeVendor(v: string | undefined): string {
    if (!v) return 'Sin asignar';
    const t = v.trim();
    if (/maria\s*jose/i.test(t)) return 'Maria Jose Abad';
    if (/doris/i.test(t)) return 'Doris Guerrero';
    if (/marvin/i.test(t)) return 'Marvin Franco';
    if (/lainer/i.test(t)) return 'Lainer Alvear';
    return t || 'Sin asignar';
}

export const VENDOR_COLOR_MAP: Record<string, string> = {
    'Maria Jose Abad': '#1565C0',
    'Lainer Alvear': '#0D6E4E',
    'Doris Guerrero': '#BA7517',
    'Marvin Franco': '#C84B1F',
    'Sin asignar': '#9EA3B5',
};

export function getDateRange(data: Lead[]): string {
    const dates = data
        .map(r => parseLeadDate(r['Data created'] || r['Date created'] || ''))
        .filter(d => !isNaN(d.getTime()));
    if (!dates.length) return 'Sin datos';
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    return `${fmt(min)} – ${fmt(max)}`;
}

export function fmt(d: Date): string {
    return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
}
