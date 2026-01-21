/**
 * Plan Mutations Hook - Mock Data
 *
 * Provides mutations for creating and updating diet plans and weekly plans (Mocked)
 */

import { useState, useCallback } from "react";

// ============ TYPE DEFINITIONS ============

export type DietPlanType =
    | "keto"
    | "weekly"
    | "classic"
    | "low_carb"
    | "high_protein"
    | "intermittent_fasting"
    | "vegetarian"
    | "maintenance"
    | "muscle_gain"
    | "medical"
    | "custom";

export type WeeklyPlanStatus = "draft" | "published" | "active" | "completed" | "archived";

// Meal structure types (must be defined before interfaces that use them)
export interface MealOption {
    id: string;
    _id?: string;
    text: string;
    textEn?: string;
}

export interface MealCategory {
    id: string;
    _id?: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    options: MealOption[];
}

export interface MealData {
    id: string;
    _id?: string;
    emoji?: string;
    name: string;
    nameAr?: string;
    time?: string;
    note?: string;
    noteAr?: string;
    categories: MealCategory[];
}

// Diet Plan args (now MealData is defined above)
export interface CreateDietPlanArgs {
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: DietPlanType;
    categoryId?: string; // For linking to custom categories
    targetCalories?: number;
    tags?: string[];
    meals?: MealData[];
    dailyMeals?: Record<string, { meals: MealData[] }>;
}

export interface UpdateDietPlanArgs {
    id: string;
    name?: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    descriptionAr?: string;
    targetCalories?: number;
    tags?: string[];
    isActive?: boolean;
    meals?: MealData[];
    dailyMeals?: Record<string, { meals: MealData[] }>;
}

export interface CreateWeeklyPlanArgs {
    clientId: string;
    weekStartDate: string;
    notes?: string;
    totalCalories?: number;
    specialInstructions?: string;
    isTemplate?: boolean;
    templateName?: string;
}

export interface UpdateWeeklyPlanArgs {
    id: string;
    status?: WeeklyPlanStatus;
    notes?: string;
    totalCalories?: number;
    specialInstructions?: string;
}

export interface CreateDietCategoryArgs {
    name: string;
    nameAr?: string;
    emoji: string;
    description?: string;
    autoGenerateRanges?: boolean;
}

// ============ HOOK ============

export function usePlanMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Helper to wrap API calls with auth token and loading state
    const mutate = useCallback(async (fn: () => Promise<any>) => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
            const result = await fn();
            return result;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Wrapped mutations with loading/error handling
    const createDietPlan = useCallback(async (args: CreateDietPlanArgs) => {
        return mutate(async () => {
            console.log('[MockMutation] createDietPlan:', args);
            return { id: 'mock_new_plan_' + Date.now() };
        });
    }, [mutate]);

    const updateDietPlan = useCallback(async (args: UpdateDietPlanArgs) => {
        return mutate(async () => {
            console.log('[MockMutation] updateDietPlan:', args);
            return { success: true };
        });
    }, [mutate]);

    const createWeeklyPlan = useCallback(async (args: CreateWeeklyPlanArgs) => {
        return mutate(async () => {
            console.log('[MockMutation] createWeeklyPlan:', args);
            return { id: 'mock_weekly_plan_' + Date.now() };
        });
    }, [mutate]);

    const updateWeeklyPlan = useCallback(async (args: UpdateWeeklyPlanArgs) => {
        return mutate(async () => {
            console.log('[MockMutation] updateWeeklyPlan:', args);
            return { success: true };
        });
    }, [mutate]);

    const deleteDietPlan = useCallback(async (id: string) => {
        return mutate(async () => {
            console.log('[MockMutation] deleteDietPlan:', id);
            return { success: true };
        });
    }, [mutate]);

    // Placeholder draft delete mapped to diet plan delete until dedicated endpoint exists
    const deleteDraft = useCallback(async (id: string) => {
        return deleteDietPlan(id);
    }, [deleteDietPlan]);

    const createDietCategory = useCallback(async (args: CreateDietCategoryArgs) => {
        return mutate(async () => {
            console.log('[MockMutation] createDietCategory:', args);
            return { id: 'mock_cat_' + Date.now() };
        });
    }, [mutate]);

    const deleteDietCategory = useCallback(async (id: string) => {
        return mutate(async () => {
            console.log('[MockMutation] deleteDietCategory:', id);
            return { success: true };
        });
    }, [mutate]);

    return {
        createDietPlan,
        updateDietPlan,
        deleteDietPlan,
        createWeeklyPlan,
        updateWeeklyPlan,
        createDietCategory,
        deleteDietCategory,
        deleteDraft,
        isLoading,
        error,
    };
}
