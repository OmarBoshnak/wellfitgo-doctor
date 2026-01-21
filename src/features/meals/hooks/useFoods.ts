import { useState, useCallback, useEffect } from 'react';

// Actually I will just use Math.random for now to be safe as I don't know if helper exists.
const generateIdSafe = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export interface Food {
    _id: string;
    nameAr: string;
    nameEn: string;
    calories: number;
    category: string;
}

const MOCK_FOODS: Food[] = [
    { _id: '1', nameAr: 'تفاحة', nameEn: 'Apple', calories: 95, category: 'fruits' },
    { _id: '2', nameAr: 'موزة', nameEn: 'Banana', calories: 105, category: 'fruits' },
    { _id: '3', nameAr: 'صدر دجاج', nameEn: 'Chicken Breast', calories: 165, category: 'protein' },
    { _id: '4', nameAr: 'أرز أبيض', nameEn: 'White Rice', calories: 130, category: 'carbs' },
    { _id: '5', nameAr: 'حليب', nameEn: 'Milk', calories: 150, category: 'dairy' },
];

export const useFoods = (categoryFilter?: string, searchQuery?: string, limit: number = 20) => {
    const [foods, setFoods] = useState<Food[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const fetchFoods = useCallback(async () => {
        setIsLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        let filtered = [...MOCK_FOODS];

        if (categoryFilter) {
            filtered = filtered.filter(f => f.category === categoryFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(f =>
                f.nameAr.toLowerCase().includes(q) ||
                f.nameEn.toLowerCase().includes(q)
            );
        }

        setFoods(filtered);
        setIsLoading(false);
        setHasMore(false); // Mock data is small
    }, [categoryFilter, searchQuery]);

    useEffect(() => {
        fetchFoods();
    }, [fetchFoods]);

    const fetchMore = async () => {
        // No op for mock
    };

    return {
        foods,
        isLoading,
        isLoadingMore,
        hasMore,
        fetchMore,
    };
};

export const useCommonlyUsedFoods = () => {
    // Return a subset of mock foods
    return MOCK_FOODS.slice(0, 3);
};

export const useCreateCustomFood = () => {
    return async (foodData: Omit<Food, '_id'>) => {
        // Simulate creation
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Created custom food:', foodData);
        return generateIdSafe();
    };
};
