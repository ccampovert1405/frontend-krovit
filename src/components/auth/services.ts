// ═══════════════════════════════════════════════════════════
// AUTH SERVICE — Re-exporta desde el servicio central
// ═══════════════════════════════════════════════════════════

export {
    login,
    refreshAccessToken,
    changePassword,
    getAuthHeaders,
    type LoginCredentials,
    type AuthTokens,
    type AuthUser,
    type LoginResponse,
    type ChangePasswordPayload,
} from '@/services/authService';
