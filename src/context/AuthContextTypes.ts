import { AuthUser, LoginCredentials, ChangePasswordPayload } from '@/services/authService';

export interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    changePassword: (payload: ChangePasswordPayload) => Promise<void>;
    hasPermission: (permission: string) => boolean;
}
