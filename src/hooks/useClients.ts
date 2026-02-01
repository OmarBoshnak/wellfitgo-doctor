/**
 * Custom hook for fetching and managing clients
 * Supports filtering by weekly check-in day
 */
import { clientsService } from "@/src/shared/services/clients.service";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { isRTL } from "../i18n";

// ============ TYPES ============

export type DayFilter = "all" | "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export interface Client {
    id: string;
    name: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    avatar: string | null;
    height?: number;

    // Weight data
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    progress: number;

    // Weekly check-in
    weeklyCheckinDay: DayFilter;
    weeklyCheckinEnabled: boolean;

    // Activity tracking
    lastActiveAt?: string;
    lastCheckInDays: number | null;

    // Subscription
    subscriptionStatus: string;

    // Timestamps
    createdAt: string;
    daysSinceJoined: number;
}

export interface DayCounts {
    all: number;
    sat: number;
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
}

export interface UseClientsResult {
    clients: Client[];
    counts: DayCounts;
    isLoading: boolean;
    isEmpty: boolean;
    refetch: () => void;

    // Actions
    sendReminder: (clientId: string, type?: "checkin" | "weight" | "general") => Promise<void>;
    isSendingReminder: boolean;
}

// ============ TRANSLATIONS ============

const translations = {
    sent: isRTL ? "تم الإرسال" : "Sent",
    error: isRTL ? "خطأ" : "Error",
    ok: isRTL ? "حسناً" : "OK",
    reminderSent: isRTL
        ? (name: string) => `تم إرسال التذكير إلى ${name}`
        : (name: string) => `Reminder sent to ${name}`,
    failedToSend: isRTL ? "فشل إرسال التذكير" : "Failed to send reminder",
    // Time formatting
    never: isRTL ? "لم يسجل بعد" : "Never",
    today: isRTL ? "اليوم" : "Today",
    yesterday: isRTL ? "أمس" : "Yesterday",
    daysAgo: isRTL
        ? (days: number) => `منذ ${days} أيام`
        : (days: number) => `${days}d ago`,
    weeksAgo: isRTL
        ? (weeks: number) => `منذ ${weeks} أسبوع`
        : (weeks: number) => `${weeks}w ago`,
    monthsAgo: isRTL
        ? (months: number) => `منذ ${months} شهر`
        : (months: number) => `${months}mo ago`,
};

// ============ HELPER FUNCTIONS ============

/**
 * Format relative time for last check-in display
 */
export function formatLastCheckIn(days: number | null): string {
    if (days === null) {
        return translations.never;
    }
    if (days === 0) {
        return translations.today;
    }
    if (days === 1) {
        return translations.yesterday;
    }
    if (days < 7) {
        return translations.daysAgo(days);
    }
    if (days < 30) {
        const weeks = Math.floor(days / 7);
        return translations.weeksAgo(weeks);
    }
    const months = Math.floor(days / 30);
    return translations.monthsAgo(months);
}

// ============ MAIN HOOK ============

/**
 * Hook for fetching and managing clients on the coach dashboard
 * Supports filtering by weekly check-in day
 */
export function useClients(
    filter: DayFilter = "all",
    searchQuery: string = ""
): UseClientsResult {
    const [clients, setClients] = useState<Client[]>([]);
    const [counts, setCounts] = useState<DayCounts>({
        all: 0, sat: 0, sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    // Fetch clients from backend
    const fetchClients = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await clientsService.getClients(filter, searchQuery);
            setClients(response.clients);
            setCounts(response.counts);
        } catch (error) {
            console.error('Error fetching clients:', error);
            // Keep existing data on error
        } finally {
            setIsLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Send reminder action
    const sendReminder = useCallback(
        async (
            clientId: string,
            type: "checkin" | "weight" | "general" = "general"
        ) => {
            setIsSendingReminder(true);
            try {
                await clientsService.sendReminder(clientId, type);

                // Show success message
                const client = clients.find(c => c.id === clientId);
                const clientName = client?.name || 'Client';

                Alert.alert(
                    translations.sent,
                    translations.reminderSent(clientName),
                    [{ text: translations.ok }]
                );
            } catch (error: unknown) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : translations.failedToSend;

                Alert.alert(
                    translations.error,
                    errorMessage,
                    [{ text: translations.ok }]
                );
            } finally {
                setIsSendingReminder(false);
            }
        },
        [clients]
    );

    return {
        clients,
        counts,
        isLoading,
        isEmpty: !isLoading && clients.length === 0,
        refetch: fetchClients,
        sendReminder,
        isSendingReminder,
    };
}
