import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/src/shared/services/dashboard.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface User {
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
}

export interface DashboardStats {
    activeClients: number;
    unreviewedWeightLogs: number;
    plansExpiring: number;
    activeClientsTrend: number;
    activeClientsTrendUp: boolean;
    unreadMessages: number;
    todayAppointments: number;
}

export interface InboxStats {
    totalUnread: number;
    oldestUnread?: {
        preview: string;
        relativeTime: string;
    };
    isLoading: boolean;
    loading?: boolean;
}

// Hooks

export const useCurrentUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            setIsLoading(true);
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const parsed = JSON.parse(userStr);
                setUser({
                    firstName: parsed.firstName || 'Doctor',
                    lastName: parsed.lastName,
                    avatarUrl: parsed.avatarUrl,
                });
            } else {
                setUser({ firstName: 'Doctor' });
            }
        } catch (err) {
            console.error('[useCurrentUser] Error reading user from storage:', err);
            setUser({ firstName: 'Doctor' });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return { user, isLoading, refetch: fetchUser };
};

export const useDashboardStats = () => {
    const [data, setData] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const stats = await dashboardService.getStats();
            setData(stats);
            setError(null);
        } catch (err) {
            console.error('[useDashboardStats] Error:', err);
            setError(err as Error);
            // Set default values on error
            setData({
                activeClients: 0,
                unreviewedWeightLogs: 0,
                plansExpiring: 0,
                activeClientsTrend: 0,
                activeClientsTrendUp: true,
                unreadMessages: 0,
                todayAppointments: 0,
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { data, isLoading, error, refetch: fetchStats };
};

export const useCoachInbox = () => {
    const [stats, setStats] = useState<InboxStats>({
        totalUnread: 0,
        oldestUnread: undefined,
        isLoading: true,
        loading: true,
    });

    const fetchInbox = useCallback(async () => {
        try {
            setStats(prev => ({ ...prev, isLoading: true, loading: true }));
            const inboxData = await dashboardService.getInboxStats();
            setStats({
                totalUnread: inboxData.totalUnread,
                oldestUnread: inboxData.oldestUnread,
                isLoading: false,
                loading: false,
            });
        } catch (err) {
            console.error('[useCoachInbox] Error:', err);
            setStats({
                totalUnread: 0,
                oldestUnread: undefined,
                isLoading: false,
                loading: false,
            });
        }
    }, []);

    useEffect(() => {
        fetchInbox();
    }, [fetchInbox]);

    return { ...stats, refetch: fetchInbox };
};

export const useClientsNeedingAttention = (limit: number) => {
    const [clients, setClients] = useState<{
        id: string;
        name: string;
        avatar: string | null;
        status: string;
        statusType: 'critical' | 'warning' | 'info';
        attentionType: 'late_message' | 'weight_gain' | 'missing_checkin';
        lastActive?: string;
        feeling?: string;
        weightChange?: number;
        lastMessageTime?: number;
        daysSinceCheckin?: number | null;
    }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchClients = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardService.getClientsNeedingAttention(limit);

            // Map backend response to frontend Client interface
            const mappedClients = data.map(client => {
                // Map severity to statusType
                const statusTypeMap: Record<string, 'critical' | 'warning' | 'info'> = {
                    high: 'critical',
                    medium: 'warning',
                    low: 'info',
                };

                // Map issue to attentionType
                const attentionTypeMap: Record<string, 'late_message' | 'weight_gain' | 'missing_checkin'> = {
                    weight_stalled: 'weight_gain',
                    missed_checkins: 'missing_checkin',
                    low_engagement: 'missing_checkin',
                    plan_expiring: 'late_message',
                };

                // Compute days since last check-in from lastActivity
                let daysSinceCheckin: number | null = null;
                if (client.lastActivity && client.lastActivity !== 'غير معروف') {
                    const lastDate = new Date(client.lastActivity);
                    if (!isNaN(lastDate.getTime())) {
                        daysSinceCheckin = Math.floor(
                            (Date.now() - lastDate.getTime()) / 86400000
                        );
                    }
                }

                return {
                    id: client.id,
                    name: client.name,
                    avatar: client.avatarUrl || null,
                    status: client.issueDescription,
                    statusType: statusTypeMap[client.severity] || 'info',
                    attentionType: attentionTypeMap[client.issue] || 'missing_checkin',
                    lastActive: client.lastActivity,
                    daysSinceCheckin,
                    weightChange: undefined,
                    feeling: undefined,
                    lastMessageTime: client.unreadMessages ? Date.now() : undefined,
                };
            });

            setClients(mappedClients);
        } catch (err) {
            console.error('[useClientsNeedingAttention] Error:', err);
            setError(err as Error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return {
        clients,
        isLoading,
        error,
        isEmpty: clients.length === 0,
        refetch: fetchClients,
    };
};

export const useTodaysAppointments = (limit: number) => {
    const [appointments, setAppointments] = useState<{
        id: string;
        clientId: string;
        clientName: string;
        time: string;
        clientPhone?: string;
        type: 'video' | 'phone';
        avatar: string;
        duration: string;
        status: 'upcoming' | 'starting_soon' | 'in_progress';
    }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchAppointments = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardService.getTodaysAppointments(limit);

            // Map backend response to frontend Appointment interface
            const mappedAppointments = data.map(apt => {
                // Parse time from ISO string
                const date = new Date(apt.time);
                const hours = date.getHours();
                const minutes = date.getMinutes();
                const period = hours >= 12 ? 'PM' : 'AM';
                const displayHour = hours % 12 || 12;
                const timeString = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;

                // Determine status based on time
                const now = new Date();
                const timeDiff = (date.getTime() - now.getTime()) / (1000 * 60); // minutes
                let status: 'upcoming' | 'starting_soon' | 'in_progress' = 'upcoming';
                if (apt.status === 'in_progress') {
                    status = 'in_progress';
                } else if (timeDiff <= 15 && timeDiff > 0) {
                    status = 'starting_soon';
                }

                return {
                    id: apt.id,
                    clientId: apt.clientId,
                    clientName: apt.clientName,
                    time: timeString,
                    clientPhone: apt.clientPhone,
                    type: 'phone' as const, // Default to phone, backend doesn't distinguish video/phone yet
                    avatar: apt.clientAvatar || '',
                    duration: `${apt.duration} min`,
                    status,
                };
            });

            setAppointments(mappedAppointments);
        } catch (err) {
            console.error('[useTodaysAppointments] Error:', err);
            setError(err as Error);
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    return {
        appointments,
        isLoading,
        error,
        isEmpty: appointments.length === 0,
        refetch: fetchAppointments,
    };
};

export const useWeeklyActivity = () => {
    const [data, setData] = useState<{
        stats: { messages: number; plans: number; checkins: number };
        chartData: number[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchWeeklyActivity = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await dashboardService.getWeeklyActivity();

            if (result) {
                // Map backend response to frontend format
                // Chart data: sum of daily activities (weightLogs + mealsCompleted + messages)
                const chartData = result.days.map(day =>
                    Math.min(100, (day.weightLogs + day.mealsCompleted + day.messages) * 10)
                );

                // Stats: map to the expected format
                const stats = {
                    messages: result.totalMessages,
                    plans: result.totalMealsCompleted, // plans = meals completed
                    checkins: result.totalWeightLogs,  // checkins = weight logs
                };

                setData({ stats, chartData });
            } else {
                setData(null);
            }
        } catch (err) {
            console.error('[useWeeklyActivity] Error:', err);
            setError(err as Error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWeeklyActivity();
    }, [fetchWeeklyActivity]);

    return {
        stats: data?.stats || { messages: 0, plans: 0, checkins: 0 },
        chartData: data?.chartData || [0, 0, 0, 0, 0, 0, 0],
        isLoading,
        isEmpty: !data || (data.stats.messages === 0 && data.stats.plans === 0 && data.stats.checkins === 0),
        error,
        refetch: fetchWeeklyActivity,
    };
};

export const useRecentActivity = (limit: number) => {
    const [activities, setActivities] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchActivities = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await dashboardService.getRecentActivity(limit);

            // Map backend response to frontend Activity interface
            const mappedActivities = data.map(activity => {
                // Map backend types to frontend ActivityType
                let type = 'checkin';
                if (activity.type === 'weight_logged') type = 'weight_log';
                else if (activity.type === 'message_sent' || activity.type === 'message') type = 'message';
                else if (activity.type === 'meal_completed') type = 'meal_completed';
                else if (activity.type === 'plan_assigned') type = 'plan_published';
                else if (activity.type === 'client_assigned') type = 'new_client';
                else if (activity.type === 'reminder_sent') type = 'checkin';

                // Format time
                const now = new Date();
                const date = new Date(activity.timestamp);
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                let timeStr = 'Just now';
                if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins}m ago`;
                else if (diffHours > 0 && diffHours < 24) timeStr = `${diffHours}h ago`;
                else if (diffDays > 0) timeStr = `${diffDays}d ago`;

                return {
                    id: activity.id,
                    text: activity.description,
                    time: timeStr,
                    type,
                    clientId: activity.clientId,
                    clientName: activity.clientName,
                    clientAvatar: activity.clientAvatar || `https://i.pravatar.cc/150?u=${activity.clientId}`,
                };
            });

            setActivities(mappedActivities);
        } catch (err) {
            console.error('[useRecentActivity] Error:', err);
            setError(err as Error);
            setActivities([]);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return {
        activities,
        isLoading,
        isEmpty: activities.length === 0,
        error,
        refetch: fetchActivities,
    };
};

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let mounted = true;
        const { SocketService } = require('@/src/shared/services/socket/socket.service');

        const init = async () => {
            try {
                await SocketService.connect();
                if (mounted) setIsConnected(true);
            } catch (e) {
                console.warn('[useSocket] Connection failed:', e);
            }
        };

        init();

        return () => {
            mounted = false;
            SocketService.disconnect();
        };
    }, []);

    return { isConnected };
};

