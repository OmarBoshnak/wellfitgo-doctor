/**
 * Dashboard Service
 * @description Service for fetching dashboard statistics from the backend
 */

import api from './api/client';

// Types
export interface DashboardStats {
    activeClients: number;
    activeClientsTrend: number;
    activeClientsTrendUp: boolean;
    unreviewedWeightLogs: number;
    plansExpiring: number;
    unreadMessages: number;
    todayAppointments: number;
}

export interface InboxStats {
    totalUnread: number;
    oldestUnread?: {
        preview: string;
        relativeTime: string;
    };
}

// Types for recent activity (matches backend response)
export interface RecentActivityItem {
    id: string;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

// Types for clients needing attention (matches backend response)
export interface ClientAttentionBackend {
    id: string;
    name: string;
    avatarUrl?: string;
    issue: 'weight_stalled' | 'missed_checkins' | 'low_engagement' | 'plan_expiring';
    issueDescription: string;
    severity: 'high' | 'medium' | 'low';
    lastActivity: string;
    priority: number;
    unreadMessages?: number;
}

// Types for appointments (matches backend response)
export interface AppointmentBackend {
    id: string;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    clientPhone?: string;
    time: string; // ISO string
    duration: number;
    type: 'consultation' | 'checkin' | 'followup';
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    meetingLink?: string;
}

// Types for weekly activity (matches backend response)
export interface WeeklyActivityDay {
    day: string;
    dayArabic: string;
    weightLogs: number;
    mealsCompleted: number;
    messages: number;
}

export interface WeeklyActivityBackend {
    days: WeeklyActivityDay[];
    totalWeightLogs: number;
    totalMealsCompleted: number;
    totalMessages: number;
    comparedToLastWeek: {
        weightLogs: number;
        mealsCompleted: number;
        messages: number;
    };
}

// Types for analytics (matches backend response)
export interface AnalyticsOverview {
    activeClients: number;
    checkInRate: number;
    responseTime: number | null;
}

export interface AnalyticsProgressBuckets {
    onTrack: number;
    needsAttention: number;
    atRisk: number;
}

export interface AnalyticsDailyActivity {
    date: string;
    messages: number;
    plans: number;
    checkIns: number;
}

export interface AnalyticsClientCheckIn {
    id: string;
    name: string;
    lastCheckIn: string | null;
    status: 'on_track' | 'needs_support' | 'at_risk';
}

export interface AnalyticsData {
    overview: AnalyticsOverview;
    progressBuckets: AnalyticsProgressBuckets;
    dailyActivity: AnalyticsDailyActivity[];
    clients: AnalyticsClientCheckIn[];
}

// API Functions
export const dashboardService = {
    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<DashboardStats> {
        try {
            const response = await api.get('/doctors/dashboard/stats');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch dashboard stats');
        } catch (error) {
            console.error('[DashboardService] Error fetching stats:', error);
            // Return default values on error
            return {
                activeClients: 0,
                activeClientsTrend: 0,
                activeClientsTrendUp: true,
                unreviewedWeightLogs: 0,
                plansExpiring: 0,
                unreadMessages: 0,
                todayAppointments: 0,
            };
        }
    },

    /**
     * Get inbox/messages stats (for unread messages count)
     */
    async getInboxStats(): Promise<InboxStats> {
        try {
            // Use the notifications endpoint to get unread message count
            const response = await api.get('/doctors/notifications');
            if (response.data.success) {
                const messageNotifications = response.data.data.filter(
                    (n: any) => n.type === 'message' && !n.isRead
                );
                const oldest = messageNotifications[messageNotifications.length - 1];

                return {
                    totalUnread: messageNotifications.length,
                    oldestUnread: oldest ? {
                        preview: oldest.body || '',
                        relativeTime: formatRelativeTime(oldest.timestamp),
                    } : undefined,
                };
            }
            throw new Error(response.data.message || 'Failed to fetch inbox stats');
        } catch (error) {
            console.error('[DashboardService] Error fetching inbox stats:', error);
            return {
                totalUnread: 0,
                oldestUnread: undefined,
            };
        }
    },

    /**
     * Get clients needing attention
     */
    async getClientsNeedingAttention(limit: number = 5): Promise<ClientAttentionBackend[]> {
        try {
            const response = await api.get(`/doctors/clients/needs-attention?limit=${limit}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch clients needing attention');
        } catch (error) {
            console.error('[DashboardService] Error fetching clients needing attention:', error);
            return [];
        }
    },

    /**
     * Get today's appointments
     */
    async getTodaysAppointments(limit: number = 5): Promise<AppointmentBackend[]> {
        try {
            const response = await api.get(`/doctors/appointments/today?limit=${limit}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch appointments');
        } catch (error) {
            console.error('[DashboardService] Error fetching appointments:', error);
            return [];
        }
    },

    /**
     * Get weekly activity data
     */
    async getWeeklyActivity(): Promise<WeeklyActivityBackend | null> {
        try {
            const response = await api.get('/doctors/activity/weekly');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch weekly activity');
        } catch (error) {
            console.error('[DashboardService] Error fetching weekly activity:', error);
            return null;
        }
    },

    /**
     * Get recent activity feed
     */
    async getRecentActivity(limit: number = 10): Promise<RecentActivityItem[]> {
        try {
            const response = await api.get(`/doctors/activity/recent?limit=${limit}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch recent activity');
        } catch (error) {
            console.error('[DashboardService] Error fetching recent activity:', error);
            return [];
        }
    },

    /**
     * Get analytics data for the analytics screen
     */
    async getAnalytics(timeRange: '7days' | '30days' | '3months'): Promise<AnalyticsData | null> {
        try {
            const response = await api.get(`/doctors/analytics?range=${timeRange}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch analytics');
        } catch (error) {
            console.error('[DashboardService] Error fetching analytics:', error);
            return null;
        }
    },
};

// Helper function to format relative time
function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

export default dashboardService;
