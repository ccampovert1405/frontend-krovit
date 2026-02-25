// ═══════════════════════════════════════════════════════════
// SERVICIO DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════

const API_BASE_URL = 'http://localhost:1000';

// ─── Interfaces ───
export interface LoginCredentials {
    correo: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthUser {
    id: number;
    email: string;
    name?: string;
    role?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user?: AuthUser;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

// ─── Helpers ───
const getStoredAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
};

export const getAuthHeaders = (): Record<string, string> => {
    const token = getStoredAccessToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

// ─── API Calls ───

/**
 * POST /api/auth/login
 * Inicia sesión con correo y contraseña
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Credenciales incorrectas');
    }

    return response.json();
};

/**
 * POST /api/auth/refresh
 * Renueva el access token usando el refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
        throw new Error('No se pudo renovar la sesión');
    }

    return response.json();
};

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 */
export const changePassword = async (payload: ChangePasswordPayload): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al cambiar la contraseña');
    }

    return response.json();
};
