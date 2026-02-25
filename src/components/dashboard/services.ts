// ─── Re-exports desde api.ts centralizado ─────────────────
export type { DashboardKPIs } from '@/services/api';
export {
    apiGetDashboardKPIs as getDashboardKPIs,
    apiGetDashboardPipeline as getDashboardPipeline,
} from '@/services/api';
