import { useState, useEffect } from 'react';

// Mock Data Types
export interface User {
    firstName: string;
    avatarUrl?: string;
}

export interface DashboardStats {
    activeClients: number;
    unreviewedWeightLogs: number;
    plansExpiring: number;
    activeClientsTrend: number;
    activeClientsTrendUp: boolean;
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
    return {
        user: {
            firstName: 'Omar',
            avatarUrl: undefined,
        } as User,
    };
};

export const useDashboardStats = () => {
    return {
        data: {
            activeClients: 12,
            unreviewedWeightLogs: 3,
            plansExpiring: 2,
            activeClientsTrend: 5,
            activeClientsTrendUp: true,
        } as DashboardStats,
    };
};

export const useCoachInbox = () => {
    return {
        totalUnread: 4,
        oldestUnread: {
            preview: 'Hey doc, about my diet...',
            relativeTime: '2h ago',
        },
        isLoading: false,
        loading: false,
    } as InboxStats;
};

export const useClientsNeedingAttention = (limit: number) => {
    return {
        clients: [
            {
                id: '1',
                name: 'Aliaa',
                issue: 'Missed workout',
                avatar: null,
                status: 'Missed 3 Workouts',
                statusType: 'critical' as const,
                attentionType: 'missing_checkin' as const,
                lastActive: '2h ago'
            },
            {
                id: '2',
                name: 'Hassan',
                issue: 'Weight plateau',
                avatar: null,
                status: 'Weight Stalled',
                statusType: 'warning' as const,
                attentionType: 'weight_gain' as const,
                lastActive: '5h ago'
            },
        ],
        isLoading: false,
        isEmpty: false,
        refetch: () => console.log('Refetching attention clients...'),
    };
};

export const useTodaysAppointments = (limit: number) => {
    return {
        appointments: [
            {
                id: '1',
                clientId: '3',
                clientName: 'Sarah',
                time: '10:00 AM',
                clientPhone: '1234567890',
                type: 'video' as const,
                avatar: 'https://i.pravatar.cc/150?u=3',
                duration: '30 min',
                status: 'upcoming' as const
            },
            {
                id: '2',
                clientId: '4',
                clientName: 'Mike',
                time: '2:00 PM',
                clientPhone: '0987654321',
                type: 'phone' as const,
                avatar: 'https://i.pravatar.cc/150?u=4',
                duration: '15 min',
                status: 'starting_soon' as const
            },
        ],
        isLoading: false,
        isEmpty: false,
        refetch: () => console.log('Refetching appointments...'),
    };
};

export const useWeeklyActivity = () => {
    return {
        stats: {
            messages: 24,
            plans: 5,
            checkins: 12
        },
        chartData: [5, 10, 7, 12, 8, 15, 10],
        isLoading: false,
        isEmpty: false,
    };
};

export const useRecentActivity = (limit: number) => {
    return {
        activities: [
            {
                id: '1',
                type: 'message' as const,
                text: 'New message from Aliaa',
                content: 'New message from Aliaa',
                time: '1h ago',
                clientId: '1',
                clientName: 'Aliaa',
                clientAvatar: 'https://i.pravatar.cc/150?u=1'
            },
            {
                id: '2',
                type: 'weight_log' as const,
                text: 'Hassan logged 85kg',
                content: 'Hassan logged 85kg',
                time: '3h ago',
                clientId: '2',
                clientName: 'Hassan',
                clientAvatar: 'https://i.pravatar.cc/150?u=2'
            },
        ],
        isLoading: false,
        isEmpty: false,
    };
};

export const useSocket = () => {
    return {
        isConnected: true,
    };
};

