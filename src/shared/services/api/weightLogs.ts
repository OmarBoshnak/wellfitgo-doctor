import api from './client';

// Types
export interface WeightLogEntry {
    id: string;
    weight: number;
    unit: 'kg' | 'lbs';
    date: string;
    feeling?: string;
    created_at: string;
}

export interface WeightLogsResponse {
    success: boolean;
    data: {
        logs: WeightLogEntry[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            hasMore: boolean;
        };
    };
}

export interface WeightLogsParams {
    clientId: string;
    page?: number;
    limit?: number;
}

/**
 * Fetch weight logs for a specific client
 */
export const getWeightLogs = async ({
    clientId,
    page = 1,
    limit = 20,
}: WeightLogsParams): Promise<WeightLogsResponse> => {
    const response = await api.get(`/doctors/clients/${clientId}/weight-logs`, {
        params: {
            page: page.toString(),
            limit: limit.toString(),
        },
    });
    
    return response.data;
};
