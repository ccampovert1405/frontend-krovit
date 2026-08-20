import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ═══════════════════════════════════════════════════════════
// SERVICIOS CENTRALIZADOS — CRM Planifikt
// ═══════════════════════════════════════════════════════════

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:1000/api';

// ─── Helpers de almacenamiento ────────────────────────────
const getToken = () => localStorage.getItem('access_token') ?? '';
const getRefresh = () => localStorage.getItem('refresh_token') ?? '';
const setToken = (t: string) => localStorage.setItem('access_token', t);

// ─── Instancia de Axios ─────────────────────────────
export const api = axios.create({
    baseURL: BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Interceptor de Petición (Token Bearer) ───
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Interceptor de Respuesta (Refresh Token) ───
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Evitar reintento automático si el error es 401 en el cambio de contraseña.
        // El backend usa 401 para indicar que la "contraseña actual" es incorrecta.
        const isChangePassword = originalRequest.url?.includes('/auth/change-password');

        if (error.response?.status === 401 && !originalRequest._retry && !isChangePassword) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refresh = getRefresh();
            if (!refresh) {
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                // Try with both common naming conventions for the body
                const res = await axios.post(`${BASE}/auth/refresh`, {
                    refreshToken: refresh,
                    refresh_token: refresh
                });

                // Try with both common naming conventions for the response token
                const access_token = res.data.access_token || res.data.accessToken || res.data.token;

                if (!access_token) {
                    throw new Error('Refresh failed - no access token in response');
                }

                setToken(access_token);
                processQueue(null, access_token);
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Si falla el refresh, forzar logout
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// ─── Wrapper de fetch para compatibilidad (opcional, pero mejor usar api directamente) ───
export const apiFetch = async <T>(
    path: string,
    options: any = {}
): Promise<T> => {
    const { method = 'GET', body, ...rest } = options;
    const res = await api.request<T>({
        url: path,
        method,
        data: body ? (typeof body === 'string' ? JSON.parse(body) : body) : undefined,
        ...rest,
    });
    return res.data;
};

// Helper para normalizar nombres de productos (remover tildes y a minúsculas)
const normalizeProduct = (prod: string) => prod.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
    cedula?: string;
    etapa?: string;
    fuente?: string;
    notas?: string;
    mes?: number;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    agente?: string;
    user_create_id?: number | string;
    user_create?: {
        userID: string;
        nombres: string;
        apellidos: string;
    };
    seguimientos?: SeguimientoAPI[];
}

export const apiGetProspectos = (params: { mes?: string; anio?: string; userId?: string | number }) => {
    const path = params.userId ? `/prospects/user/${params.userId}` : '/prospects';
    const queryParams = new URLSearchParams();
    if (params.mes) queryParams.append('mes', params.mes);
    if (params.anio) queryParams.append('anio', params.anio);
    const queryString = queryParams.toString();
    const finalPath = queryString ? `${path}?${queryString}` : path;
    return apiFetch<ProspectoAPI[]>(finalPath);
};
export const apiCreateProspecto = (data: Partial<ProspectoAPI>) => apiFetch<ProspectoAPI>('/prospects', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateProspecto = (id: string | number, data: Partial<ProspectoAPI>) => apiFetch<ProspectoAPI>(`/prospects/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteProspecto = (id: string | number) => apiFetch<void>(`/prospects/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// OPORTUNIDADES  →  /oportunidades
// ════════════════════════════════════════════════════════════
export interface OportunidadAPI {
    id: string | number;
    nombre_oportunidad: string;
    prospecto_id: string; // UUID
    prospecto?: {
        id: string;
        nombre: string;
        apellido: string;
    };
    plan_id: number;
    plan_detalle?: {
        id: number;
        monto: string | number;
        monto_final: string | number;
        valor_inscripcion: string | number;
    };
    plazo_id: number;
    plazo_detalle?: {
        id: number;
        valor_cuota: string | number;
    };
    financiamiento_id?: number | null;
    financiamiento_detalle?: any;
    estado: string;
    producto?: string;
    fuente?: string;
    notas?: string;
    valor?: number;
    probabilidad?: number;
    fecha?: string;
    created_at?: string;
    createdAt?: string;
    mes?: number;
    agente?: string;
    user_create_id?: number | string;
    user_create?: {
        userID: string;
        nombres: string;
        apellidos: string;
    };
    color?: string;
}

export const apiGetOportunidades = (params: { mes: string; anio: string; userId?: string | number }) => {
    const path = params.userId ? `/oportunidades/user/${params.userId}` : '/oportunidades';
    return apiFetch<OportunidadAPI[]>(`${path}?mes=${params.mes}&anio=${params.anio}`);
};
export const apiCreateOportunidad = (data: Partial<OportunidadAPI>) => apiFetch<OportunidadAPI>('/oportunidades', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateOportunidad = (id: string | number, data: Partial<OportunidadAPI>) => apiFetch<OportunidadAPI>(`/oportunidades/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteOportunidad = (id: string | number) => apiFetch<void>(`/oportunidades/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// USUARIOS  →  /users
// ════════════════════════════════════════════════════════════
export interface UsuarioAPI {
    userID: string;
    nombres: string;
    apellidos: string;
    estado?: 'activo' | 'inactivo' | string;
    correo?: string;
    email?: string;
    password?: string;
    rolId?: string;
    rol?: {
        id?: string;
        rolId?: string;
        nombreRol: string;
    };
}

export interface RolAPI {
    id: string; // Puede ser un number secuencial o UUID segun el endpoint
    rolId?: string; // El UUID real que pide el backend para relaciones
    nombreRol: string;
    permisos?: PermisoAPI[];
}

export interface PermisoAPI {
    id: string;
    nombreAccion: string;
    identificadorAccion: string;
    roleId?: string; // Formato del body: { roleId: 'uuid' }
    rolId?: string; // Alias por si acaso
    role?: {
        id?: string;
        rolId?: string;
        nombreRol: string;
        permisos?: PermisoAPI[];
    };
}

// ─── Usuarios CRUD ─────────────────────────────────────────
export const apiGetUsers = () => apiFetch<UsuarioAPI[]>('/users');
export const apiGetUserById = (id: string) => apiFetch<UsuarioAPI>(`/users/${id}`);
export const apiCreateUser = (data: Partial<UsuarioAPI>) => apiFetch<UsuarioAPI>('/users', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateUser = (id: string, data: Partial<UsuarioAPI>) => apiFetch<UsuarioAPI>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteUser = (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
export const apiGetUsersByRole = (roleName: string) => apiFetch<UsuarioAPI[]>(`/users/role/${roleName}`);

// ─── Roles CRUD ────────────────────────────────────────────
export const apiGetRoles = () => apiFetch<RolAPI[]>('/roles');
export const apiGetRolById = (id: string) => apiFetch<RolAPI>(`/roles/${id}`);
export const apiCreateRol = (data: { nombreRol: string }) => apiFetch<RolAPI>('/roles', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateRol = (id: string, data: { nombreRol: string }) => apiFetch<RolAPI>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteRol = (id: string) => apiFetch<void>(`/roles/${id}`, { method: 'DELETE' });

// ─── Permisos CRUD ─────────────────────────────────────────
export const apiGetPermisos = () => apiFetch<PermisoAPI[]>('/permissions');
export const apiCreatePermiso = (data: { nombreAccion: string; identificadorAccion: string; roleId: string }) => apiFetch<PermisoAPI>('/permissions', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdatePermiso = (id: string, data: Partial<{ nombreAccion: string; identificadorAccion: string; roleId: string }>) => apiFetch<PermisoAPI>(`/permissions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeletePermiso = (id: string) => apiFetch<void>(`/permissions/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// ACTIVIDADES  →  /activities
// ════════════════════════════════════════════════════════════
export interface ActividadAPI {
    id: number;
    titulo: string;
    tipo: string;
    fecha_inicio: string;
    hora_inicio: string;
    fecha_fin: string;
    hora_fin: string;
    contacto: string;
    ubicacion_link: string;
    notas: string;
    mes?: number;
    agente?: string;
}

export const apiGetActividades = () => apiFetch<ActividadAPI[]>('/activities');
export const apiGetActivityById = (id: number | string) => apiFetch<ActividadAPI>(`/activities/${id}`);
export const apiCreateActividad = (data: Partial<ActividadAPI>) => apiFetch<ActividadAPI>('/activities', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateActividad = (id: number | string, data: Partial<ActividadAPI>) => apiFetch<ActividadAPI>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteActividad = (id: number | string) => apiFetch<void>(`/activities/${id}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// TAREAS  →  /tareas
// ════════════════════════════════════════════════════════════
export interface TareaAPI {
    id: number | string;
    titulo?: string;
    descripcion?: string;
    prioridad?: string;
    tipo?: string;
    fecha?: string;
    hora?: string;
    recordatorio?: string;
    contacto?: string;
    cliente_id?: string | number | null;
    oportunidad_id?: string | number | null;
    completada?: boolean;
    agente?: string;
    user_create_id?: number | string;
    user_create?: {
        userID: string;
        nombres: string;
        apellidos: string;
    };
    estado?: string;
}

export const apiGetTareas = (params: { mes: string; anio: string; userId?: string | number }) => {
    const path = params.userId ? `/tareas/user/${params.userId}` : '/tareas';
    return apiFetch<TareaAPI[]>(`${path}?mes=${params.mes}&anio=${params.anio}`);
};
export const apiGetTareasPorOportunidad = (oportunidadId: string | number) => apiFetch<TareaAPI[]>(`/tareas/oportunidad/${oportunidadId}`);
export const apiCreateTarea = (data: Partial<TareaAPI>) => apiFetch<TareaAPI>('/tareas', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateTarea = (id: number | string, data: Partial<TareaAPI>) => apiFetch<TareaAPI>(`/tareas/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDeleteTarea = (id: number | string) => apiFetch<void>(`/tareas/${id}`, { method: 'DELETE' });

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

export interface DashboardIndices {
    kpi_produccion: {
        cantidad_prospectos_creados: number;
        cantidad_prospectos_planificados: number;
        ratio: number;
    };
    kpi_eficacia: {
        cantidad_oportunidades_cerradas: number;
        cantidad_oportunidades_creadas: number;
        ratio: number;
        cantidad_oportunidades_ganadas: number;
    };
    kpi_contribucion: {
        meta_ingresos: number;
        total_ingresos: number;
        ratio: number;
    };
}

export const apiGetDashboardKPIs = () => apiFetch<DashboardKPIs>('/dashboard/kpis');
export const apiGetDashboardPipeline = () => apiFetch<unknown>('/dashboard/pipeline');

export const apiGetDashboardIndex = (params: { mes: string; anio: string; userId: string | number; grupoId?: string | number }) => {
    let url = `/dashboard/index?userId=${params.userId}&mes=${params.mes}&anio=${params.anio}`;
    if (params.grupoId) url += `&grupoId=${params.grupoId}`;
    return apiFetch<DashboardIndices>(url);
};

export const apiGetDashboardUserIndex = (userId: string | number, params: { mes: string; anio: string; grupoId?: string | number }) => {
    let url = `/dashboard/user/${userId}?mes=${params.mes}&anio=${params.anio}`;
    if (params.grupoId) url += `&grupoId=${params.grupoId}`;
    return apiFetch<DashboardIndices>(url);
};

export interface DashboardJefeDetailsAPI {
    agenteId: string;
    nombre: string;
    forecast: {
        metaProspectos: number;
        metaOportunidades: number;
        metaCierres: number;
        metaIngresos: string | number;
    } | null;
    real: {
        prospectos: number;
        oportunidades: number;
        cierres: number;
        ingresos: number;
    };
    tareasPendientes: any[];
    totalTareasPendientes: number;
}

export const apiGetDashboardJefeDetails = (params: { mes: string; anio: string; grupoId?: string | number }) => {
    let url = `/dashboard/jefe/details?mes=${params.mes}&anio=${params.anio}`;
    if (params.grupoId) url += `&grupoId=${params.grupoId}`;
    return apiFetch<DashboardJefeDetailsAPI[]>(url);
};

export const apiGetOportunidadesSinGestion = (grupoId?: string | number) => {
    let url = '/dashboard/oportunidades-sin-gestion';
    if (grupoId && grupoId !== 'Todos') url += `?grupoId=${grupoId}`;
    return apiFetch<OportunidadAPI[]>(url);
};

// ════════════════════════════════════════════════════════════
// ADMINISTRACIÓN  →  /administracion
// ════════════════════════════════════════════════════════════

export interface DetalleListaPrecio {
    id: number;
    monto: number;
    valor_inscripcion: number;
    monto_final: number;
    detalles_plazo?: {
        id: number;
        valor_cuota: number;
        plazo?: Plazo;
    }[];
    detalles_financiamiento?: {
        id: number;
        valor_financiamiento: number | string;
        financiamiento?: Financiamiento;
    }[];
}

export interface ListaPrecio {
    id: number;
    detalle: string;
    producto: string;
    estado: boolean;
    detalles?: DetalleListaPrecio[];
}

export interface Plazo {
    id: number;
    tipo: string;
    num_plazo?: number;
    producto?: string;
    estado?: boolean;
}

export interface Financiamiento {
    id: number;
    tipo: string;
    cuotas?: number;
    estado?: boolean;
    producto?: string;
}

export interface DetallePlazo {
    id: number;
    valor_cuota: number;
}

export interface DetalleFinanciamiento {
    id: number;
    valor_financiamiento: number | string;
    // Estos campos podrían no venir en el detalle según la API real
    porcentaje?: number;
    cuotas?: number;
    valor_total?: number;
}

export const apiGetListaPrecio = () => apiFetch<ListaPrecio[]>('/administracion/lista-precio');
export const apiGetListaPrecioPorProducto = (producto: string) => apiFetch<ListaPrecio[]>(`/administracion/lista-precio/producto/${normalizeProduct(producto)}`);
export const apiGetListaPrecioDetalles = (id: number) => apiFetch<DetalleListaPrecio[]>(`/administracion/lista-precio/${id}/detalles`);

export const apiCreateListaPrecio = (data: Partial<ListaPrecio>) =>
    apiFetch<ListaPrecio>('/administracion/lista-precio', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateListaPrecio = (id: number | string, data: Partial<ListaPrecio>) =>
    apiFetch<ListaPrecio>(`/administracion/lista-precio/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteListaPrecio = (id: number | string) =>
    apiFetch<{ message: string }>(`/administracion/lista-precio/${id}`, { method: 'DELETE' });
export const apiUpdateListaPrecioEstado = (id: number | string, estado: boolean) =>
    apiFetch<ListaPrecio>(`/administracion/lista-precio/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
export const apiUpdatePlazoEstado = (id: number | string, estado: boolean) =>
    apiFetch<Plazo>(`/administracion/plazo/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
export const apiUpdateFinanciamientoEstado = (id: number | string, estado: boolean) =>
    apiFetch<Financiamiento>(`/administracion/financiamiento/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
export const apiGetPlazo = () => apiFetch<Plazo[]>('/administracion/plazo');
export const apiGetPlazosAll = () => apiFetch<Plazo[]>('/administracion/plazo/all');
export const apiCreatePlazo = (data: Partial<Plazo>) =>
    apiFetch<Plazo>('/administracion/plazo', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdatePlazo = (id: number | string, data: Partial<Plazo>) =>
    apiFetch<Plazo>(`/administracion/plazo/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeletePlazo = (id: number | string) =>
    apiFetch<{ message: string }>(`/administracion/plazo/${id}`, { method: 'DELETE' });
export const apiGetPlazoPorProducto = (producto: string) => apiFetch<Plazo[]>(`/administracion/plazo/producto/${normalizeProduct(producto)}`);
export const apiGetFinanciamiento = () => apiFetch<Financiamiento[]>('/administracion/financiamiento');
export const apiGetFinanciamientosAll = () => apiFetch<Financiamiento[]>('/administracion/financiamiento/all');
export const apiCreateFinanciamiento = (data: Partial<Financiamiento>) =>
    apiFetch<Financiamiento>('/administracion/financiamiento', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateFinanciamiento = (id: number | string, data: Partial<Financiamiento>) =>
    apiFetch<Financiamiento>(`/administracion/financiamiento/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteFinanciamiento = (id: number | string) =>
    apiFetch<{ message: string }>(`/administracion/financiamiento/${id}`, { method: 'DELETE' });
export const apiGetFinanciamientoPorProducto = (producto: string) => apiFetch<Financiamiento[]>(`/administracion/financiamiento/producto/${normalizeProduct(producto)}`);

export const apiGetDetallePlazo = (plazoId: number, detalleListaPrecioId: number) =>
    apiFetch<DetallePlazo>(`/administracion/detalle-plazo/${plazoId}/${detalleListaPrecioId}`);

export const apiGetDetalleFinanciamiento = (financiamientoId: number, detalleListaPrecioId: number) =>
    apiFetch<DetalleFinanciamiento>(`/administracion/detalle-financiamiento/${financiamientoId}/${detalleListaPrecioId}`);

// ════════════════════════════════════════════════════════════
// PLAN FINANCIERO  →  /plan-financiero
// ════════════════════════════════════════════════════════════
import type { PlanFinancieroData } from '@/types';

export const apiGetPlanFinanciero = (oportunidadId: number | string) =>
    apiFetch<PlanFinancieroData>(`/plan-financiero/${oportunidadId}`);

// ════════════════════════════════════════════════════════════
// FORECASTS (METAS)  →  /forecasts
// ════════════════════════════════════════════════════════════
import { Meta } from '@/types';

export interface ForecastResponseJefe {
    total: Meta;
    detalle: Meta[];
}

export const apiGetForecastsFilter = (params: { mes: string; anio: string; agente?: string }) => {
    let url = `/forecasts/search/filter?mes=${params.mes}&anio=${params.anio}`;
    if (params.agente) url += `&agente=${params.agente}`;
    return apiFetch<Meta[] | ForecastResponseJefe>(url);
};

export const apiGetForecastsByUser = (userId: string | number, params: { mes: string; anio: string }) =>
    apiFetch<Meta[] | ForecastResponseJefe>(`/forecasts/user/${userId}?mes=${params.mes}&anio=${params.anio}`);

export const apiUpdateForecast = (id: string | number, data: Partial<Meta>) =>
    apiFetch<Meta>(`/forecasts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const apiCreateForecast = (data: Partial<Meta>) =>
    apiFetch<Meta>('/forecasts', { method: 'POST', body: JSON.stringify(data) });

// ════════════════════════════════════════════════════════════
// NOTIFICACIONES  →  /notifications
// ════════════════════════════════════════════════════════════
import type { RealtimeNotification } from '@/types';

export const apiGetNotifications = () =>
    apiFetch<RealtimeNotification[]>('/notifications');

export const apiMarkNotificationRead = (id: number) =>
    apiFetch<RealtimeNotification>(`/notifications/${id}/read`, { method: 'PATCH' });

export const apiMarkAllNotificationsRead = () =>
    apiFetch<{ message: string }>('/notifications/read-all', { method: 'PATCH' });

// ════════════════════════════════════════════════════════════
// LEADS  →  /leads
// ════════════════════════════════════════════════════════════
export const apiUploadLeadsCSV = (formData: FormData) =>
    api.post('/leads/upload-csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'accept': '*/*'
        }
    }).then(res => res.data);

// ════════════════════════════════════════════════════════════
// GRUPOS DE VENTAS  →  /grupos-ventas
// ════════════════════════════════════════════════════════════
export interface GrupoVentasAPI {
    id: string | number;
    nombre: string;
    descripcion?: string;
    jefeComercialId?: string;
    jefeComercial?: UsuarioAPI;
    agentes?: UsuarioAPI[];
    leads?: boolean;
    agencia?: AgenciaAPI | null;
    agenciaId?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export const apiGetGruposVentas = () => apiFetch<GrupoVentasAPI[]>('/grupos');
export const apiGetGrupoVentasById = (id: string | number) => apiFetch<GrupoVentasAPI>(`/grupos/${id}`);
export const apiCreateGrupoVentas = (data: { nombre: string; descripcion?: string; jefeComercialId?: string; leads?: boolean; agenciaId?: number }) =>
    apiFetch<GrupoVentasAPI>('/grupos', { method: 'POST', body: JSON.stringify(data) });
export const apiUpdateGrupoVentas = (id: string | number, data: { nombre: string; descripcion?: string; jefeComercialId?: string; leads?: boolean; agenciaId?: number | null }) =>
    apiFetch<GrupoVentasAPI>(`/grupos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const apiDeleteGrupoVentas = (id: string | number) => apiFetch<void>(`/grupos/${id}`, { method: 'DELETE' });

export const apiAssignAgentesToGrupo = (id: string | number, agenteIds: string[]) =>
    apiFetch<void>(`/grupos/${id}/agentes`, { method: 'PATCH', body: JSON.stringify({ agenteIds }) });

export const apiRemoveAgenteFromGrupo = (id: string | number, agenteId: string) =>
    apiFetch<void>(`/grupos/${id}/agentes/${agenteId}`, { method: 'DELETE' });

// ════════════════════════════════════════════════════════════
// SEGUIMIENTOS  →  /seguimientos
// ════════════════════════════════════════════════════════════
export interface SeguimientoAPI {
    id: string;
    oportunidad_id?: string;
    prospect_id?: string;
    gestion_realizada: string;
    estado: 'En seguimiento' | 'Cerrada';
    tipo_seguimiento: 'NO CONTESTA' | 'VOLVER A LLAMAR' | 'NO INTERESA' | 'NÚMERO EQUIVOCADO';
    fecha: string;
    hora: string;
    minuto: string;
    calificacion_oportunidad: string;
    fecha_registro: string;
    usuario_id: string;
    numero_seguimiento: number;
}

export interface SemaforoAPI {
    oportunidadId: string;
    prospecto: string;
    agente: string;
    estadoOportunidad: string;
    cantidadSeguimientos: number;
    ultimaFecha: string;
    horasTranscurridas: number;
    semaforo: 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO' | 'LIBRE';
}

export const apiCreateSeguimiento = (data: Partial<SeguimientoAPI>) =>
    apiFetch<SeguimientoAPI>('/seguimientos', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateSeguimiento = (id: string, data: Partial<SeguimientoAPI>) =>
    apiFetch<SeguimientoAPI>(`/seguimientos/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const apiGetSeguimientosByOportunidad = (oportunidadId: string | number) =>
    apiFetch<SeguimientoAPI[]>(`/seguimientos/oportunidad/${oportunidadId}`);

export const apiGetSeguimientosByProspecto = (prospectoId: string | number) =>
    apiFetch<SeguimientoAPI[]>(`/seguimientos/prospecto/${prospectoId}`);

export const apiGetUncontactedProspectsCount = (params?: { mes?: string; anio?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.mes) queryParams.append('mes', params.mes);
    if (params?.anio) queryParams.append('anio', params.anio);
    const queryString = queryParams.toString();
    const path = queryString ? `/prospects/uncontacted/count?${queryString}` : '/prospects/uncontacted/count';
    return apiFetch<{ count: number }>(path);
};

export const apiGetSemaforo = () =>
    apiFetch<SemaforoAPI[]>('/seguimientos/semaforo');

export const apiReasignarOportunidad = (oportunidadId: string | number, nuevoAgenteId: string) =>
    apiFetch<any>(`/seguimientos/reasignar/${oportunidadId}`, { method: 'PUT', body: JSON.stringify({ nuevoAgenteId }) });

// ════════════════════════════════════════════════════════════
// AGENCIAS  →  /agencias
// ════════════════════════════════════════════════════════════
export interface AgenciaAPI {
    id: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
    encargado?: UsuarioAPI;
    encargadoId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export const apiGetAgencias = () =>
    apiFetch<AgenciaAPI[]>('/agencias');

export const apiGetAgenciaById = (id: string | number) =>
    apiFetch<AgenciaAPI>(`/agencias/${id}`);

export const apiCreateAgencia = (data: Partial<AgenciaAPI>) =>
    apiFetch<AgenciaAPI>('/agencias', { method: 'POST', body: JSON.stringify(data) });

export const apiUpdateAgencia = (id: string | number, data: Partial<AgenciaAPI>) =>
    apiFetch<AgenciaAPI>(`/agencias/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const apiDeleteAgencia = (id: string | number) =>
    apiFetch<void>(`/agencias/${id}`, { method: 'DELETE' });

export default apiFetch;
