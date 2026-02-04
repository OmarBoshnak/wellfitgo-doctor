import { useState, useCallback, useEffect } from 'react';
import { getWeightLogs, WeightLogEntry, WeightLogsResponse } from '@/src/shared/services/api/weightLogs';

interface UseWeightLogsState {
    logs: WeightLogEntry[];
    isLoading: boolean;
    hasMore: boolean;
    totalCount: number;
    error?: string;
}

interface UseWeightLogsReturn extends UseWeightLogsState {
    loadMore: () => void;
    refresh: () => void;
}

export const useWeightLogs = (clientId: string): UseWeightLogsReturn => {
    const [state, setState] = useState<UseWeightLogsState>({
        logs: [],
        isLoading: false,
        hasMore: true,
        totalCount: 0,
        error: undefined,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchWeightLogs = useCallback(async (
        page: number = 1,
        isRefresh: boolean = false
    ) => {
        if (!clientId) return;

        try {
            // Set loading state
            setState(prev => ({
                ...prev,
                isLoading: !isRefresh || page === 1,
                error: undefined,
            }));

            const response: WeightLogsResponse = await getWeightLogs({
                clientId,
                page,
                limit: 20,
            });

            const { logs, pagination } = response.data;

            setState(prev => ({
                logs: isRefresh || page === 1 ? logs : [...prev.logs, ...logs],
                isLoading: false,
                hasMore: pagination.hasMore,
                totalCount: pagination.total,
                error: undefined,
            }));

            if (!isRefresh) {
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('Error fetching weight logs:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to fetch weight logs',
            }));
        } finally {
            setIsRefreshing(false);
        }
    }, [clientId]);

    const loadMore = useCallback(() => {
        if (!state.isLoading && state.hasMore && clientId) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            fetchWeightLogs(nextPage, false);
        }
    }, [state.isLoading, state.hasMore, currentPage, clientId, fetchWeightLogs]);

    const refresh = useCallback(() => {
        if (!isRefreshing && clientId) {
            setIsRefreshing(true);
            setCurrentPage(1);
            fetchWeightLogs(1, true);
        }
    }, [isRefreshing, clientId, fetchWeightLogs]);

    // Initial fetch
    useEffect(() => {
        if (clientId) {
            fetchWeightLogs(1, true);
        }
    }, [clientId, fetchWeightLogs]);

    return {
        ...state,
        loadMore,
        refresh,
    };
};
