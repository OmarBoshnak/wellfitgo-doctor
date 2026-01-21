/**
 * Doctor Analytics Hook - Node.js Backend
 *
 * Provides analytics data for doctors dashboard
 */

import { useState, useEffect, useMemo } from 'react';

// ============ TYPES ============

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export type ClientStatus = 'on_track' | 'needs_attention' | 'at_risk';

export interface OverviewStats {
    totalClients: number;
    activeClients: number;
    checkInsThisWeek: number;
    averageProgress: number;
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
}

export interface ClientCheckIn {
    clientId: string;
    clientName: string;
    clientAvatar: string | null;
    lastCheckIn: number;
    status: ClientStatus;
    progressPercent: number;
    weightChange: number;
}

export interface DoctorAnalyticsData {
    overview: OverviewStats;
    progressBuckets: ProgressBuckets;
    dailyActivity: DailyActivity[];
    recentCheckIns: ClientCheckIn[];
}

export interface UseDoctorAnalyticsResult {
    data: DoctorAnalyticsData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// ============ HELPER FUNCTIONS ============

export function formatLastCheckIn(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
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

export function useDoctorAnalytics(timeRange: TimeRange = '30d'): UseDoctorAnalyticsResult {
    const [data, setData] = useState<DoctorAnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        try {
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    return {
        data,
        isLoading,
        error,
        refetch: fetchAnalytics,
    };
}
