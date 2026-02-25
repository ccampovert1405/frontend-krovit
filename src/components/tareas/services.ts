// ─── Re-exports desde api.ts centralizado ─────────────────
export {
    apiGetTareas as getTareas,
    apiCreateTarea as createTarea,
    apiUpdateTarea as updateTarea,
    apiDeleteTarea as deleteTarea,
} from '@/services/api';
