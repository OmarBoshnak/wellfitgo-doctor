/**
 * Foods Hook - Backend Data
 * 
 * Provides hooks for fetching and managing food items
 */

import { useState, useCallback, useEffect } from 'react';
import { foodsService, type FoodItem } from '@/src/shared/services/foods.service';

// Re-export Food type for convenience
export type Food = FoodItem;

/**
 * Hook for fetching foods with filtering and pagination
 */
export const useFoods = (categoryFilter?: string, searchQuery?: string, limit: number = 20) => {
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);

    const fetchFoods = useCallback(async () => {
        setIsLoading(true);
        setError(undefined);

        try {
            const result = await foodsService.getFoods({
                category: categoryFilter,
                search: searchQuery,
            });
            setFoods(result);
            setHasMore(result.length >= limit);
        } catch (err) {
            console.error('Error fetching foods:', err);
            setError(err as Error);
            setFoods([]);
        } finally {
            setIsLoading(false);
        }
    }, [categoryFilter, searchQuery, limit]);

    useEffect(() => {
        fetchFoods();
    }, [fetchFoods]);

    const fetchMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            // For now, no real pagination - backend returns all matching
            // In the future, add offset/cursor support
            setHasMore(false);
        } catch (err) {
            console.error('Error fetching more foods:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore]);

    return {
        foods,
        isLoading,
        isLoadingMore,
        hasMore,
        fetchMore,
        error,
        refetch: fetchFoods,
    };
};

/**
 * Hook for fetching commonly used foods
 */
export const useCommonlyUsedFoods = () => {
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCommonlyUsed = async () => {
            try {
                const result = await foodsService.getCommonlyUsedFoods();
                setFoods(result);
            } catch (err) {
                console.error('Error fetching commonly used foods:', err);
                setFoods([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCommonlyUsed();
    }, []);

    return foods;
};

/**
 * Hook for creating custom foods
 */
export const useCreateCustomFood = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);

    const createFood = useCallback(async (foodData: {
        nameAr: string;
        nameEn: string;
        calories: number;
        category: string;
        proteinGrams?: number;
        carbsGrams?: number;
        fatGrams?: number;
    }): Promise<string | null> => {
        setIsCreating(true);
        setError(undefined);

        try {
            const result = await foodsService.createFood(foodData as any);
            return result.id;
        } catch (err) {
            console.error('Error creating custom food:', err);
            setError(err as Error);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, []);

    return createFood;
};

/**
 * Hook for food mutations (update, delete)
 */
export const useFoodMutations = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);

    const updateFood = useCallback(async (id: string, data: Partial<{
        nameAr: string;
        nameEn: string;
        calories: number;
        category: string;
    }>): Promise<boolean> => {
        setIsLoading(true);
        setError(undefined);

        try {
            await foodsService.updateFood(id, data as any);
            return true;
        } catch (err) {
            console.error('Error updating food:', err);
            setError(err as Error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const deleteFood = useCallback(async (id: string): Promise<boolean> => {
        setIsLoading(true);
        setError(undefined);

        try {
            await foodsService.deleteFood(id);
            return true;
        } catch (err) {
            console.error('Error deleting food:', err);
            setError(err as Error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        updateFood,
        deleteFood,
        isLoading,
        error,
    };
};
