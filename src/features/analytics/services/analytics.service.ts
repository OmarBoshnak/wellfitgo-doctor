/**
 * Analytics Service
 * @description Service for analytics-related API calls and actions
 */

import api from '@/src/shared/services/api/client';
import { TimeRange, DoctorAnalyticsData } from '@/src/features/analytics/types/analytics.types';

export interface SendReminderResponse {
    success: boolean;
    message: string;
}

export interface ExportReportResponse {
    success: boolean;
    data?: {
        url: string;
        filename: string;
    };
    message?: string;
}

class AnalyticsService {
    /**
     * Fetch analytics data for the given time range
     */
    async getAnalytics(timeRange: TimeRange): Promise<DoctorAnalyticsData> {
        try {
            const response = await api.get(`/doctors/analytics?range=${timeRange}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch analytics data');
            }

            return response.data.data;
        } catch (error) {
            console.error('[AnalyticsService] Error fetching analytics:', error);
            throw error;
        }
    }

    /**
     * Send reminder to a client
     */
    async sendReminder(clientId: string): Promise<SendReminderResponse> {
        try {
            const response = await api.post('/doctors/analytics/send-reminder', { clientId });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to send reminder');
            }

            return {
                success: true,
                message: response.data.message || 'Reminder sent successfully',
            };
        } catch (error) {
            console.error('[AnalyticsService] Error sending reminder:', error);
            throw error;
        }
    }

    /**
     * Export analytics report
     */
    async exportReport(timeRange: TimeRange, format: 'csv' | 'excel' = 'csv'): Promise<ExportReportResponse> {
        try {
            const response = await api.post('/doctors/analytics/export', { timeRange, format });

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to export report');
            }

            return {
                success: true,
                data: response.data.data,
            };
        } catch (error) {
            console.error('[AnalyticsService] Error exporting report:', error);
            throw error;
        }
    }

    /**
     * Get real-time analytics updates (WebSocket)
     * This would be implemented with Socket.io for real-time updates
     */
    subscribeToAnalyticsUpdates(callback: (data: Partial<DoctorAnalyticsData>) => void) {
        // TODO: Implement WebSocket connection for real-time updates
        console.log('[AnalyticsService] Real-time updates not yet implemented');
        
        // Mock implementation - in real app, this would use Socket.io
        const mockInterval = setInterval(() => {
            // Mock data update
            callback({
                overview: {
                    activeClients: Math.floor(Math.random() * 100) + 50,
                    checkInRate: Math.random() * 100,
                    responseTime: Math.random() * 24,
                    avgProgress: Math.random() * 100,
                },
            });
        }, 30000); // Update every 30 seconds

        // Return unsubscribe function
        return () => {
            clearInterval(mockInterval);
        };
    }

    /**
     * Get client analytics details
     */
    async getClientAnalytics(clientId: string, timeRange: TimeRange): Promise<any> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/analytics?range=${timeRange}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch client analytics');
            }

            return response.data.data;
        } catch (error) {
            console.error('[AnalyticsService] Error fetching client analytics:', error);
            throw error;
        }
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(timeRange: TimeRange): Promise<any> {
        try {
            const response = await api.get(`/doctors/analytics/performance?range=${timeRange}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch performance metrics');
            }

            return response.data.data;
        } catch (error) {
            console.error('[AnalyticsService] Error fetching performance metrics:', error);
            throw error;
        }
    }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
