import { Meta } from '@/types';
import {
    apiGetForecastsFilter,
    apiGetForecastsByUser,
    apiUpdateForecast,
    apiCreateForecast,
    ForecastResponseJefe
} from '@/services/api';

// ═══════════════════════════════════════════════════════════
// SERVICIOS DE METAS (FORECASTS)
// ═══════════════════════════════════════════════════════════

export const getMetasFilter = async (params: { mes: string; anio: string; agente?: string }): Promise<Meta[] | ForecastResponseJefe> => {
    return apiGetForecastsFilter(params);
};

export const getMetasByUser = async (userId: string | number, params: { mes: string; anio: string }): Promise<Meta[] | ForecastResponseJefe> => {
    return apiGetForecastsByUser(userId, params);
};

export const saveMeta = async (meta: Partial<Meta>): Promise<Meta> => {
    if (meta.id) {
        return apiUpdateForecast(meta.id, meta);
    } else {
        return apiCreateForecast(meta);
    }
};

// Mantener compatibilidad con el código existente si es necesario, 
// o refactorizar el index.tsx directamente.
// Por ahora, agregamos los nuevos y mantendremos los nombres si es posible.
export const getMetas = async (): Promise<Meta[]> => {
    // Esto era para localStorage, el nuevo flujo usará getMetasFilter o getMetasByUser
    // Para no romper el index.tsx inicial mientras refactorizo, retorno vacío o implemento un default
    return [];
};
