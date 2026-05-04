// ═══════════════════════════════════════════════════════════
// NOTIFICATION CONTEXT — Sistema de notificaciones global
// Uso:
//   const { showSuccess, showError, showInfo } = useNotification();
//   showSuccess('Prospecto creado correctamente');
// ═══════════════════════════════════════════════════════════

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { Toast } from 'primereact/toast';

// ─── Tipos ──────────────────────────────────────────────
type NotificationType = 'success' | 'error' | 'info' | 'warn';

interface NotificationContextValue {
    showSuccess: (message: string, title?: string) => void;
    showError: (message: string, title?: string) => void;
    showInfo: (message: string, title?: string) => void;
    showWarn: (message: string, title?: string) => void;
}

// ─── Contexto ───────────────────────────────────────────
const NotificationContext = createContext<NotificationContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────
interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const toast = useRef<Toast>(null);

    const show = (type: NotificationType, message: string, title?: string) => {
        const defaults: Record<NotificationType, string> = {
            success: 'Éxito',
            error: 'Error',
            info: 'Información',
            warn: 'Advertencia',
        };
        toast.current?.show({
            severity: type,
            summary: title ?? defaults[type],
            detail: message,
            life: 4000,          // desaparece en 4s
            closable: true,
        });
    };

    const value: NotificationContextValue = {
        showSuccess: (msg, title) => show('success', msg, title),
        showError: (msg, title) => show('error', msg, title),
        showInfo: (msg, title) => show('info', msg, title),
        showWarn: (msg, title) => show('warn', msg, title),
    };

    return (
        <NotificationContext.Provider value={value}>
            {/* Toast global — montado aquí para que sea único en toda la app */}
            <Toast
                ref={toast}
                position="top-right"
                style={{ zIndex: 9999 }}
                pt={{
                    root: {
                        style: {
                            minWidth: '320px',
                            maxWidth: '420px',
                        }
                    },
                    message: {
                        style: {
                            borderRadius: '16px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                            border: 'none',
                            marginBottom: '12px',
                            backdropFilter: 'blur(10px)',
                        }
                    },
                    content: {
                        style: {
                            padding: '16px 20px',
                            alignItems: 'center',
                        }
                    },
                    icon: {
                        style: {
                            fontSize: '1.4rem',
                            marginRight: '12px',
                        }
                    },
                    summary: {
                        style: {
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            marginBottom: '2px',
                        }
                    },
                    detail: {
                        style: {
                            fontSize: '0.86rem',
                            fontWeight: 500,
                            lineHeight: 1.5,
                            opacity: 0.9,
                        }
                    },
                    closeButton: {
                        style: {
                            width: '24px',
                            height: '24px',
                            marginLeft: '12px',
                        }
                    }
                }}
            />
            {children}
        </NotificationContext.Provider>
    );
};

// ─── Hook de consumo ────────────────────────────────────
export const useNotification = (): NotificationContextValue => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotification debe usarse dentro de <NotificationProvider>');
    }
    return ctx;
};

export default NotificationContext;
