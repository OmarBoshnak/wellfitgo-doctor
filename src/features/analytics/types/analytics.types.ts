/**
 * Analytics Types
 * @description Type definitions for analytics components and data
 */

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
    error?: string;
}

export interface ProgressData {
    onTrack: { percentage: number; count: number; color: string };
    needsSupport: { percentage: number; count: number; color: string };
    atRisk: { percentage: number; count: number; color: string };
    total: number;
}

export interface ActivityTotals {
    messages: number;
    plans: number;
    checkIns: number;
}

export interface StatusDisplay {
    emoji: string;
    style: any;
}

export interface StatCardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: {
        value: string;
        isUp: boolean;
    };
    loading?: boolean;
}

export interface ChartLegendProps {
    items: Array<{
        label: string;
        color: string;
        value?: string;
    }>;
}

export interface StatusBadgeProps {
    status: ClientStatus;
    size?: 'small' | 'medium' | 'large';
}
