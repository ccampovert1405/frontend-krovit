import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    login as apiLogin,
    changePassword as apiChangePassword,
    LoginCredentials,
    ChangePasswordPayload,
    AuthUser,
} from '@/services/authService';
import { AuthContextType } from './AuthContextTypes';
import { AuthContext } from './AuthContextCore';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ─── Cerrar sesión ───
    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login', { replace: true });
    }, [navigate]);

    // ─── Verificar sesión al cargar ───
    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const storedUser = localStorage.getItem('user');

        if (accessToken && refreshToken) {
            setIsAuthenticated(true);
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch {
                    // Silencio
                }
            }
        }
        setLoading(false);
    }, []);

    // ─── Iniciar sesión ───
    const login = useCallback(async (credentials: LoginCredentials) => {
        const data = await apiLogin(credentials);

        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        setIsAuthenticated(true);

        navigate('/dashboard', { replace: true });

    }, [navigate]);

    // ─── Cambiar contraseña ───
    const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
        await apiChangePassword(payload);
    }, []);

    // ─── Ayudante de Permisos ───
    const hasPermission = useCallback((permission: string) => {
        if (!user || !user.permisos) return false;
        // Si tiene permiso '*', permitir todo
        if (user.permisos.includes('*')) return true;
        return user.permisos.includes(permission);
    }, [user]);

    const value: AuthContextType = {
        isAuthenticated,
        user,
        loading,
        login,
        logout,
        changePassword,
        hasPermission,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
