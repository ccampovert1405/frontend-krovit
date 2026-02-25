import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
    login as apiLogin,
    refreshAccessToken,
    changePassword as apiChangePassword,
    LoginCredentials,
    ChangePasswordPayload,
    AuthUser,
} from '@/services/authService';

// ═══════════════════════════════════════════════════════════
// CONTEXTO DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    changePassword: (payload: ChangePasswordPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook para usar el contexto ───
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

// ─── Provider ───
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ─── Iniciar refresh automático ───
    const startRefreshInterval = useCallback((rToken: string) => {
        // Limpiar intervalo anterior
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }

        // Renovar cada 14 minutos (antes de que expire el token de 15 min)
        refreshIntervalRef.current = setInterval(async () => {
            try {
                const data = await refreshAccessToken(rToken);
                localStorage.setItem('accessToken', data.accessToken);
            } catch {
                // Si falla el refresh, cerrar sesión
                logout();
            }
        }, 14 * 60 * 1000);
    }, []);

    // ─── Cerrar sesión ───
    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
    }, []);

    // ─── Verificar sesión al cargar ───
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const storedUser = localStorage.getItem('user');

        if (accessToken && refreshToken) {
            setIsAuthenticated(true);
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Si falla el parse, ignorar
                }
            }
            startRefreshInterval(refreshToken);
        }
        setLoading(false);
    }, [startRefreshInterval]);

    // ─── Limpiar al desmontar ───
    useEffect(() => {
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
        };
    }, []);

    // ─── Iniciar sesión ───
    const login = useCallback(async (credentials: LoginCredentials) => {
        const data = await apiLogin(credentials);

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        }

        setIsAuthenticated(true);
        startRefreshInterval(data.refreshToken);
    }, [startRefreshInterval]);

    // ─── Cambiar contraseña ───
    const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
        await apiChangePassword(payload);
    }, []);

    const value: AuthContextType = {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        changePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
