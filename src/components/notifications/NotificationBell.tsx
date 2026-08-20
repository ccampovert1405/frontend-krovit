import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';

export const NotificationBell: React.FC = () => {
    const op = useRef<OverlayPanel>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="notification-bell" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Button
                icon="pi pi-bell"
                rounded
                text
                severity="secondary"
                aria-label="Notificaciones"
                onClick={(e) => op.current?.toggle(e)}
                style={{ position: 'relative', overflow: 'visible' }}
            >
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            <OverlayPanel
                ref={op}
                style={{ width: '350px' }}
                pt={{
                    content: { style: { padding: 0 } }
                }}
            >
                <NotificationList
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                />
            </OverlayPanel>
        </div>
    );
};
