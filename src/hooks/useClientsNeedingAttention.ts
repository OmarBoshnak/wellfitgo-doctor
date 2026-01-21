/**
 * Clients Needing Attention Hook - Node.js Backend
 * 
 * Fetches clients who need attention from the doctor
 */

import { useState, useEffect, useCallback } from 'react';
import { isRTL } from '../i18n';

// ============ TYPES ============
export interface AttentionClient {
    id: string;
    name: string;
    avatar: string | null;
    status: string;
    statusType: "critical" | "warning" | "info";
    lastActive?: string;
    feeling?: string;
    attentionType: "late_message" | "weight_gain" | "missing_checkin";
    weightChange?: number;
    lastMessageTime?: number;
    daysSinceCheckin?: number | null;
}

export interface UseClientsNeedingAttentionResult {
    clients: AttentionClient[];
    isLoading: boolean;
    error?: Error;
    isEmpty: boolean;
    refetch: () => void;
}

// ============ TRANSLATIONS ============
const attentionTranslations = {
    unreadMessage: isRTL ? "رسالة غير مقروءة" : "Unread message",
    weightGain: isRTL ? "زيادة +{x} كجم هذا الأسبوع" : "Weight +{x}kg this week",
    noCheckinDays: isRTL ? "لا تسجيل منذ {x} أيام" : "No check-in for {x} days",
    noCheckinYet: isRTL ? "لا توجد تسجيلات وزن بعد" : "No weigh-ins yet",
    justNow: isRTL ? "الآن" : "just now",
    minutesAgo: isRTL ? "منذ {x} د" : "{x}m ago",
    hoursAgo: isRTL ? "منذ {x} س" : "{x}h ago",
    daysAgo: isRTL ? "منذ {x} ي" : "{x}d ago",
};

function formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return attentionTranslations.justNow;
    if (minutes < 60) return attentionTranslations.minutesAgo.replace("{x}", String(minutes));
    if (hours < 24) return attentionTranslations.hoursAgo.replace("{x}", String(hours));
    return attentionTranslations.daysAgo.replace("{x}", String(days));
}

// ============ MAIN HOOK ============
export function useClientsNeedingAttention(limit?: number): UseClientsNeedingAttentionResult {
    const [clients, setClients] = useState<AttentionClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchClients = useCallback(async () => {
        try {
        } catch (error) {
            console.error('Error fetching clients needing attention:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    return {
        clients,
        isLoading,
        isEmpty: clients.length === 0,
        refetch: fetchClients,
    };
}
