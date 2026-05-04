import React, { useRef } from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationList } from './NotificationList';

export const NotificationBell: React.FC = () => {
    const op = useRef<OverlayPanel>(null);
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <div className="notification-bell">
            <Button
                icon="pi pi-bell"
                rounded
                text
                severity="secondary"
                aria-label="Notificaciones"
                onClick={(e) => op.current?.toggle(e)}
                style={{ position: 'relative' }}
            >
                {unreadCount > 0 && (
                    <Badge
                        value={unreadCount}
                        severity="danger"
                        style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            minWidth: '18px',
                            height: '18px',
                            fontSize: '0.65rem'
                        }}
                    />
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
