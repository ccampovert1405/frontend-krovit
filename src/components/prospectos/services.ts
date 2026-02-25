// ─── Re-exports desde api.ts centralizado ─────────────────
// Este archivo delega a src/services/api.ts para mantener
// compatibilidad con imports existentes en el componente.
export {
    apiGetProspectos as getProspectos,
    apiCreateProspecto as createProspecto,
    apiUpdateProspecto as updateProspecto,
    apiDeleteProspecto as deleteProspecto,
} from '@/services/api';
