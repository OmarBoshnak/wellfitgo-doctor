/**
 * Settings Service
 * @description Service for managing client settings, doctor assignments, and archiving
 */

import api from './api/client';

// Types
export interface ClientSettings {
    subscriptionStatus: string;
    assignedChatDoctor?: string | null;
    notificationSettings: {
        mealReminders: boolean;
        weeklyCheckin: boolean;
        coachMessages: boolean;
        mealReminderTime?: string;
        timezone?: string;
        mealRemindersSchedule?: {
            breakfast: { enabled: boolean; time: string };
            snack1: { enabled: boolean; time: string };
            lunch: { enabled: boolean; time: string };
            snack2: { enabled: boolean; time: string };
            dinner: { enabled: boolean; time: string };
        } | null;
    };
}

export interface NotificationSettings {
    mealReminders?: boolean;
    weeklyCheckin?: boolean;
    coachMessages?: boolean;
    mealReminderTime?: string;
    timezone?: string;
    mealRemindersSchedule?: {
        breakfast: { enabled: boolean; time: string };
        snack1: { enabled: boolean; time: string };
        lunch: { enabled: boolean; time: string };
        snack2: { enabled: boolean; time: string };
        dinner: { enabled: boolean; time: string };
    } | null;
}

export interface Doctor {
    _id: string;
    firstName: string;
    lastName?: string;
}

export const settingsService = {
    /**
     * Get client settings
     */
    async getClientSettings(clientId: string): Promise<ClientSettings> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/settings`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch client settings');
            }

            return response.data.data;
        } catch (error) {
            console.error('[SettingsService] Error fetching client settings:', error);
            throw error;
        }
    },

    /**
     * Update client notification settings
     */
    async updateNotificationSettings(clientId: string, settings: NotificationSettings): Promise<void> {
        try {
            const response = await api.put(`/doctors/clients/${clientId}/settings`, {
                notificationSettings: settings
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update notification settings');
            }
        } catch (error) {
            console.error('[SettingsService] Error updating notification settings:', error);
            throw error;
        }
    },

    /**
     * Assign chat doctor to client (admin only)
     */
    async assignChatDoctor(clientId: string, doctorId: string): Promise<void> {
        try {
            const response = await api.post(`/doctors/clients/${clientId}/assign-doctor`, {
                doctorId
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to assign chat doctor');
            }
        } catch (error) {
            console.error('[SettingsService] Error assigning chat doctor:', error);
            throw error;
        }
    },

    /**
     * Archive client
     */
    async archiveClient(clientId: string): Promise<void> {
        try {
            const response = await api.post(`/doctors/clients/${clientId}/archive`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to archive client');
            }
        } catch (error) {
            console.error('[SettingsService] Error archiving client:', error);
            throw error;
        }
    },

    /**
     * Get available doctors for assignment (admin only)
     */
    async getAvailableDoctors(): Promise<Doctor[]> {
        try {
            const response = await api.get('/doctors/available-doctors');

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch available doctors');
            }

            return response.data.data;
        } catch (error) {
            console.error('[SettingsService] Error fetching available doctors:', error);
            throw error;
        }
    },
};

export default settingsService;
