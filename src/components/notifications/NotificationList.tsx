import React from 'react';
import { RealtimeNotification } from '@/types';
import { COLORS } from '@/utils/constants';
import { Button } from 'primereact/button';
import { IconBox } from '@/components/ui';

interface NotificationListProps {
    notifications: RealtimeNotification[];
    onMarkAsRead: (id: number) => void;
    onMarkAllAsRead: () => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead
}) => {
    const getIcon = (tipo: RealtimeNotification['tipo']) => {
        switch (tipo) {
            case 'asignacion': return 'pi-user-plus';
            case 'venta': return 'pi-shopping-cart';
            case 'aviso': return 'pi-info-circle';
            default: return 'pi-bell';
        }
    };

    const getColor = (tipo: RealtimeNotification['tipo']) => {
        switch (tipo) {
            case 'asignacion': return '#3B82F6'; // Blue
            case 'venta': return '#10B981'; // Green
            case 'aviso': return '#F59E0B'; // Amber
            default: return COLORS.red;
        }
    };

    return (
        <div className="flex flex-column w-full" style={{ maxHeight: '400px' }}>
            <div className="flex align-items-center justify-content-between p-3 border-bottom-1" style={{ borderColor: COLORS.gray100 }}>
                <span className="font-bold text-900">Notificaciones</span>
                <Button
                    label="Marcar todas como leídas"
                    link
                    size="small"
                    onClick={onMarkAllAsRead}
                    disabled={notifications.every(n => n.leido)}
                />
            </div>

            <div className="overflow-y-auto flex-grow-1" style={{ minWidth: '320px' }}>
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-500">
                        <i className="pi pi-bell-slash text-4xl mb-2" />
                        <p>No hay notificaciones</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => !n.leido && onMarkAsRead(n.id)}
                            className={`flex align-items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-duration-200 ${!n.leido ? 'bg-blue-50' : ''}`}
                            style={{ borderBottom: `1px solid ${COLORS.gray100}` }}
                        >
                            <IconBox 
                                icon={getIcon(n.tipo)} 
                                color={getColor(n.tipo)} 
                                bg={`${getColor(n.tipo)}15`} 
                                size="36px" 
                                iconSize="0.9rem" 
                                rounded={false} 
                                className="border-round-circle flex-shrink-0" 
                            />
                            <div className="flex-grow-1">
                                <div className="flex align-items-center justify-content-between mb-1">
                                    <span className={`font-bold text-sm ${!n.leido ? 'text-900' : 'text-700'}`}>{n.titulo}</span>
                                    <span className="text-xs text-500">
                                        {new Date(n.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className={`text-xs m-0 ${!n.leido ? 'text-800' : 'text-600'}`} style={{ lineHeight: '1.4' }}>
                                    {n.mensaje}
                                </p>
                            </div>
                            {!n.leido && (
                                <div
                                    className="border-round-circle flex-shrink-0 mt-2"
                                    style={{ width: '8px', height: '8px', backgroundColor: '#3B82F6' }}
                                />
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
