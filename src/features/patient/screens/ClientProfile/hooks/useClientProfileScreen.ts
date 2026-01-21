import { useState, useCallback, useMemo } from 'react';
import { Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
// Removing backend hooks imports
// import {
//     useClientProfile,
//     useClientActivity,
//     useWeightChart,
//     useClientWeightHistory,
// } from '@/src/lib';
import { TabType, SectionItem, TABS, ChartPeriod } from '../types';
import { isRTL } from '@/src/core/constants/translation';
import { usePhoneCall } from '@/src/hooks/usePhoneCall';

// ============ TYPES ============

export interface ClientProfile {
    id: string;
    name: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone: string;
    avatar: string | null;
    location: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    weeklyChange: number;
    startDate: string;
    joinedAt: number;
    lastActiveAt?: number;
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
    type: "weight" | "meals" | "message" | "missed" | "plan";
    color: string;
    date: string;
    text: string;
    subtext: string;
    timestamp: number;
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

// ============ MAIN HOOK ============

export function useClientProfileScreen(clientId?: string): UseClientProfileResult {
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3M');
    const [showCallModal, setShowCallModal] = useState(false);

    // Phone call hook (same as DayEventCard)
    const { callClient } = usePhoneCall();

    // ============ MOCK DATA ============
    // In a real app, these would come from the backend hooks
    // const { data: clientData, isLoading: clientLoading } = useClientProfile(clientId || '');
    // const { data: activitiesData } = useClientActivity(clientId || '');
    // const { data: chartData, isLoading: chartLoading } = useWeightChart(clientId || '', chartPeriod);
    // const { records: weightHistory } = useClientWeightHistory(clientId || '');

    // Use mock data directly
    const [clientData] = useState<any>(require('../mock').mockClient);
    const [activitiesData] = useState<any[]>(require('../mock').mockActivity);
    const [clientLoading] = useState(false);
    const [chartLoading] = useState(false);

    // Mock chart data based on client weight
    const chartData = useMemo(() => {
        return {
            points: [
                { date: '2023-11-01', weight: 75, timestamp: 1698800000000 },
                { date: '2023-12-01', weight: 72, timestamp: 1701390000000 },
                { date: '2024-01-01', weight: 68, timestamp: 1704060000000 },
            ],
            targetWeight: 60,
            minWeight: 60,
            maxWeight: 80,
            currentWeight: 68,
            startWeight: 75,
        };
    }, []);

    // Mock weight history
    const weightHistory = useMemo(() => [
        { id: '1', weight: 68, unit: 'kg', date: '2024-01-01', feeling: 'good', createdAt: 1704060000000 },
        { id: '2', weight: 70, unit: 'kg', date: '2023-12-15', feeling: 'ok', createdAt: 1702600000000 },
    ], []);

    // ============ TRANSFORM DATA ============

    const client = useMemo((): ClientProfile | null => {
        if (!clientData) return null;
        return clientData as unknown as ClientProfile;
    }, [clientData]);

    const activities = useMemo((): Activity[] => {
        if (!activitiesData) return [];
        return activitiesData as Activity[];
    }, [activitiesData]);

    // Weekly stats derived from weight history
    const weeklyStats = useMemo(() => {
        if (!weightHistory || weightHistory.length === 0) return null;
        const lastLog = weightHistory[0];
        return {
            mealsCompleted: 0, // TODO: Get from meal completions
            mealsTotal: 21,
            hasWeightLog: !!lastLog,
            lastWeightLogDate: lastLog?.date,
            lastWeightLogFeeling: lastLog?.feeling,
        };
    }, [weightHistory]);

    // ============ COMPUTED VALUES ============

    const weightDiff = client ? client.startWeight - client.currentWeight : 0;
    const remainingWeight = client ? client.currentWeight - client.targetWeight : 0;
    const isLoading = clientLoading;
    const isChartLoading = chartLoading;
    const statsLoading = !weeklyStats;

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
