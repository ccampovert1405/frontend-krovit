// ═══════════════════════════════════════════════════════════
// SERVICIOS CENTRALIZADOS — CRM Planifikt
//
// FUENTE ÚNICA para todas las llamadas HTTP.
// Configura la URL base en .env:  VITE_API_URL=http://localhost:1000/api
// ═══════════════════════════════════════════════════════════

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:1000/api';

// ─── Helpers de autenticación ────────────────────────────
const getToken = () => localStorage.getItem('accessToken') ?? '';
const getRefresh = () => localStorage.getItem('refreshToken') ?? '';
const setToken = (t: string) => localStorage.setItem('accessToken', t);

const buildHeaders = (extra: Record<string, string> = {}): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
});

// ─── Refresh Token automático ─────────────────────────────
const tryRefresh = async (): Promise<boolean> => {
    const refresh = getRefresh();
    if (!refresh) return false;
    try {
        const res = await fetch(`${BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) return false;
        const { accessToken } = await res.json();
        setToken(accessToken);
        return true;
    } catch {
        return false;
    }
};

// ─── fetch central con retry 401 ────────────────────────
export const apiFetch = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const url = `${BASE}${path}`;
    let res = await fetch(url, { ...options, headers: buildHeaders(options.headers as Record<string, string>) });

    if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            res = await fetch(url, { ...options, headers: buildHeaders(options.headers as Record<string, string>) });
        }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
};

// ════════════════════════════════════════════════════════════
// PROSPECTOS  →  /prospects
// ════════════════════════════════════════════════════════════
export interface ProspectoAPI {
    id: string | number;
    nombre: string;
    apellido?: string;
    email: string;
    telefono?: string;
    celular?: string;
    ciudad?: string;
    empresa?: string;
    cargo?: string;
    etapa?: string;
    fuente?: string;
    notas?: string;
    mes?: number;
    agente?: string;
}

export const apiGetProspectos = () => apiFetch<ProspectoAPI[]>('/prospects');
export const apiCreateProspecto = (data: Partial<ProspectoAPI>) => apiFetch<ProspectoAPI>('/prospects', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateProspecto = (id: string | number, data: Partial<ProspectoAPI>) => apiFetch<ProspectoAPI>(`/prospects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteProspecto = (id: string | number) => apiFetch<void>(`/prospects/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// OPORTUNIDADES  →  /oportunidades
// ════════════════════════════════════════════════════════════
export interface OportunidadAPI {
    id: number;
    nombre: string;
    cliente?: string;
    clienteId?: number;
    producto?: string;
    plan?: number | string;
    fuente?: string;
    notas?: string;
    valor?: number;
    probabilidad?: number;
    etapa?: string;
    fecha?: string;
    mes?: number;
    agente?: string;
    color?: string;
}

export const apiGetOportunidades = () => apiFetch<OportunidadAPI[]>('/oportunidades');
export const apiCreateOportunidad = (data: Partial<OportunidadAPI>) => apiFetch<OportunidadAPI>('/oportunidades', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateOportunidad = (id: number, data: Partial<OportunidadAPI>) => apiFetch<OportunidadAPI>(`/oportunidades/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteOportunidad = (id: number) => apiFetch<void>(`/oportunidades/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// USUARIOS  →  /users
// ════════════════════════════════════════════════════════════
export interface UsuarioAPI {
    id: number;
    nombre: string;
    email: string;
    rol?: string;
}

export const apiGetUsers = () => apiFetch<UsuarioAPI[]>('/users');
export const apiCreateUser = (data: Partial<UsuarioAPI>) => apiFetch<UsuarioAPI>('/users', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateUser = (id: number, data: Partial<UsuarioAPI>) => apiFetch<UsuarioAPI>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// ════════════════════════════════════════════════════════════
// ACTIVIDADES  →  /actividades
// ════════════════════════════════════════════════════════════
export interface ActividadAPI {
    id: number;
    titulo?: string;
    tipo?: string;
    fecha?: string;
    mes?: number;
    agente?: string;
    prospectoId?: number;
    oportunidadId?: number;
    notas?: string;
}

export const apiGetActividades = () => apiFetch<ActividadAPI[]>('/actividades');
export const apiCreateActividad = (data: Partial<ActividadAPI>) => apiFetch<ActividadAPI>('/actividades', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateActividad = (id: number, data: Partial<ActividadAPI>) => apiFetch<ActividadAPI>(`/actividades/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteActividad = (id: number) => apiFetch<void>(`/actividades/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// TAREAS  →  /tareas
// ════════════════════════════════════════════════════════════
export interface TareaAPI {
    id: number;
    titulo?: string;
    tipo?: string;
    prioridad?: string;
    fecha?: string;
    mes?: number;
    agente?: string;
    completada?: boolean;
    prospectoId?: number;
}

export const apiGetTareas = () => apiFetch<TareaAPI[]>('/tareas');
export const apiCreateTarea = (data: Partial<TareaAPI>) => apiFetch<TareaAPI>('/tareas', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateTarea = (id: number, data: Partial<TareaAPI>) => apiFetch<TareaAPI>(`/tareas/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteTarea = (id: number) => apiFetch<void>(`/tareas/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// DASHBOARD  →  /dashboard
// ════════════════════════════════════════════════════════════
export interface DashboardKPIs {
    totalProspectos: number;
    prospectosMes: number;
    totalOportunidades: number;
    valorPipeline: number;
    eficacia: number;
    tareasCompletadas: number;
}

export const apiGetDashboardKPIs = () => apiFetch<DashboardKPIs>('/dashboard/kpis');
export const apiGetDashboardPipeline = () => apiFetch<unknown>('/dashboard/pipeline');

export default apiFetch;
