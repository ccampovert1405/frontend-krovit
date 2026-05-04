import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useNotification } from '@/context/NotificationContext';
import { RealtimeNotification } from '@/types';
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '@/services/api';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:1000';

export const useNotifications = () => {
    const { user } = useAuth();
    const { showInfo } = useNotification();
    const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await apiGetNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.leido).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        const newSocket = io(SOCKET_URL, {
            query: { userId: user.id },
            transports: ['websocket']
        });

        newSocket.on('connect', () => {
            console.log('Connected to notification socket');
        });

        newSocket.on('notification', (notification: RealtimeNotification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            showInfo(notification.mensaje, notification.titulo);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user?.id, fetchNotifications, showInfo]);

    const markAsRead = async (id: number) => {
        try {
            await apiMarkNotificationRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, leido: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiMarkAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
