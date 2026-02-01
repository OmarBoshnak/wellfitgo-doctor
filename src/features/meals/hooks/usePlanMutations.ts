/**
 * Plan Mutations Hook
 *
 * Provides mutations for creating and updating diet plans and weekly plans using plansService.
 */

import { useState, useCallback } from "react";
import { plansService } from "@/src/shared/services";

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
    type?: 'system' | 'custom'; // Add type field
}

// ============ HOOK ============

export function usePlanMutations() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Helper to wrap API calls with loading state
    const mutate = useCallback(async (fn: () => Promise<any>) => {
        setIsLoading(true);
        setError(null);
        try {
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
            // Cast to any to avoid type mismatch with service types if they differ slightly
            return plansService.createDietPlan(args as any);
        });
    }, [mutate]);

    const updateDietPlan = useCallback(async (args: UpdateDietPlanArgs) => {
        return mutate(async () => {
            return plansService.updateDietPlan(args as any);
        });
    }, [mutate]);

    const createWeeklyPlan = useCallback(async (args: CreateWeeklyPlanArgs) => {
        return mutate(async () => {
            return plansService.createWeeklyPlan(args as any);
        });
    }, [mutate]);

    const updateWeeklyPlan = useCallback(async (args: UpdateWeeklyPlanArgs) => {
        return mutate(async () => {
            return plansService.updateWeeklyPlan(args as any);
        });
    }, [mutate]);

    const deleteDietPlan = useCallback(async (id: string) => {
        return mutate(async () => {
            return plansService.deleteDietPlan(id);
        });
    }, [mutate]);

    // Placeholder draft delete mapped to diet plan delete until dedicated endpoint exists
    const deleteDraft = useCallback(async (id: string) => {
        return deleteDietPlan(id);
    }, [deleteDietPlan]);

    const createDietCategory = useCallback(async (args: CreateDietCategoryArgs) => {
        return mutate(async () => {
            return plansService.createDietCategory(args);
        });
    }, [mutate]);

    const deleteDietCategory = useCallback(async (id: string) => {
        return mutate(async () => {
            return plansService.deleteDietCategory(id);
        });
    }, [mutate]);

    const updateDietCategory = useCallback(async (id: string, args: Partial<CreateDietCategoryArgs>) => {
        return mutate(async () => {
            return plansService.updateDietCategory(id, args);
        });
    }, [mutate]);

    return {
        createDietPlan,
        updateDietPlan,
        deleteDietPlan,
        createWeeklyPlan,
        updateWeeklyPlan,
        createDietCategory,
        updateDietCategory,
        deleteDietCategory,
        deleteDraft,
        isLoading,
        error,
    };
}
