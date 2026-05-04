import { Lead } from "./types";

export const parseLeadDate = (dateStr: string | undefined): Date => {
  if (!dateStr) return new Date(NaN);

  // Try standard parsing
  let d = new Date(dateStr);

  // Split parts to handle DD/MM vs MM/DD
  const parts = dateStr.split(/[\/\s:]/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    // If MM/DD/YYYY (US) format was parsed but string starts with a number > 12, 
    // it's definitely DD/MM/YYYY.
    if (!isNaN(d.getTime()) && p0 > 12) {
      d = new Date(p2 < 100 ? 2000 + p2 : p2, p1 - 1, p0);
    }
    // If standard parsing failed, try manual DD/MM/YYYY
    else if (isNaN(d.getTime())) {
      d = new Date(p2 < 100 ? 2000 + p2 : p2, p1 - 1, p0);
    }
  }

  return d;
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
