// ─── Re-exports desde api.ts centralizado ─────────────────
export {
    apiGetActividades as getActividades,
    apiCreateActividad as createActividad,
    apiUpdateActividad as updateActividad,
    apiDeleteActividad as deleteActividad,
} from '@/services/api';
