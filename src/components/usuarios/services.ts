// ─── Re-exports desde api.ts centralizado ─────────────────────────────────
export {
    apiGetUsers as getUsuarios,
    apiGetUserById as getUsuarioById,
    apiCreateUser as createUsuario,
    apiUpdateUser as updateUsuario,
    apiDeleteUser as deleteUsuario,
    apiGetRoles as getRoles,
} from '@/services/api';
