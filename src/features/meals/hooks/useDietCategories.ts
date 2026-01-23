/**
 * Diet Categories Hook - Backend Data with Real-time Updates
 * 
 * Fetches diet categories and subscribes to WebSocket events for real-time updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { plansService } from '@/src/shared/services';
import { SocketService } from '@/src/shared/services/socket/socket.service';

// ============ TYPES ============
export interface DietCategory {
    _id: string;
    id: string;
    name: string;
    nameAr?: string;
    emoji?: string;
    description?: string;
    descriptionAr?: string;
    autoGenerateRanges?: boolean;
    isActive?: boolean;
    sortOrder?: number;
    dietCount?: number;
    createdAt?: number;
    createdBy?: string;
    type?: 'system' | 'custom'; // For UI distinction
}

export interface UseDietCategoriesResult {
    categories: DietCategory[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ MAIN HOOK ============
export function useDietCategories(): UseDietCategoriesResult {
    const [categories, setCategories] = useState<DietCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | undefined>(undefined);
    const isSubscribed = useRef(false);

    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(undefined);
            const fetchedCategories = await plansService.getDietCategories();
            setCategories(fetchedCategories as unknown as DietCategory[]);
        } catch (err) {
            console.warn('Error fetching diet categories:', err);
            setError(err as Error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ============ WEBSOCKET HANDLERS ============
    const handleCategoryCreated = useCallback((data: { category: DietCategory; timestamp: string }) => {
        console.log('[useDietCategories] Category created event received:', data);
        setCategories(prev => {
            // Avoid duplicates
            if (prev.some(c => c._id === data.category._id)) {
                return prev;
            }
            return [
                {
                    ...data.category,
                    id: data.category._id,
                    dietCount: 0,
                },
                ...prev
            ];
        });
    }, []);

    const handleCategoryUpdated = useCallback((data: { category: DietCategory; timestamp: string }) => {
        console.log('[useDietCategories] Category updated event received:', data);
        setCategories(prev =>
            prev.map(c =>
                c._id === data.category._id
                    ? { ...c, ...data.category, id: data.category._id }
                    : c
            )
        );
    }, []);

    const handleCategoryDeleted = useCallback((data: { categoryId: string; timestamp: string }) => {
        console.log('[useDietCategories] Category deleted event received:', data);
        setCategories(prev => prev.filter(c => c._id !== data.categoryId));
    }, []);

    // ============ EFFECTS ============

    // Initial fetch
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // WebSocket subscriptions
    useEffect(() => {
        if (isSubscribed.current) return;

        // Subscribe to diet category events
        SocketService.on('diet_category_created', handleCategoryCreated);
        SocketService.on('diet_category_updated', handleCategoryUpdated);
        SocketService.on('diet_category_deleted', handleCategoryDeleted);

        isSubscribed.current = true;
        console.log('[useDietCategories] WebSocket subscriptions registered');

        // Cleanup on unmount
        return () => {
            SocketService.off('diet_category_created');
            SocketService.off('diet_category_updated');
            SocketService.off('diet_category_deleted');
            isSubscribed.current = false;
            console.log('[useDietCategories] WebSocket subscriptions cleaned up');
        };
    }, [handleCategoryCreated, handleCategoryUpdated, handleCategoryDeleted]);

    return {
        categories,
        isLoading,
        error,
        isEmpty: categories.length === 0,
        refetch: fetchCategories,
    };
}
