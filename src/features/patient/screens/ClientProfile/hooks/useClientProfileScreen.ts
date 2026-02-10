import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
// Removing backend hooks imports
// import {
//     useClientProfile,
//     useClientActivity,
//     useWeightChart,
//     useClientWeightHistory,
// } from '@/src/lib';
import { isRTL } from '@/src/core/constants/translation';
import { usePhoneCall } from '@/src/hooks/usePhoneCall';
import clientsService from '@/src/shared/services/clients.service';
import { ChartPeriod, SectionItem, TABS, TabType } from '../types';

// ============ TYPES ============

export interface ClientProfile {
    id: string;
    name: string;
    firstName: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    location?: string;
    height?: number;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    weeklyChange: number;
    startDate: string;
    joinedAt: number;
    lastActiveAt?: string | number;
    subscriptionStatus: string;
    conversationId: string | null;
    unreadMessages: number;
    hasActivePlan: boolean;
    activePlanId: string | null;
    planWeekStart?: string;
    planWeekEnd?: string;
    weightHistory: Array<{
        id: string;
        weight: number;
        unit: string;
        date: string;
        feeling?: string;
        createdAt: number;
    }>;
}

export interface Activity {
    id: string;
    type: "weight" | "meals" | "message" | "missed" | "plan" | "water";
    color: string;
    date: string;
    text: string;
    subtext: string;
    timestamp: number;
}

interface RawWeightEntry {
    id?: string;
    weight: number;
    unit?: string;
    date: string;
    feeling?: string;
    createdAt?: number;
}

interface ClientProgressData {
    startWeight?: number;
    currentWeight?: number;
    targetWeight?: number;
    height?: number;
    weightHistory?: RawWeightEntry[];
    weeklyGoals?: Record<string, any>;
    mealCompliance?: number;
    mealsCompleted?: number;
    mealsTotal?: number;
    waterIntake?: number;
    exerciseMinutes?: number;
}

export interface UseClientProfileResult {
    // State
    activeTab: TabType;
    chartPeriod: ChartPeriod;
    showCallModal: boolean;

    // Data
    client: ClientProfile | null;
    activities: Activity[];
    tabs: typeof TABS;
    sections: SectionItem[];
    chartData: {
        points: Array<{ date: string; weight: number; timestamp: number }>;
        targetWeight: number;
        minWeight: number;
        maxWeight: number;
        currentWeight: number;
        startWeight: number;
    } | null;
    weeklyStats: {
        mealsCompleted: number;
        mealsTotal: number;
        hasWeightLog: boolean;
        lastWeightLogDate?: string | null;
        lastWeightLogFeeling?: string | null;
    } | null;

    // Computed
    weightDiff: number;
    remainingWeight: number;
    isLoading: boolean;
    chartLoading: boolean;
    statsLoading: boolean;

    // Handlers
    handleBack: () => void;
    handleCall: () => void;
    handleEmail: () => void;
    handleSendMessage: () => void;
    handleScheduleCall: () => void;
    handleCloseCallModal: () => void;
    handleTabChange: (tab: TabType) => void;
    handlePeriodChange: (period: ChartPeriod) => void;
}

// ============ TRANSLATIONS ============

const alertMessages = {
    noPhone: {
        title: isRTL ? "لا يوجد رقم هاتف" : "No Phone Number",
        message: isRTL
            ? "هذا العميل ليس لديه رقم هاتف مسجل"
            : "This client doesn't have a phone number on file",
    },
    noEmail: {
        title: isRTL ? "لا يوجد بريد إلكتروني" : "No Email",
        message: isRTL
            ? "هذا العميل ليس لديه بريد إلكتروني مسجل"
            : "This client doesn't have an email on file",
    },
};

const DEFAULT_MEALS_TOTAL = 21;
const IDEAL_BMI = 22;

const activityColors: Record<string, string> = {
    weight: '#60A5FA',
    meals: '#27AE61',
    message: '#5073FE',
    missed: '#FBBF24',
    plan: '#8B5CF6',
    water: '#27AE61',
};

const formatShortDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
};

const formatActivityDate = (value?: string | number): string => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const dateLabel = date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
    });
    const timeLabel = date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
    return `${dateLabel} • ${timeLabel}`;
};

const parseTimestamp = (value?: string | number): number => {
    if (!value) return Date.now();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
};

const normalizeWeightHistory = (entries: RawWeightEntry[] | undefined, clientId?: string) => {
    if (!entries || entries.length === 0) return [];
    return entries
        .map((entry, index) => {
            const createdAt = entry.createdAt
                ? new Date(entry.createdAt).getTime()
                : new Date(entry.date).getTime();
            return {
                id: entry.id ?? `${clientId || 'client'}-weight-${index}`,
                weight: entry.weight,
                unit: entry.unit ?? 'kg',
                date: entry.date,
                feeling: entry.feeling,
                createdAt,
            };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
};

const filterHistoryByPeriod = (
    entries: ReturnType<typeof normalizeWeightHistory>,
    period: ChartPeriod
) => {
    const sortedAsc = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    if (period === 'All') return sortedAsc;
    const daysMap: Record<Exclude<ChartPeriod, 'All'>, number> = {
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
    };
    const days = daysMap[period as Exclude<ChartPeriod, 'All'>] ?? 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return sortedAsc.filter(entry => new Date(entry.date) >= cutoff);
};

const calculateTargetWeight = (heightCm?: number): number | null => {
    if (!heightCm || heightCm <= 0) return null;
    const heightMeters = heightCm / 100;
    const target = IDEAL_BMI * (heightMeters ** 2);
    return Math.round(target * 10) / 10;
};

// ============ MAIN HOOK ============

export function useClientProfileScreen(clientId?: string): UseClientProfileResult {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');
    const [showCallModal, setShowCallModal] = useState(false);

    const [profileData, setProfileData] = useState<Partial<ClientProfile> | null>(null);
    const [progressData, setProgressData] = useState<ClientProgressData | null>(null);
    const [activitiesData, setActivitiesData] = useState<Activity[]>([]);
    const [profileLoading, setProfileLoading] = useState(true);
    const [progressLoading, setProgressLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);

    // Phone call hook (same as DayEventCard)
    const { callClient } = usePhoneCall();

    useEffect(() => {
        let isMounted = true;

        const fetchProfileData = async () => {
            if (!clientId) {
                setProfileData(null);
                setProgressData(null);
                setActivitiesData([]);
                setProfileLoading(false);
                setProgressLoading(false);
                setActivityLoading(false);
                return;
            }

            setProfileLoading(true);
            setProgressLoading(true);
            setActivityLoading(true);

            const [clientsResult, progressResult, activityResult] = await Promise.allSettled([
                clientsService.getClients('all', '', 1, 200),
                clientsService.getClientProgress(clientId),
                clientsService.getClientActivity(clientId),
            ]);

            if (!isMounted) return;

            if (clientsResult.status === 'fulfilled') {
                const matchedClient = clientsResult.value.clients.find((client: { id: string }) => client.id === clientId) ?? null;
                setProfileData(matchedClient ? { ...matchedClient } : null);
            } else {
                setProfileData(null);
            }

            if (progressResult.status === 'fulfilled') {
                setProgressData(progressResult.value as ClientProgressData);
            } else {
                setProgressData(null);
            }

            if (activityResult.status === 'fulfilled') {
                const mappedActivities: Activity[] = (activityResult.value || []).map((activity: any, index: number) => {
                    const timestamp = parseTimestamp(activity.timestamp ?? activity.createdAt ?? activity.date);
                    return {
                        id: activity.id ?? activity._id ?? `${clientId}-activity-${index}`,
                        type: (activity.type as Activity['type']) ?? 'message',
                        color: activity.color ?? activityColors[activity.type] ?? activityColors.message,
                        date: activity.date ?? formatActivityDate(timestamp),
                        text: activity.text ?? activity.title ?? activity.description ?? '',
                        subtext: activity.subtext ?? activity.details ?? '',
                        timestamp,
                    };
                });
                setActivitiesData(mappedActivities.sort((a, b) => b.timestamp - a.timestamp));
            } else {
                setActivitiesData([]);
            }

            setProfileLoading(false);
            setProgressLoading(false);
            setActivityLoading(false);
        };

        fetchProfileData();

        return () => {
            isMounted = false;
        };
    }, [clientId]);

    // ============ TRANSFORM DATA ============

    const weightHistory = useMemo(
        () => normalizeWeightHistory(progressData?.weightHistory, clientId),
        [progressData?.weightHistory, clientId]
    );

    const heightCm = progressData?.height ?? profileData?.height;
    const calculatedTargetWeight = calculateTargetWeight(heightCm);
    const baseTargetWeight = progressData?.targetWeight ?? profileData?.targetWeight ?? 0;
    const targetWeight = calculatedTargetWeight ?? baseTargetWeight;

    const currentWeight =
        progressData?.currentWeight ??
        profileData?.currentWeight ??
        weightHistory[0]?.weight ??
        0;
    const startWeight =
        progressData?.startWeight ??
        profileData?.startWeight ??
        weightHistory[weightHistory.length - 1]?.weight ??
        currentWeight;

    const weeklyChange = weightHistory.length > 1
        ? weightHistory[0].weight - weightHistory[1].weight
        : 0;
    const startDate = formatShortDate(weightHistory[weightHistory.length - 1]?.date);

    const client = useMemo((): ClientProfile | null => {
        if (!profileData && !progressData) return null;

        const resolvedName = profileData?.name
            ?? `${profileData?.firstName || ''} ${profileData?.lastName || ''}`.trim();
        const name = resolvedName || (isRTL ? 'عميل' : 'Client');

        return {
            id: profileData?.id ?? clientId ?? '',
            name,
            firstName: profileData?.firstName ?? name.split(' ')[0] ?? '',
            lastName: profileData?.lastName,
            email: profileData?.email ?? null,
            phone: profileData?.phone ?? null,
            avatar: profileData?.avatar ?? null,
            location: profileData?.location,
            height: heightCm,
            startWeight,
            currentWeight,
            targetWeight,
            weeklyChange,
            startDate,
            joinedAt: profileData?.joinedAt ?? 0,
            lastActiveAt: profileData?.lastActiveAt,
            subscriptionStatus: profileData?.subscriptionStatus ?? '',
            conversationId: profileData?.conversationId ?? null,
            unreadMessages: profileData?.unreadMessages ?? 0,
            hasActivePlan: profileData?.hasActivePlan ?? false,
            activePlanId: profileData?.activePlanId ?? null,
            planWeekStart: profileData?.planWeekStart,
            planWeekEnd: profileData?.planWeekEnd,
            weightHistory,
        };
    }, [
        profileData,
        progressData,
        clientId,
        heightCm,
        startWeight,
        currentWeight,
        targetWeight,
        weeklyChange,
        startDate,
        weightHistory,
    ]);

    const activities = useMemo(() => activitiesData, [activitiesData]);

    const mealsCompleted = progressData?.mealsCompleted ?? (progressData?.mealCompliance
        ? Math.round((progressData.mealCompliance / 100) * DEFAULT_MEALS_TOTAL)
        : 0);

    const mealsTotal = progressData?.mealsTotal ?? DEFAULT_MEALS_TOTAL;

    const weeklyStats = useMemo(() => {
        if (!weightHistory.length && !progressData) return null;
        const lastLog = weightHistory[0];
        return {
            mealsCompleted,
            mealsTotal,
            hasWeightLog: !!lastLog,
            lastWeightLogDate: lastLog?.date ?? null,
            lastWeightLogFeeling: lastLog?.feeling ?? null,
        };
    }, [weightHistory, mealsCompleted, mealsTotal, progressData]);

    const chartData = useMemo(() => {
        const filteredHistory = filterHistoryByPeriod(weightHistory, chartPeriod);
        if (!filteredHistory.length) return null;
        const points = filteredHistory.map(entry => ({
            date: entry.date,
            weight: entry.weight,
            timestamp: entry.createdAt,
            feeling: entry.feeling,
        }));
        const weights = points.map(point => point.weight);
        return {
            points,
            targetWeight,
            minWeight: Math.min(...weights),
            maxWeight: Math.max(...weights),
            currentWeight,
            startWeight,
        };
    }, [weightHistory, chartPeriod, targetWeight, currentWeight, startWeight]);

    // ============ COMPUTED VALUES ============

    const weightDiff = client ? client.startWeight - client.currentWeight : 0;
    const remainingWeight = client ? client.currentWeight - client.targetWeight : 0;
    const isLoading = profileLoading || progressLoading || activityLoading;
    const isChartLoading = progressLoading;
    const statsLoading = progressLoading;

    // ============ HANDLERS ============

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Phone call handler using usePhoneCall hook (same as DayEventCard)
    const handleCall = useCallback(() => {
        if (client) {
            callClient(
                client.id,
                client.name,
                client.phone || null
            );
        }
    }, [client, callClient]);

    const handleEmail = useCallback(() => {
        if (client?.email) {
            Linking.openURL(`mailto:${client.email}`);
        } else {
            Alert.alert(alertMessages.noEmail.title, alertMessages.noEmail.message);
        }
    }, [client]);

    const handleSendMessage = useCallback(() => {
        if (client) {
            router.push({
                pathname: '/doctor/messages' as any,
                params: { openChatWithClient: client.id },
            });
        }
    }, [client, router]);

    const handleScheduleCall = useCallback(() => {
        setShowCallModal(true);
    }, []);

    const handleCloseCallModal = useCallback(() => {
        setShowCallModal(false);
    }, []);

    const handleTabChange = useCallback((tab: TabType) => {
        setActiveTab(tab);
    }, []);

    const handlePeriodChange = useCallback((period: ChartPeriod) => {
        setChartPeriod(period);
    }, []);

    // ============ BUILD SECTIONS ============

    const getSections = useCallback((): SectionItem[] => {
        const baseSections: SectionItem[] = [
            { id: 'header', type: 'header' },
            { id: 'stats', type: 'stats' },
            { id: 'actions', type: 'actions' },
            { id: 'tabs', type: 'tabs' },
        ];

        if (activeTab === 'overview') {
            return [
                ...baseSections,
                { id: 'weekSummary', type: 'weekHeader' },
                { id: 'chart', type: 'chart' },
                { id: 'activity', type: 'activity' },
            ];
        }

        if (activeTab === 'meal-plan') {
            return [
                ...baseSections,
                { id: 'mealPlanContent', type: 'mealPlanContent' },
            ];
        }

        if (activeTab === 'weight-records') {
            return [
                ...baseSections,
                { id: 'weightRecordsContent', type: 'weightRecordsContent' },
            ];
        }

        if (activeTab === 'notes') {
            return [
                ...baseSections,
                { id: 'notesContent', type: 'notesContent' },
            ];
        }

        if (activeTab === 'settings') {
            return [
                ...baseSections,
                { id: 'settingsContent', type: 'settingsContent' },
            ];
        }

        return [
            ...baseSections,
            { id: 'placeholder', type: 'placeholder' },
        ];
    }, [activeTab]);

    return {
        // State
        activeTab,
        chartPeriod,
        showCallModal,

        // Data
        client,
        activities,
        tabs: TABS,
        sections: getSections(),
        chartData: chartData as UseClientProfileResult['chartData'],
        weeklyStats: weeklyStats as UseClientProfileResult['weeklyStats'],

        // Computed
        weightDiff,
        remainingWeight,
        isLoading,
        chartLoading: isChartLoading,
        statsLoading,

        // Handlers
        handleBack,
        handleCall,
        handleEmail,
        handleSendMessage,
        handleScheduleCall,
        handleCloseCallModal,
        handleTabChange,
        handlePeriodChange,
    };
}
