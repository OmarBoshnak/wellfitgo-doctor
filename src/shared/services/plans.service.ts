import api from './api/client';
import { Config } from '@/src/core/constants/Config';


// Types
export interface DoctorPlanItem {
    id: string;
    clientId: string;
    clientName: string;
    avatar: string | null;
    clientGoal: "weight_loss" | "maintain" | "gain_muscle";
    dietProgram: string;
    dietProgramId?: string;
    daysLeft: number;
    weekNumber: number;
    totalWeeks?: number;
    startDate: string;
    endDate?: string;
    mealsCompleted: number;
    totalMeals: number;
    weightChange: number;
    targetWeightChange?: number;
    status: "good" | "warning" | "paused";
    statusMessage: string | null;
    missedMeals: number;
    weekStartDate: string;
    weekEndDate: string;
    planStatus: string;
    completionRate?: number;
    lastActivity?: string;
    streakDays?: number;
}

export interface DraftPlanItem {
    id: string;
    title: string;
    basedOn: string;
    lastEditedHours: number;
    progressPercent: number;
    clientId: string;
}

export interface AssignmentClient {
    id: string;
    name: string;
    avatar: string | null;
    goal: "weight_loss" | "maintain" | "gain_muscle";
    hasActivePlan: boolean;
    currentPlanName: string | null;
}

export interface DietProgramItem {
    id: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    type: string;
    targetGoal?: "weight_loss" | "maintain" | "gain_muscle";
    targetCalories?: number;
    description?: string;
    tags: string[];
}

export interface DietCategoryItem {
    id: string;
    _id?: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: 'system' | 'custom';
    isActive?: boolean;
    dietCount?: number;
    createdAt?: number;
}

export interface CreateDietPlanArgs {
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    type: string;
    categoryId?: string;
    targetCalories?: number;
    tags?: string[];
    meals?: any[];
    dailyMeals?: Record<string, { meals: any[] }>;
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
    meals?: any[];
    dailyMeals?: Record<string, { meals: any[] }>;
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
    status?: string;
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

export interface ClientMealPlan {
    id: string;
    dietPlanId?: string;
    weekStartDate: string;
    weekEndDate: string;
    status: "draft" | "published" | "active" | "completed" | "archived";
    notes?: string;
    mealsCompleted: number;
    mealsTotal: number;
    createdAt: number;
}

// Enhanced Progress Tracking Types
export interface MealLog {
    id: string;
    name: string;
    nameAr: string;
    time: string;
    isCompleted: boolean;
    completedAt?: number;
    imageUrl?: string;
    calories?: number;
    macros?: {
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface DailyMealLog {
    date: string;
    meals: MealLog[];
    completionRate: number;
    totalCalories?: number;
    totalMacros?: {
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface ClientProgressDetails {
    plan: {
        id: string;
        name: string;
        nameAr?: string;
        emoji?: string;
        startDate: string;
        endDate?: string;
        currentWeek: number;
        totalWeeks: number;
        targetCalories?: number;
    };
    weeklyStats: {
        completedMeals: number;
        totalMeals: number;
        completionRate: number;
        streakDays: number;
        averageCalories?: number;
    };
    dailyProgress: DailyMealLog[];
    lastUpdated: string;
}

export interface WeeklyProgressSummary {
    weekStartDate: string;
    weekEndDate: string;
    totalDays: number;
    completedDays: number;
    totalMeals: number;
    completedMeals: number;
    completionRate: number;
    averageDailyCompletion: number;
    streakDays: number;
    bestDay: string;
    worstDay: string;
    nutritionalSummary?: {
        averageCalories: number;
        averageMacros: {
            protein: number;
            carbs: number;
            fat: number;
        };
    };
}

export interface ClientAnalytics {
    timeframe: 'week' | 'month' | 'all';
    overallStats: {
        totalMeals: number;
        completedMeals: number;
        missedMeals: number;
        completionRate: number;
        streakDays: number;
        longestStreak: number;
    };
    weeklyBreakdown: Array<{
        week: string;
        completionRate: number;
        totalMeals: number;
        completedMeals: number;
    }>;
    trends: {
        improving: boolean;
        trendDirection: 'up' | 'down' | 'stable';
        trendPercentage: number;
    };
    nutritionalTrends?: Array<{
        date: string;
        calories: number;
        macros: {
            protein: number;
            carbs: number;
            fat: number;
        };
    }>;
    achievements: Array<{
        id: string;
        type: string;
        description: string;
        achievedAt: string;
    }>;
}

// Mock data logic removed


export const plansService = {
    // Queries
    async getActivePlans(): Promise<DoctorPlanItem[]> {
        try {
            console.log('[plansService] Fetching active plans...');
            const response = await api.get('/doctors/plans/active');
            console.log('[plansService] Active plans response:', response.status);
            if (response.data.success) {
                console.log('[plansService] Active plans loaded:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch active plans');
        } catch (error: any) {
            console.error('[plansService] Error fetching active plans:', error);
            if (error.code === 'NETWORK_ERROR' || !error.response) {
                error.code = 'NETWORK_ERROR';
            }
            return [];
        }
    },

    async getDraftPlans(): Promise<DraftPlanItem[]> {
        try {
            console.log('[plansService] Fetching draft plans...');
            const response = await api.get('/doctors/plans/drafts');
            console.log('[plansService] Draft plans response:', response.status);
            if (response.data.success) {
                console.log('[plansService] Draft plans loaded:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch draft plans');
        } catch (error: any) {
            console.error('[plansService] Error fetching draft plans:', error);
            if (error.code === 'NETWORK_ERROR' || !error.response) {
                error.code = 'NETWORK_ERROR';
            }
            return [];
        }
    },

    async getClientsForAssignment(): Promise<AssignmentClient[]> {
        try {
            const response = await api.get('/doctors/plans/clients/assignment');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch clients for assignment');
        } catch (error: any) {
            console.error('Error fetching clients for assignment:', error);
            return [];
        }
    },

    async assignDietToClients(dietId: string, clientIds: string[], settings: { startDate: string; durationWeeks: number | null; notifyPush: boolean }): Promise<boolean> {
        try {
            const response = await api.post('/doctors/plans/assign', {
                dietId,
                clientIds,
                ...settings
            });
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to assign diet plan');
        } catch (error: any) {
            console.error('Error assigning diet plan:', error);
            throw error;
        }
    },

    async getDietPrograms(): Promise<DietProgramItem[]> {
        try {
            console.log('[plansService] Fetching diet programs...');
            const response = await api.get('/doctors/plans/programs');
            if (response.data.success) {
                console.log('[plansService] Diet programs loaded:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet programs');
        } catch (error: any) {
            console.error('[plansService] Error fetching diet programs:', error);
            if (error.code === 'NETWORK_ERROR' || !error.response) {
                error.code = 'NETWORK_ERROR';
            }
            return [];
        }
    },

    async getDietCategories(): Promise<DietCategoryItem[]> {
        try {
            const response = await api.get('/doctors/plans/categories');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet categories');
        } catch (error: any) {
            console.error('Error fetching diet categories:', error);
            return [];
        }
    },

    async getDietsByType(type: string): Promise<any[]> {
        try {
            // Check if this looks like a MongoDB ObjectId (24 hex characters)
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(type);

            // Use categoryId if it's an ObjectId, otherwise use type
            const url = isObjectId
                ? `/doctors/plans/programs?categoryId=${type}`
                : `/doctors/plans/programs?type=${type}`;

            const response = await api.get(url);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diets by type');
        } catch (error: any) {
            console.error('Error fetching diets by type:', error);
            return [];
        }
    },

    async getDietsByCategory(categoryId: string): Promise<any[]> {
        try {
            console.log('[plansService] Getting diets by category ID:', categoryId);
            const url = `/doctors/plans/programs?categoryId=${categoryId}`;
            console.log('[plansService] Full URL:', url);

            const response = await api.get(url);
            console.log('[plansService] API Response:', response.data);

            if (response.data.success) {
                console.log('[plansService] Diets found:', response.data.data?.length || 0);
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diets by category');
        } catch (error: any) {
            console.error('[plansService] Error fetching diets by category:', error);
            console.error('[plansService] Response status:', error.response?.status);
            console.error('[plansService] Response data:', error.response?.data);
            return [];
        }
    },

    async getDietPlan(id: string): Promise<any> {
        try {
            const response = await api.get(`/doctors/plans/programs/${id}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet plan');
        } catch (error: any) {
            console.error('Error fetching diet plan:', error);
            throw error;
        }
    },

    async searchDietPlans(query: string): Promise<any[]> {
        try {
            const response = await api.get(`/doctors/plans/programs/search?q=${encodeURIComponent(query)}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to search diet plans');
        } catch (error: any) {
            console.error('Error searching diet plans:', error);
            return [];
        }
    },

    // Mutations
    async createDietPlan(args: CreateDietPlanArgs): Promise<{ id: string }> {
        try {
            const response = await api.post('/doctors/plans', args);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create diet plan');
        } catch (error: any) {
            console.error('Error creating diet plan:', error);
            throw error;
        }
    },

    async updateDietPlan(args: UpdateDietPlanArgs): Promise<boolean> {
        try {
            const response = await api.put(`/doctors/plans/${args.id}`, args);
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to update diet plan');
        } catch (error: any) {
            console.error('Error updating diet plan:', error);
            throw error;
        }
    },

    async deleteDietPlan(id: string): Promise<boolean> {
        const response = await api.delete(`/doctors/plans/${id}`);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to delete diet plan');
    },

    async createWeeklyPlan(args: CreateWeeklyPlanArgs): Promise<{ id: string }> {
        const response = await api.post('/doctors/plans/weekly', args);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create weekly plan');
    },

    async updateWeeklyPlan(args: UpdateWeeklyPlanArgs): Promise<boolean> {
        const response = await api.put(`/doctors/plans/weekly/${args.id}`, args);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to update weekly plan');
    },

    async createDietCategory(args: CreateDietCategoryArgs): Promise<{ id: string }> {
        const response = await api.post('/doctors/plans/categories', args);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create category');
    },

    async deleteDietCategory(id: string): Promise<boolean> {
        const response = await api.delete(`/doctors/plans/categories/${id}`);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to delete category');
    },

    async updateDietCategory(id: string, args: Partial<CreateDietCategoryArgs>): Promise<boolean> {
        const response = await api.put(`/doctors/plans/categories/${id}`, args);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to update category');
    },

    // Client Meal Plans
    async getClientMealPlans(clientId: string): Promise<ClientMealPlan[]> {
        try {
            console.log(`[PlansService] Fetching meal plans for client: ${clientId}`);
            console.log(`[PlansService] Full URL: ${Config.API_URL}/doctors/clients/${clientId}/meal-plans`);

            const response = await api.get(`/doctors/clients/${clientId}/meal-plans`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch client meal plans');
        } catch (error: any) {
            console.error('[PlansService] Error fetching client meal plans:', error);
            console.error('[PlansService] Response status:', error.response?.status);
            console.error('[PlansService] Response data:', error.response?.data);
            console.error('[PlansService] Request URL:', error.config?.baseURL + error.config?.url);
            throw error;
        }
    },

    async deleteClientMealPlan(clientId: string, planId: string): Promise<boolean> {
        try {
            const response = await api.delete(`/doctors/clients/${clientId}/meal-plans/${planId}`);
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to delete meal plan');
        } catch (error: any) {
            console.error('[PlansService] Error deleting meal plan:', error);
            throw error;
        }
    },

    // Enhanced Progress Tracking Methods
    async getClientProgressDetails(clientId: string, planId: string): Promise<ClientProgressDetails> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/plans/${planId}/progress`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch client progress details');
        } catch (error: any) {
            console.error('[PlansService] Error fetching client progress details:', error);
            throw error;
        }
    },

    async getDailyMealLogs(clientId: string, date: string): Promise<DailyMealLog[]> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/meal-logs?date=${date}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch daily meal logs');
        } catch (error: any) {
            console.error('[PlansService] Error fetching daily meal logs:', error);
            throw error;
        }
    },

    async getWeeklyProgressSummary(clientId: string, weekStartDate: string): Promise<WeeklyProgressSummary> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/progress/weekly?startDate=${weekStartDate}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch weekly progress summary');
        } catch (error: any) {
            console.error('[PlansService] Error fetching weekly progress summary:', error);
            throw error;
        }
    },

    async getClientAnalytics(clientId: string, planId: string, timeframe: 'week' | 'month' | 'all'): Promise<ClientAnalytics> {
        try {
            const response = await api.get(`/doctors/clients/${clientId}/analytics?planId=${planId}&timeframe=${timeframe}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch client analytics');
        } catch (error: any) {
            console.error('[PlansService] Error fetching client analytics:', error);
            throw error;
        }
    },

    async sendClientReminder(clientId: string, reminderType: 'general' | 'missed_meals' | 'milestone'): Promise<boolean> {
        try {
            const response = await api.post(`/doctors/clients/${clientId}/reminders`, { reminderType });
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to send client reminder');
        } catch (error: any) {
            console.error('[PlansService] Error sending client reminder:', error);
            throw error;
        }
    },

    async updateMealCompletion(clientId: string, planId: string, mealId: string, date: string, isCompleted: boolean): Promise<boolean> {
        try {
            const response = await api.put(`/doctors/clients/${clientId}/plans/${planId}/meals/${mealId}/completion`, {
                date,
                isCompleted,
                completedAt: isCompleted ? Date.now() : null
            });
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to update meal completion');
        } catch (error: any) {
            console.error('[PlansService] Error updating meal completion:', error);
            throw error;
        }
    }
};

export default plansService;
