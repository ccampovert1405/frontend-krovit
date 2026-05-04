import { api } from './api';

// ═══════════════════════════════════════════════════════════
// SERVICIO DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════

// ─── Interfaces ───
export interface LoginCredentials {
    correo: string;
    password: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export interface MenuItemConfig {
    label: string;
    ruta: string;
    icono: string;
}

export interface AuthUser {
    id: string;
    correo: string;
    nombres: string;
    apellidos: string;
    rol: string;
    permisos: string[];
    menus: MenuItemConfig[];
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
}

export interface ChangePasswordPayload {
    oldPassword: string; // Contraseña actual
    newPassword: string;
}

// ─── API Calls ───

/**
 * POST /auth/login
 * Inicia sesión con correo y contraseña
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
};

/**
 * POST /auth/refresh
 * Renueva el access token usando el refresh token (Esta función suele usarse en el interceptor)
 */
export const refreshAccessToken = async (refresh_token: string): Promise<{ access_token: string }> => {
    const response = await api.post<{ access_token: string }>('/auth/refresh', {
        refresh_token,
        refreshToken: refresh_token
    });
    return response.data;
};

/**
 * POST /auth/change-password
 * Cambia la contraseña del usuario autenticado
 */
export const changePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/change-password', payload);
    return response.data;
};

/**
 * GET /auth/menu
 * Obtiene la configuración del menú según el rol/permisos (Nuevo)
 */
export interface MenuConfigItem {
    key: string;
    label: string;
    icon: string;
    permission?: string;
}

export const getMenuConfig = async (): Promise<MenuConfigItem[]> => {
    const response = await api.get<MenuConfigItem[]>('/auth/menu');
    return response.data;
};
