/**
 * Recent Activity Hook - Node.js Backend
 * 
 * Fetches recent activity for the doctor dashboard
 */

import { useState, useEffect, useCallback } from 'react';

// ============ TYPES ============
export interface RecentActivityItem {
    id: string;
    type: 'checkin' | 'message' | 'meal' | 'weight' | 'appointment';
    title: string;
    description: string;
    timestamp: number;
    clientId?: string;
    clientName?: string;
    clientAvatar?: string;
}

export interface UseRecentActivityResult {
    activities: RecentActivityItem[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ MAIN HOOK ============
export function useRecentActivity(limit?: number): UseRecentActivityResult {
    const [activities, setActivities] = useState<RecentActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchActivities = useCallback(async () => {
        try {
        } catch (error) {
            console.error('Error fetching recent activity:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    return {
        activities,
        isLoading,
        isEmpty: activities.length === 0,
        refetch: fetchActivities,
    };
}
