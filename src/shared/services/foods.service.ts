import api from './api/client';

// Types
export type FoodCategory = 'carbs' | 'protein' | 'vegetables' | 'fruits' | 'dairy' | 'fats' | 'snacks';

export interface FoodItem {
    _id: string;
    id: string;
    nameAr: string;
    nameEn: string;
    calories: number;
    category: FoodCategory;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    servingSize?: string;
    servingAmount?: number;
    isCommonlyUsed: boolean;
    isCustom: boolean;
}

export interface CreateFoodArgs {
    nameAr: string;
    nameEn: string;
    calories: number;
    category: FoodCategory;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    servingSize?: string;
    servingAmount?: number;
}

export interface UpdateFoodArgs extends Partial<CreateFoodArgs> {
    id: string;
}

// Temporary flag for mock fallback
const USE_MOCK_DATA = false;

const MOCK_FOODS: FoodItem[] = [
    { _id: '1', id: '1', nameAr: 'تفاحة', nameEn: 'Apple', calories: 95, category: 'fruits', isCommonlyUsed: true, isCustom: false },
    { _id: '2', id: '2', nameAr: 'موزة', nameEn: 'Banana', calories: 105, category: 'fruits', isCommonlyUsed: true, isCustom: false },
    { _id: '3', id: '3', nameAr: 'صدر دجاج', nameEn: 'Chicken Breast', calories: 165, category: 'protein', isCommonlyUsed: true, isCustom: false },
    { _id: '4', id: '4', nameAr: 'أرز أبيض', nameEn: 'White Rice', calories: 130, category: 'carbs', isCommonlyUsed: true, isCustom: false },
    { _id: '5', id: '5', nameAr: 'حليب', nameEn: 'Milk', calories: 150, category: 'dairy', isCommonlyUsed: true, isCustom: false },
];

export const foodsService = {
    /**
     * Get foods with optional filtering
     */
    async getFoods(params?: {
        category?: string;
        search?: string;
        isCommonlyUsed?: boolean;
    }): Promise<FoodItem[]> {
        if (USE_MOCK_DATA) {
            let filtered = [...MOCK_FOODS];
            if (params?.category && params.category !== 'all') {
                filtered = filtered.filter(f => f.category === params.category);
            }
            if (params?.search) {
                const q = params.search.toLowerCase();
                filtered = filtered.filter(f =>
                    f.nameAr.toLowerCase().includes(q) ||
                    f.nameEn.toLowerCase().includes(q)
                );
            }
            return filtered;
        }

        try {
            const queryParams = new URLSearchParams();
            if (params?.category && params.category !== 'all') {
                queryParams.append('category', params.category);
            }
            if (params?.search) {
                queryParams.append('search', params.search);
            }
            if (params?.isCommonlyUsed) {
                queryParams.append('isCommonlyUsed', 'true');
            }

            const response = await api.get(`/doctors/foods?${queryParams.toString()}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch foods');
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.warn('Foods endpoint not found, using mock data');
                return MOCK_FOODS;
            }
            throw error;
        }
    },

    /**
     * Get commonly used foods
     */
    async getCommonlyUsedFoods(): Promise<FoodItem[]> {
        if (USE_MOCK_DATA) {
            return MOCK_FOODS.filter(f => f.isCommonlyUsed).slice(0, 5);
        }

        try {
            const response = await api.get('/doctors/foods/commonly-used');
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch commonly used foods');
        } catch (error: any) {
            if (error.response?.status === 404) {
                return MOCK_FOODS.filter(f => f.isCommonlyUsed).slice(0, 5);
            }
            throw error;
        }
    },

    /**
     * Get foods by category
     */
    async getFoodsByCategory(category: FoodCategory): Promise<FoodItem[]> {
        if (USE_MOCK_DATA) {
            return MOCK_FOODS.filter(f => f.category === category);
        }

        try {
            const response = await api.get(`/doctors/foods/category/${category}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to fetch foods by category');
        } catch (error: any) {
            if (error.response?.status === 404) {
                return MOCK_FOODS.filter(f => f.category === category);
            }
            throw error;
        }
    },

    /**
     * Search foods
     */
    async searchFoods(query: string): Promise<FoodItem[]> {
        if (USE_MOCK_DATA) {
            const q = query.toLowerCase();
            return MOCK_FOODS.filter(f =>
                f.nameAr.toLowerCase().includes(q) ||
                f.nameEn.toLowerCase().includes(q)
            );
        }

        try {
            const response = await api.get(`/doctors/foods/search?q=${encodeURIComponent(query)}`);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to search foods');
        } catch (error: any) {
            if (error.response?.status === 404) {
                const q = query.toLowerCase();
                return MOCK_FOODS.filter(f =>
                    f.nameAr.toLowerCase().includes(q) ||
                    f.nameEn.toLowerCase().includes(q)
                );
            }
            throw error;
        }
    },

    /**
     * Create a custom food
     */
    async createFood(args: CreateFoodArgs): Promise<{ id: string }> {
        if (USE_MOCK_DATA) {
            return { id: 'mock_food_' + Date.now() };
        }

        const response = await api.post('/doctors/foods', args);
        if (response.data.success) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create food');
    },

    /**
     * Update a custom food
     */
    async updateFood(id: string, args: Partial<CreateFoodArgs>): Promise<boolean> {
        if (USE_MOCK_DATA) {
            return true;
        }

        const response = await api.put(`/doctors/foods/${id}`, args);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to update food');
    },

    /**
     * Delete a custom food
     */
    async deleteFood(id: string): Promise<boolean> {
        if (USE_MOCK_DATA) {
            return true;
        }

        const response = await api.delete(`/doctors/foods/${id}`);
        if (response.data.success) {
            return true;
        }
        throw new Error(response.data.message || 'Failed to delete food');
    },
};

export default foodsService;
