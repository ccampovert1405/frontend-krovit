// ─── Re-exports desde api.ts centralizado ─────────────────────────────────
export {
    apiGetPermisos as getPermisos,
    apiCreatePermiso as createPermiso,
    apiUpdatePermiso as updatePermiso,
    apiDeletePermiso as deletePermiso,
    apiGetRoles as getRoles,
} from '@/services/api';
