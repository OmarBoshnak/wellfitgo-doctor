/**
 * Clients Service
 * @description Service for fetching and managing doctor's clients from the backend
 */

import api from './api/client';
import { DayFilter, Client, DayCounts } from '@/src/hooks/useClients';

// Backend response types
interface ClientsResponse {
    clients: BackendClient[];
    counts: DayCounts;
    pagination: {
        page: number;
        totalPages: number;
        total: number;
    };
}

interface BackendClient {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    status: string;
    weeklyCheckinDay: string;
    progress: number;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    lastCheckIn?: string;
    lastCheckInDays?: number;
    daysSinceJoined: number;
    unreadMessages: number;
    subscriptionStatus: string;
    needsAttention: boolean;
}

interface ClientProgressResponse {
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    weightHistory: Array<{ date: string; weight: number }>;
    weeklyGoals: Record<string, any>;
    mealCompliance: number;
    waterIntake: number;
    exerciseMinutes: number;
}

// Transform backend client to frontend Client type
const transformClient = (backendClient: BackendClient): Client => ({
    id: backendClient.id,
    name: `${backendClient.firstName} ${backendClient.lastName || ''}`.trim(),
    firstName: backendClient.firstName,
    lastName: backendClient.lastName,
    email: backendClient.email,
    phone: backendClient.phone,
    avatar: backendClient.avatarUrl || null,
    startWeight: backendClient.startWeight,
    currentWeight: backendClient.currentWeight,
    targetWeight: backendClient.targetWeight,
    progress: backendClient.progress,
    weeklyCheckinDay: backendClient.weeklyCheckinDay as DayFilter,
    weeklyCheckinEnabled: true,
    lastActiveAt: backendClient.lastCheckIn,
    lastCheckInDays: backendClient.lastCheckInDays ?? null,
    subscriptionStatus: backendClient.subscriptionStatus,
    createdAt: '', // Not returned from backend
    daysSinceJoined: backendClient.daysSinceJoined,
});

// API Functions
export const clientsService = {
    /**
     * Get clients with filtering, search, and pagination
     */
    async getClients(
        filter: DayFilter = 'all',
        search: string = '',
        page: number = 1,
        limit: number = 50
    ): Promise<{ clients: Client[]; counts: DayCounts }> {
        try {
            const params = new URLSearchParams({
                filter,
                search,
                page: page.toString(),
                limit: limit.toString(),
            });

            const response = await api.get(`/doctors/clients?${params.toString()}`);

            if (response.data.success) {
                const data = response.data.data as ClientsResponse;
                return {
                    clients: data.clients.map(transformClient),
                    counts: data.counts,
                };
            }
            throw new Error(response.data.message || 'Failed to fetch clients');
        } catch (error) {
            console.error('[ClientsService] Error fetching clients:', error);
            throw error;
        }
    },

    /**
     * Send reminder notification to a client
     */
    async sendReminder(
        clientId: string,
        type: 'checkin' | 'weight' | 'general' = 'general',
        message?: string
    ): Promise<void> {
        try {
            const response = await api.post(`/doctors/clients/${clientId}/send-reminder`, {
                type,
                message,
            });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to send reminder');
            }
        } catch (error) {
            console.error('[ClientsService] Error sending reminder:', error);
            throw error;
        }
    },

    /**
     * Get detailed client progress
     */
    async getClientProgress(clientId: string): Promise<ClientProgressResponse> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/progress`);

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch client progress');
        } catch (error) {
            console.error('[ClientsService] Error fetching client progress:', error);
            throw error;
        }
    },

    /**
     * Get client activity history
     */
    async getClientActivity(clientId: string, limit: number = 20): Promise<any[]> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/activity?limit=${limit}`);

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch client activity');
        } catch (error) {
            console.error('[ClientsService] Error fetching client activity:', error);
            return [];
        }
    },

    /**
     * Update client notes
     */
    async updateClientNotes(clientId: string, notes: string): Promise<void> {
        try {
            const response = await api.put(`/doctors/clients/${clientId}/notes`, { notes });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update notes');
            }
        } catch (error) {
            console.error('[ClientsService] Error updating client notes:', error);
            throw error;
        }
    },
};

export default clientsService;
