/**
 * Notification Service
 * Handles all notification-related API calls
 */
import api from './api/client';

export interface Notification {
    id: string;
    type: 'message' | 'weight_log' | 'appointment' | 'plan_update';
    title: string;
    body: string;
    clientId?: string;
    clientName?: string;
    isRead: boolean;
    actionUrl?: string;
    timestamp: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: Notification[];
    unreadCount: number;
}

class NotificationService {
    /**
     * Fetch notifications for the current doctor
     */
    async getNotifications(limit: number = 20): Promise<NotificationsResponse> {
        const response = await api.get<NotificationsResponse>(`/doctors/notifications?limit=${limit}`);
        return response.data;
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<number> {
        const response = await api.get<NotificationsResponse>('/doctors/notifications?limit=1');
        return response.data.unreadCount;
    }

    /**
     * Mark specific notifications as read
     */
    async markAsRead(notificationIds: string[]): Promise<void> {
        await api.post('/doctors/notifications/mark-read', { notificationIds });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        await api.post('/doctors/notifications/mark-read', { markAll: true });
    }
}

export const notificationService = new NotificationService();
