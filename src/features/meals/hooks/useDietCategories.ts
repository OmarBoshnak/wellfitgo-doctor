/**
 * Diet Categories Hook - Mock Data
 * 
 * Fetches diet categories for categorizing diet plans
 */

import { useState, useEffect, useCallback } from 'react';
import { MOCK_DIET_CATEGORIES } from '../data/mockData';

// ============ TYPES ============
export interface DietCategory {
    _id: string;
    id: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: 'system' | 'custom';
    isActive?: boolean;
    dietCount?: number;
    createdAt?: number;
}

export interface UseDietCategoriesResult {
    categories: DietCategory[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ MAIN HOOK ============
export function useDietCategories(): UseDietCategoriesResult {
    const [categories, setCategories] = useState<DietCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 600));

            // Return mock categories
            setCategories(MOCK_DIET_CATEGORIES);
        } catch (error) {
            console.warn('Error fetching diet categories (using defaults):', error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Mock real-time updates not implemented for now

    return {
        categories,
        isLoading,
        isEmpty: categories.length === 0,
        refetch: fetchCategories,
    };
}
