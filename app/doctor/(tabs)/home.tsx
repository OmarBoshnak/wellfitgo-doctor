import React, { useState, useCallback } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    RefreshControl,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
    Users,
    MessageSquare,
    FileText,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { doctorTranslations as t } from '@/src/i18n';
import { horizontalScale, verticalScale } from '@/src/core/utils/scaling';

// Import from new backend lib instead of Mongdb
import {
    useCurrentUser,
    useDashboardStats,
    useCoachInbox,
    useClientsNeedingAttention,
    useTodaysAppointments,
    useWeeklyActivity,
    useRecentActivity,
} from '@/src/lib';
import { usePhoneCall } from '@/src/hooks/usePhoneCall';
import { useUnreadNotificationCount } from '@/src/features/home/hooks/useNotifications';

// Extracted Components
import {
    DoctorHeader,
    StatsGrid,
    ClientsAttentionSection,
    AppointmentsSection,
    WeeklyActivitySection,
    RecentActivitySection,
    NotificationPanel,
} from '@/src/features/home/component';
import { Ionicons } from '@expo/vector-icons';




// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DoctorDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { user, refetch: refetchUser } = useCurrentUser();
    const { data: dashboardStats, refetch: refetchStats } = useDashboardStats();
    const userName = user?.firstName || 'Doctor';

    // Get real-time unread messages count
    const {
        totalUnread,
        oldestUnread,
        isLoading: messagesLoading,
        refetch: refetchInbox
    } = useCoachInbox();

    // ============ CLIENTS NEEDING ATTENTION ============
    const {
        clients: attentionClients,
        isLoading: attentionLoading,
        isEmpty: noAttentionNeeded,
        refetch: refetchAttention,
    } = useClientsNeedingAttention(5);

    // ============ TODAY'S APPOINTMENTS ============
    const {
        appointments,
        isLoading: appointmentsLoading,
        isEmpty: noAppointments,
        refetch: refetchAppointments,
    } = useTodaysAppointments(5);

    // ============ PHONE CALL ============
    const { callClient } = usePhoneCall();

    // ============ NOTIFICATIONS ============
    const { count: notificationCount, refetch: refetchNotifications } = useUnreadNotificationCount();

    // ============ WEEKLY ACTIVITY ============
    const {
        stats: weeklyStats,
        chartData: weeklyChartData,
        isLoading: weeklyLoading,
        isEmpty: noWeeklyActivity,
        refetch: refetchWeeklyActivity,
    } = useWeeklyActivity();

    // ============ RECENT ACTIVITY ============
    const {
        activities: recentActivities,
        isLoading: activitiesLoading,
        isEmpty: noActivities,
        refetch: refetchRecentActivity,
    } = useRecentActivity(5);

    // Refresh Control State
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refetchUser(),
                refetchStats(),
                refetchInbox(),
                refetchAttention(),
                refetchAppointments(),
                refetchNotifications(),
                refetchWeeklyActivity(),
                refetchRecentActivity(),
            ]);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        } finally {
            setRefreshing(false);
        }
    }, [
        refetchUser,
        refetchStats,
        refetchInbox,
        refetchAttention,
        refetchAppointments,
        refetchNotifications,
        refetchWeeklyActivity,
        refetchRecentActivity
    ]);

    // Notification panel visibility state
    const [showNotifications, setShowNotifications] = useState(false);

    // Build dynamic subtext for unread messages card
    const unreadSubtext = oldestUnread
        ? `${oldestUnread.preview.slice(0, 25)}${oldestUnread.preview.length > 25 ? '...' : ''} • ${oldestUnread.relativeTime}`
        : t.oldestMessage;

    // Handle notification item press
    const handleNotificationPress = (notification: any) => {
        setShowNotifications(false);
        if (notification.type === 'message') {
            router.push('/doctor/messages' as any);
        } else if (notification.type === 'weight_log') {
            router.push('/doctor/clients' as any);
        }
    };

    // Handle search - navigate to clients with search filter
    const handleSearch = (query: string) => {
        if (query.trim()) {
            router.push({
                pathname: '/doctor/clients' as any,
                params: { search: query },
            });
        }
    };

    // --------------------------------------------------------
    // NAVIGATION HANDLERS
    // --------------------------------------------------------

    const navigateTo = (view: string, _clientId?: string) => {
        switch (view) {
            case 'clients':
                router.push('/doctor/clients' as any);
                break;
            case 'messages':
                router.push('/doctor/messages' as any);
                break;
            case 'meal-plans':
                router.push('/doctor/plans' as any);
                break;
            case 'analytics':
                router.push('/doctor/analytics' as any);
                break;
            case 'client-profile':
                break;
            default:
                break;
        }
    };

    // ============ ATTENTION SECTION HANDLERS ============
    const handleClientPress = (clientId: string) => {
        router.push({
            pathname: '/doctor/client-profile' as any,
            params: { id: clientId },
        });
    };

    const handleMessagePress = (clientId: string) => {
        router.push({
            pathname: '/doctor/messages' as any,
            params: { openChatWithClient: clientId },
        });
    };

    const handleViewAllAttention = () => {
        router.push({
            pathname: '/doctor/clients' as any,
            params: { filter: 'needs_attention' },
        });
    };

    // --------------------------------------------------------
    // STATS GRID DATA
    // --------------------------------------------------------

    const statsData = [
        {
            icon: <Users size={horizontalScale(22)} color="#16A34A" />,
            iconBgColor: '#DCFCE7',
            value: dashboardStats?.activeClients?.toString() || '0',
            label: t.activeClients,
            trend: dashboardStats?.activeClientsTrend !== undefined
                ? `${dashboardStats?.activeClientsTrendUp ? '+' : '-'}${dashboardStats?.activeClientsTrend}% ${t.thisMonth}`
                : undefined,
            trendUp: dashboardStats?.activeClientsTrendUp ?? true,
            onPress: () => navigateTo('clients'),
        },
        {
            icon: <Ionicons name="scale" size={horizontalScale(22)} color="#F59E0B" />,
            iconBgColor: '#FEF3C7',
            value: dashboardStats?.unreviewedWeightLogs?.toString() || '0',
            label: t.weightLogs,
            subtext: t.needsReview,
            onPress: () => navigateTo('clients'),
        },
        {
            icon: <MessageSquare size={horizontalScale(22)} color="#2563EB" />,
            iconBgColor: '#DBEAFE',
            value: dashboardStats?.unreadMessages?.toString() || totalUnread?.toString() || '0',
            label: t.unreadMessages,
            subtext: unreadSubtext,
            onPress: () => navigateTo('messages'),
        },
        {
            icon: <FileText size={horizontalScale(22)} color="#DC2626" />,
            iconBgColor: '#FEE2E2',
            value: dashboardStats?.plansExpiring?.toString() || '0',
            label: t.plansExpiring,
            subtext: t.inNextDays,
            onPress: () => navigateTo('meal-plans'),
        },
    ];

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <DoctorHeader
                userName={userName}
                userImage={user?.avatarUrl}
                notificationCount={notificationCount}
                onNotificationPress={() => setShowNotifications(true)}
                onSearch={handleSearch}
                style={{ paddingTop: insets.top }}
            />

            {/* Notification Panel Dropdown */}
            <NotificationPanel
                visible={showNotifications}
                onClose={() => setShowNotifications(false)}
                onNotificationPress={handleNotificationPress}
            />

            <Animated.ScrollView
                entering={FadeIn.duration(400)}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Quick Stats Grid */}
                <StatsGrid stats={statsData} />

                {/* Clients Needing Attention */}
                <ClientsAttentionSection
                    clients={attentionClients}
                    isLoading={attentionLoading}
                    isEmpty={noAttentionNeeded}
                    onViewAll={handleViewAllAttention}
                    onClientPress={handleClientPress}
                    onMessagePress={handleMessagePress}
                    onDismiss={(clientId) => {
                        console.log('[Home] Dismissed attention for client:', clientId);
                    }}
                    onRetry={refetchAttention}
                />

                {/* Today's Appointments */}
                <AppointmentsSection
                    appointments={appointments}
                    isLoading={appointmentsLoading}
                    isEmpty={noAppointments}
                    onAddPress={() => router.push('/doctor-calendar' as any)}
                    onSchedulePress={() => router.push('/doctor-calendar' as any)}
                    onAppointmentPress={() => router.push('/doctor-calendar' as any)}
                    onStartCall={(apt: any) => {
                        router.push('/doctor-calendar' as any);
                    }}
                    onStartPhoneCall={(apt: any) => {
                        callClient(apt.clientId, apt.clientName, apt.clientPhone);
                    }}
                    onRetry={refetchAppointments}
                />

                {/* This Week's Activity */}
                <WeeklyActivitySection
                    chartData={weeklyChartData}
                    stats={weeklyStats}
                    isLoading={weeklyLoading}
                    isEmpty={noWeeklyActivity}
                    onViewAnalytics={() => navigateTo('analytics')}
                />

                {/* Recent Activity Feed */}
                <RecentActivitySection
                    activities={recentActivities}
                    isLoading={activitiesLoading}
                    isEmpty={noActivities}
                    onSeeAll={() => router.push('/doctor/coach-activity-history' as any)}
                    onActivityPress={(activity: any) => {
                        // Navigate based on activity type
                        if (activity.type === 'message') {
                            router.push({
                                pathname: '/doctor/messages' as any,
                                params: activity.clientId ? { openChatWithClient: activity.clientId } : undefined,
                            });
                        } else if (activity.type === 'weight_log' || activity.type === 'meal_completed') {
                            if (activity.clientId) {
                                router.push({
                                    pathname: '/doctor/client-profile' as any,
                                    params: { id: activity.clientId },
                                });
                            } else {
                                router.push('/doctor/clients' as any);
                            }
                        } else if (activity.clientId) {
                            router.push({
                                pathname: '/doctor/client-profile' as any,
                                params: { id: activity.clientId },
                            });
                        }
                    }}
                />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: horizontalScale(12),
        paddingBottom: verticalScale(32),
    },
});
