/**
 * Diets By Type Hook - Mock Data
 * 
 * Fetches diet plans filtered by type
 */

import { useState, useEffect, useCallback } from 'react';
import { MOCK_DIET_PLANS } from '../data/mockData';
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
export function useDietsByType(type: DietType): UseDietsByTypeResult {
    const [diets, setDiets] = useState<DietPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDiets = useCallback(async () => {
        try {
            setIsLoading(true);

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 700));

            const allPlans = MOCK_DIET_PLANS as DietPlan[];

            // Filter logic
            let filteredDiets = allPlans;
            if (type !== 'all') {
                if (type.startsWith('custom_')) {
                    // For custom types, usually filtered by category association or exact type match in real backend
                    // Here we just mock filtering by type property
                    filteredDiets = allPlans;
                } else {
                    filteredDiets = allPlans.filter((d) => d.type === type);
                }
            }

            setDiets(filteredDiets);
        } catch (error) {
            console.error('Error fetching diets by type:', error);
        } finally {
            setIsLoading(false);
        }
    }, [type]);

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
