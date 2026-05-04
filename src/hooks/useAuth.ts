import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContextCore';
import { AuthContextType } from '@/context/AuthContextTypes';

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};
