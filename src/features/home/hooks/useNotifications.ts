/**
 * useNotifications Hook
 * Manages notification state and backend integration
 */
import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '@/src/shared/services/notification.service';

export interface NotificationItem {
    id: string;
    type: 'message' | 'weight_log';
    title: string;
    subtitle: string;
    avatar?: string;
    timestamp: number;
    relativeTime: string;
    isRead: boolean;
    data: Record<string, unknown>;
}

interface UseNotificationsReturn {
    notifications: NotificationItem[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    markAsRead: (ids: string[]) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

/**
 * Get relative time string from timestamp
 */
const getRelativeTime = (timestamp: string): string => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
};

/**
 * Transform backend notification to UI format
 */
const transformNotification = (notification: Notification): NotificationItem => {
    return {
        id: notification.id,
        type: notification.type === 'message' ? 'message' : 'weight_log',
        title: notification.title,
        subtitle: notification.body,
        avatar: undefined, // Backend doesn't include avatar currently
        timestamp: new Date(notification.timestamp).getTime(),
        relativeTime: getRelativeTime(notification.timestamp),
        isRead: notification.isRead,
        data: {
            clientId: notification.clientId,
            clientName: notification.clientName,
            actionUrl: notification.actionUrl,
        },
    };
};

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await notificationService.getNotifications(20);
            const transformed = response.data.map(transformNotification);
            setNotifications(transformed);
            setUnreadCount(response.unreadCount);
        } catch (err) {
            console.error('[useNotifications] Error fetching notifications:', err);
            setError('Failed to load notifications');
            // Keep previous data on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (ids: string[]) => {
        try {
            await notificationService.markAsRead(ids);
            setNotifications((prev) =>
                prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - ids.length));
        } catch (err) {
            console.error('[useNotifications] Error marking as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('[useNotifications] Error marking all as read:', err);
        }
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead,
    };
}

/**
 * Hook to just get unread count - for header badge
 */
export function useUnreadNotificationCount(): { count: number; refetch: () => Promise<void> } {
    const [count, setCount] = useState<number>(0);

    const fetchCount = useCallback(async () => {
        try {
            const unread = await notificationService.getUnreadCount();
            setCount(unread);
        } catch (err) {
            console.error('[useUnreadNotificationCount] Error:', err);
        }
    }, []);

    useEffect(() => {
        fetchCount();
        // Refetch every 30 seconds for real-time feel
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, [fetchCount]);

    return { count, refetch: fetchCount };
}
