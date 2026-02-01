import api from './api/client';
import { Config } from '@/src/core/constants/Config';
import {
    MOCK_ACTIVE_PLANS,
    MOCK_ASSIGNMENT_CLIENTS,
    MOCK_DIET_CATEGORIES,
    MOCK_DIET_PLANS,
    MOCK_DIET_PROGRAMS,
    MOCK_DRAFT_PLANS
} from '../../features/meals/data/mockData';

// Types
export interface DoctorPlanItem {
    id: string;
    clientId: string;
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

// Temporary flag to force mock usage until backend is ready
const USE_MOCK_DATA = false;

export const plansService = {
    // Queries
    async getActivePlans(): Promise<DoctorPlanItem[]> {
        if (USE_MOCK_DATA) return MOCK_ACTIVE_PLANS;

        try {
            const response = await api.get('/doctors/plans/active');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch active plans');
        } catch (error: any) {
            // Fallback to mock on 404
            if (error.response && error.response.status === 404) {
                console.warn("Backend endpoint not found, falling back to mock data");
                return MOCK_ACTIVE_PLANS;
            }
            throw error;
        }
    },

    async getDraftPlans(): Promise<DraftPlanItem[]> {
        if (USE_MOCK_DATA) return MOCK_DRAFT_PLANS;

        try {
            const response = await api.get('/doctors/plans/drafts');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch draft plans');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_DRAFT_PLANS;
            throw error;
        }
    },

    async getClientsForAssignment(): Promise<AssignmentClient[]> {
        if (USE_MOCK_DATA) return MOCK_ASSIGNMENT_CLIENTS;

        try {
            const response = await api.get('/doctors/plans/clients/assignment');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch clients for assignment');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_ASSIGNMENT_CLIENTS;
            throw error;
        }
    },

    async getDietPrograms(): Promise<DietProgramItem[]> {
        if (USE_MOCK_DATA) return MOCK_DIET_PROGRAMS;

        try {
            const response = await api.get('/doctors/plans/programs');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet programs');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_DIET_PROGRAMS;
            throw error;
        }
    },

    async getDietCategories(): Promise<DietCategoryItem[]> {
        if (USE_MOCK_DATA) return MOCK_DIET_CATEGORIES as unknown as DietCategoryItem[];

        try {
            const response = await api.get('/doctors/plans/categories');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet categories');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_DIET_CATEGORIES as unknown as DietCategoryItem[];
            throw error;
        }
    },

    async getDietsByType(type: string): Promise<any[]> {
        if (USE_MOCK_DATA) return MOCK_DIET_PLANS.filter(p => type === 'all' || p.type === type);

        try {
            const response = await api.get(`/doctors/plans/programs?type=${type}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diets by type');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_DIET_PLANS.filter(p => type === 'all' || p.type === type);
            throw error;
        }
    },

    async getDietPlan(id: string): Promise<any> {
        if (USE_MOCK_DATA) return MOCK_DIET_PLANS.find(p => p.id === id || p._id === id);

        try {
            const response = await api.get(`/doctors/plans/programs/${id}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch diet plan');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return MOCK_DIET_PLANS.find(p => p.id === id || p._id === id);
            throw error;
        }
    },

    async searchDietPlans(query: string): Promise<any[]> {
        if (USE_MOCK_DATA) {
            const lowerQuery = query.toLowerCase();
            return MOCK_DIET_PLANS.filter(p =>
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.nameAr && p.nameAr.toLowerCase().includes(lowerQuery)) ||
                (p.description && p.description.toLowerCase().includes(lowerQuery))
            );
        }

        try {
            const response = await api.get(`/doctors/plans/programs/search?q=${encodeURIComponent(query)}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to search diet plans');
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                const lowerQuery = query.toLowerCase();
                return MOCK_DIET_PLANS.filter(p =>
                    p.name.toLowerCase().includes(lowerQuery) ||
                    (p.nameAr && p.nameAr.toLowerCase().includes(lowerQuery)) ||
                    (p.description && p.description.toLowerCase().includes(lowerQuery))
                );
            }
            throw error;
        }
    },

    // Mutations
    async createDietPlan(args: CreateDietPlanArgs): Promise<{ id: string }> {
        if (USE_MOCK_DATA) return {id: 'mock_plan_' + Date.now()};

        try {
            const response = await api.post('/doctors/plans', args);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to create diet plan');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return {id: 'mock_plan_' + Date.now()};
            throw error;
        }
    },

    async updateDietPlan(args: UpdateDietPlanArgs): Promise<boolean> {
        if (USE_MOCK_DATA) return true;

        try {
            const response = await api.put(`/doctors/plans/${args.id}`, args);
            if (response.data.success) {
                return true;
            }
            throw new Error(response.data.message || 'Failed to update diet plan');
        } catch (error: any) {
            if (error.response && error.response.status === 404) return true;
            throw error;
        }
    },

    async deleteDietPlan(id: string): Promise<boolean> {
        if (USE_MOCK_DATA) return true;

        const response = await api.delete(`/doctors/plans/${id}`);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to delete diet plan');
    },

    async createWeeklyPlan(args: CreateWeeklyPlanArgs): Promise<{ id: string }> {
        if (USE_MOCK_DATA) return {id: 'mock_weekly_' + Date.now()};

        const response = await api.post('/doctors/plans/weekly', args);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create weekly plan');
    },

    async updateWeeklyPlan(args: UpdateWeeklyPlanArgs): Promise<boolean> {
        if (USE_MOCK_DATA) return true;

        const response = await api.put(`/doctors/plans/weekly/${args.id}`, args);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to update weekly plan');
    },

    async createDietCategory(args: CreateDietCategoryArgs): Promise<{ id: string }> {
        if (USE_MOCK_DATA) return {id: 'mock_cat_' + Date.now()};

        const response = await api.post('/doctors/plans/categories', args);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create category');
    },

    async deleteDietCategory(id: string): Promise<boolean> {
        if (USE_MOCK_DATA) return true;

        const response = await api.delete(`/doctors/plans/categories/${id}`);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to delete category');
    },

    async updateDietCategory(id: string, args: Partial<CreateDietCategoryArgs>): Promise<boolean> {
        if (USE_MOCK_DATA) return true;

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
    }
};

export default plansService;
