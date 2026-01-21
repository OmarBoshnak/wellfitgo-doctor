/**
 * Diet Details Hook - Mock Data
 *
 * Fetches a full diet plan by ID from Mock Data
 */

import { useState, useEffect } from "react";
import { DietPlan } from "./useDietsByType";
import { MOCK_DIET_PLANS } from "../data/mockData";

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
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Find in mock data
                // Cast to any because MOCK_DIET_PLANS might have slightly different type definition in mock file vs here
                // but checking structure it seems compatible.
                const foundPlan = (MOCK_DIET_PLANS as DietPlan[]).find(p => p.id === id || p._id === id);

                setPlan(foundPlan);
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
