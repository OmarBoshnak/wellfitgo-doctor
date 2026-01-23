/**
 * Search Service
 * Handles global search functionality using existing backend endpoints
 */
import api from './api/client';

export interface SearchClient {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    status: string;
}

export interface SearchClientsResponse {
    success: boolean;
    data: {
        clients: SearchClient[];
        pagination: {
            page: number;
            totalPages: number;
            total: number;
        };
    };
}

class SearchService {
    /**
     * Search clients by name or email
     */
    async searchClients(query: string, limit: number = 10): Promise<SearchClient[]> {
        if (!query.trim()) return [];

        const response = await api.get<SearchClientsResponse>(
            `/doctors/clients?search=${encodeURIComponent(query)}&limit=${limit}`
        );
        return response.data.data.clients;
    }
}

export const searchService = new SearchService();
