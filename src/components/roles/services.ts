// ─── Re-exports desde api.ts centralizado ─────────────────────────────────
export {
    apiGetRoles as getRoles,
    apiGetRolById as getRolById,
    apiCreateRol as createRol,
    apiUpdateRol as updateRol,
    apiDeleteRol as deleteRol,
} from '@/services/api';
