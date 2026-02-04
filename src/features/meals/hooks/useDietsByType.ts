/**
 * Diets By Type Hook - Backend Data
 * 
 * Fetches diet plans filtered by type
 */

import { useState, useEffect, useCallback } from 'react';
import { plansService } from '@/src/shared/services';
import { MealData } from './usePlanMutations';

// ============ TYPES ============
export type DietType =
    | 'keto'
    | 'fasting'
    | 'mediterranean'
    | 'vegan'
    | 'low_carb'
    | 'custom'
    | 'all';

export type DietFilter = DietType | string; // string allows for MongoDB ObjectId category IDs

export interface DietPlan {
    id: string;
    _id: string;
    name: string;
    nameAr?: string;
    description?: string;
    type: DietType | string; // Allow string for custom types
    emoji?: string;
    targetCalories?: number;
    tags?: string[];
    meals?: MealData[];
    dailyMeals?: Record<string, { meals: MealData[] }>;
    format?: 'general' | 'daily';
    isActive?: boolean;
    usageCount?: number;
    mealsCount?: number;
    createdAt?: number;
}

export interface UseDietsByTypeResult {
    diets: DietPlan[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ MAIN HOOK ============
export function useDietsByType(filter: DietFilter): UseDietsByTypeResult {
    const [diets, setDiets] = useState<DietPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDiets = useCallback(async () => {
        try {
            setIsLoading(true);
            console.log('[useDietsByType] Fetching diets for filter:', filter);

            // Check if this looks like a MongoDB ObjectId (24 hex characters)
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(filter);
            console.log('[useDietsByType] Is ObjectId:', isObjectId);

            let fetchedDiets;
            if (isObjectId) {
                // Use categoryId for MongoDB ObjectIds
                console.log('[useDietsByType] Calling getDietsByCategory with filter:', filter);
                fetchedDiets = await plansService.getDietsByCategory(filter);
                console.log('[useDietsByType] Fetched diets by category:', fetchedDiets?.length || 0);
                console.log('[useDietsByType] Fetched diets data:', JSON.stringify(fetchedDiets, null, 2));
            } else {
                // Use type for predefined diet types
                console.log('[useDietsByType] Calling getDietsByType with filter:', filter);
                fetchedDiets = await plansService.getDietsByType(filter as DietType);
                console.log('[useDietsByType] Fetched diets by type:', fetchedDiets?.length || 0);
                console.log('[useDietsByType] Fetched diets data:', JSON.stringify(fetchedDiets, null, 2));
            }

            setDiets(fetchedDiets as DietPlan[]);
        } catch (error) {
            console.error('Error fetching diets by filter:', error);
            setDiets([]);
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchDiets();
    }, [fetchDiets]);

    return {
        diets,
        isLoading,
        isEmpty: diets.length === 0,
        refetch: fetchDiets,
    };
}
