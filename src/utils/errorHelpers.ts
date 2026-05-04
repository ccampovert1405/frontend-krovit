import { AxiosError } from 'axios';

/**
 * Interfaz para la respuesta de error estándar del backend (NestJS/Common)
 */
interface ApiErrorResponse {
    message?: string | string[];
    error?: string;
    statusCode?: number;
}

/**
 * Extrae el mensaje de error de una excepción de Axios o Error estándar.
 */
export const getErrorMessage = (err: any): string => {
    const axiosError = err as AxiosError<ApiErrorResponse>;
    if (axiosError.response?.data?.message) {
        const msg = axiosError.response.data.message;
        return Array.isArray(msg) ? msg[0] : msg;
    }
    return err.message || 'Ha ocurrido un error inesperado';
};

/**
 * Obtiene el código de estado HTTP de un error de Axios.
 */
export const getErrorStatus = (err: any): number | undefined => {
    return (err as AxiosError)?.response?.status;
};

/**
 * Maneja las notificaciones de error basadas en el código de estado.
 * - 409 (Conflict): Warning (Amarillo)
 * - Otros: Error (Rojo)
 */
export const notifyApiError = (
    err: any,
    notifications: { showError: (msg: string, title?: string) => void, showWarn: (msg: string, title?: string) => void },
    defaultTitle: string = 'Error'
) => {
    const status = getErrorStatus(err);
    const message = getErrorMessage(err);

    if (status === 409) {
        notifications.showWarn(message, 'Información');
    } else {
        notifications.showError(message, defaultTitle);
    }
};
