/**
 * Weekly Activity Hook - Node.js Backend
 * 
 * Fetches weekly activity statistics for the doctor dashboard
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============ TYPES ============
export interface WeeklyStats {
    messages: number;
    plans: number;
    checkins: number;
}

export interface UseWeeklyActivityResult {
    stats: WeeklyStats;
    chartData: number[];
    isLoading: boolean;
    isEmpty: boolean;
}

const defaultStats: WeeklyStats = {
    messages: 0,
    plans: 0,
    checkins: 0,
};

const defaultChartData = [0, 0, 0, 0, 0, 0, 0];

// ============ MAIN HOOK ============
export function useWeeklyActivity(): UseWeeklyActivityResult {
    const [data, setData] = useState<{ stats: WeeklyStats; chartData: number[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
        } catch (error) {
            console.error('Error fetching weekly activity:', error);
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const result = useMemo(() => {
        if (isLoading || !data) {
            return {
                stats: defaultStats,
                chartData: defaultChartData,
                isLoading,
                isEmpty: false,
            };
        }

        const isEmpty =
            data.stats.messages === 0 &&
            data.stats.plans === 0 &&
            data.stats.checkins === 0;

        return {
            stats: data.stats,
            chartData: data.chartData,
            isLoading: false,
            isEmpty,
        };
    }, [data, isLoading]);

    return result;
}
