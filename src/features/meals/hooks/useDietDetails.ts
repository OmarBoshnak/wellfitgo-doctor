/**
 * Diet Details Hook - Backend Data
 *
 * Fetches a full diet plan by ID from Backend
 */

import { useState, useEffect } from "react";
import { DietPlan } from "./useDietsByType";
import { plansService } from "@/src/shared/services";

// ============ HOOK ============

/**
 * Hook for fetching diet plan details by ID
 */
export function useDietDetails(id: string | undefined) {
    const [plan, setPlan] = useState<DietPlan | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!id) {
            setPlan(undefined);
            setIsLoading(false);
            return;
        }

        const fetchPlan = async () => {
            setIsLoading(true);
            try {
                const fetchedPlan = await plansService.getDietPlan(id);
                setPlan(fetchedPlan as DietPlan);
            } catch (error) {
                console.error('Error fetching diet plan:', error);
                setPlan(undefined);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlan();
    }, [id]);

    return {
        plan,
        isLoading,
        error: null,
    };
}
