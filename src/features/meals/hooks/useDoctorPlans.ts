/**
 * Doctor Plans Dashboard Hook
 *
 * Fetches doctor's assigned meal plans from Backend.
 */

import { useEffect, useState, useCallback } from "react";
import { plansService } from "@/src/shared/services";

// Lightweight Id replacement until Convex types are removed
export type Id<TableName extends string = string> = string & { __table?: TableName };

// ============ TYPE DEFINITIONS ============

/**
 * Active plan item as displayed in the UI
 */
export interface DoctorPlanItem {
    id: Id<"weeklyMealPlans">;
    clientId: Id<"users">;
    clientName: string;
    avatar: string | null;
    clientGoal: "weight_loss" | "maintain" | "gain_muscle";
    dietProgram: string;
    daysLeft: number;
    weekNumber: number;
    startDate: string;
    mealsCompleted: number;
    totalMeals: number;
    weightChange: number;
    status: "good" | "warning" | "paused";
    statusMessage: string | null;
    missedMeals: number;
    weekStartDate: string;
    weekEndDate: string;
    planStatus: string;
}

/**
 * Draft plan item as displayed in the UI
 */
export interface DraftPlanItem {
    id: Id<"weeklyMealPlans">;
    title: string;
    basedOn: string;
    lastEditedHours: number;
    progressPercent: number;
    clientId: Id<"users">;
}

/**
 * Client item for assignment modal
 */
export interface AssignmentClient {
    id: Id<"users">;
    name: string;
    avatar: string | null;
    goal: "weight_loss" | "maintain" | "gain_muscle";
    hasActivePlan: boolean;
    currentPlanName: string | null;
}

/**
 * Diet program for recommendations
 */
export interface DietProgramItem {
    id: Id<"dietPlans">;
    name: string;
    nameAr?: string;
    emoji?: string;
    type: string;
    targetGoal?: "weight_loss" | "maintain" | "gain_muscle";
    targetCalories?: number;
    description?: string;
    tags: string[];
}

// ============ HOOKS ============

/**
 * Hook for fetching doctor plans data
 * Returns all queries needed for the plans dashboard
 */
export function useDoctorPlans() {
    const [activePlans, setActivePlans] = useState<DoctorPlanItem[]>([]);
    const [draftPlans, setDraftPlans] = useState<DraftPlanItem[]>([]);
    const [clientsForAssignment, setClientsForAssignment] = useState<AssignmentClient[]>([]);
    const [dietPrograms, setDietPrograms] = useState<DietProgramItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasError, setHasError] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        console.log('[useDoctorPlans] Starting load (Backend), isRefresh:', isRefresh);

        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setHasError(false);

        try {
            const [
                fetchedActivePlans,
                fetchedDraftPlans,
                fetchedClients,
                fetchedDietPrograms
            ] = await Promise.all([
                plansService.getActivePlans(),
                plansService.getDraftPlans(),
                plansService.getClientsForAssignment(),
                plansService.getDietPrograms()
            ]);

            setActivePlans(fetchedActivePlans as unknown as DoctorPlanItem[]);
            setDraftPlans(fetchedDraftPlans as unknown as DraftPlanItem[]);
            setClientsForAssignment(fetchedClients as unknown as AssignmentClient[]);
            setDietPrograms(fetchedDietPrograms as unknown as DietProgramItem[]);

        } catch (error) {
            console.error("[useDoctorPlans] Error:", error);
            setHasError(true);
        } finally {
            console.log('[useDoctorPlans] Load complete');
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    const refetch = useCallback(() => {
        load(true);
    }, [load]);

    return {
        activePlans,
        draftPlans,
        clientsForAssignment,
        dietPrograms,
        isLoading,
        isRefreshing,
        hasError,
        activePlansCount: activePlans.length,
        draftPlansCount: draftPlans.length,
        refetch,
    };
}

/**
 * Helper: Check if a diet plan is recommended for a client's goal
 */
export function isDietPlanRecommended(
    plan: DietProgramItem,
    clientGoal: "weight_loss" | "maintain" | "gain_muscle"
): boolean {
    if (plan.targetGoal === clientGoal) {
        return true;
    }

    if (clientGoal === "weight_loss") {
        return plan.type === "keto" || plan.type === "low_carb" || plan.type === "classic";
    }

    if (clientGoal === "gain_muscle") {
        return plan.type === "high_protein" || plan.type === "muscle_gain";
    }

    if (clientGoal === "maintain") {
        return plan.type === "maintenance" || plan.type === "classic";
    }

    return false;
}
