/**
 * Doctor Analytics Hook - Node.js Backend
 *
 * Provides analytics data for doctors dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { dashboardService, AnalyticsData } from '@/src/shared/services/dashboard.service';

// ============ TYPES ============

export type TimeRange = '7days' | '30days' | '3months';

export type ClientStatus = 'on_track' | 'needs_support' | 'at_risk';

export interface OverviewStats {
    activeClients: number;
    checkInRate?: number;
    responseTime?: number | null;
    avgProgress?: number | null;
}

export interface ProgressBuckets {
    onTrack: number;
    needsAttention: number;
    atRisk: number;
}

export interface DailyActivity {
    date: string;
    checkIns: number;
    messages: number;
    plans: number;
}

export interface ClientCheckIn {
    id: string;
    name: string;
    lastCheckIn: string | null;
    status: ClientStatus;
}

export interface DoctorAnalyticsData {
    overview: OverviewStats;
    progressBuckets: ProgressBuckets;
    dailyActivity: DailyActivity[];
    clients: ClientCheckIn[];
}

export interface UseDoctorAnalyticsResult {
    data: DoctorAnalyticsData | null;
    isLoading: boolean;
    isEmpty: boolean;
    error: string | null;
    refetch: () => void;
}

// ============ HELPER FUNCTIONS ============

export function formatLastCheckIn(
    lastCheckIn: string | null,
    translations: {
        today: string;
        dayAgo: string;
        daysAgo: string;
        never: string;
    }
): string {
    if (!lastCheckIn) return translations.never;

    const now = new Date();
    const checkInDate = new Date(lastCheckIn);
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return translations.today;
    if (diffDays === 1) return translations.dayAgo;
    return `${diffDays} ${translations.daysAgo}`;
}

export function calculateProgressPercentages(buckets: ProgressBuckets): {
    onTrack: { percentage: number; count: number };
    needsSupport: { percentage: number; count: number };
    atRisk: { percentage: number; count: number };
    total: number;
} {
    const total = buckets.onTrack + buckets.needsAttention + buckets.atRisk;
    if (total === 0) {
        return {
            onTrack: { percentage: 0, count: 0 },
            needsSupport: { percentage: 0, count: 0 },
            atRisk: { percentage: 0, count: 0 },
            total: 0,
        };
    }
    return {
        onTrack: {
            percentage: Math.round((buckets.onTrack / total) * 100),
            count: buckets.onTrack
        },
        needsSupport: {
            percentage: Math.round((buckets.needsAttention / total) * 100),
            count: buckets.needsAttention
        },
        atRisk: {
            percentage: Math.round((buckets.atRisk / total) * 100),
            count: buckets.atRisk
        },
        total,
    };
}

// ============ MAIN HOOK ============

export function useDoctorAnalytics(timeRange: TimeRange = '7days'): UseDoctorAnalyticsResult {
    const [data, setData] = useState<DoctorAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await dashboardService.getAnalytics(timeRange);
            if (result) {
                // Transform backend response to match expected types
                const transformedData: DoctorAnalyticsData = {
                    overview: {
                        activeClients: result.overview.activeClients,
                        checkInRate: result.overview.checkInRate,
                        responseTime: result.overview.responseTime,
                    },
                    progressBuckets: {
                        onTrack: result.progressBuckets.onTrack,
                        needsAttention: result.progressBuckets.needsAttention,
                        atRisk: result.progressBuckets.atRisk,
                    },
                    dailyActivity: result.dailyActivity.map(day => ({
                        date: day.date,
                        checkIns: day.checkIns,
                        messages: day.messages,
                        plans: day.plans,
                    })),
                    clients: result.clients.map(client => ({
                        id: client.id,
                        name: client.name,
                        lastCheckIn: client.lastCheckIn,
                        status: client.status,
                    })),
                };
                setData(transformedData);
            } else {
                setData(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    const isEmpty = useMemo(() => {
        if (!data) return true;
        return data.overview.activeClients === 0;
    }, [data]);

    return {
        data,
        isLoading,
        isEmpty,
        error,
        refetch: fetchAnalytics,
    };
}
