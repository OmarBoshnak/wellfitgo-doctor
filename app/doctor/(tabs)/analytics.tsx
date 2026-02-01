import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import {
    TrendingUp,
    TrendingDown,
    Users,
    MessageSquare,
    Clock,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    BarChart3,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import {
    useDoctorAnalytics,
    calculateProgressPercentages,
    type TimeRange,
} from '@/src/features/analytics';
import { AnalyticsHeader } from '@/src/features/analytics/components/AnalyticsHeader';
import { ProgressChart } from '@/src/features/analytics/components/ProgressChart';
import { DailyActivityChart } from '@/src/features/analytics/components/DailyActivityChart/DailyActivityChart';
import { ClientStatusTable } from '@/src/features/analytics/components/ClientStatusTable/ClientStatusTable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'الإحصائيات' : 'Analytics',
    performanceOverview: isRTL ? 'نظرة عامة على الأداء' : 'Your performance overview',
    last7Days: isRTL ? 'آخر 7 أيام' : 'Last 7 days',
    last30Days: isRTL ? 'آخر 30 يوم' : 'Last 30 days',
    last3Months: isRTL ? 'آخر 3 أشهر' : 'Last 3 months',
    exportReport: isRTL ? 'تصدير التقرير' : 'Export Report',
    activeClients: isRTL ? 'العملاء النشطين' : 'Active Clients',
    avgProgress: isRTL ? 'متوسط تقدم العملاء' : 'Avg. Client Progress',
    checkInRate: isRTL ? 'معدل التسجيل' : 'Check-in Rate',
    responseTime: isRTL ? 'وقت الاستجابة' : 'Response Time',
    vsLastPeriod: isRTL ? 'مقارنة بالفترة السابقة' : 'vs last period',
    slower: isRTL ? 'أبطأ' : 'Slower',
    hours: isRTL ? 'ساعات' : 'hours',
    kgWeek: isRTL ? 'كجم/أسبوع' : 'kg/week',
    progressDistribution: isRTL ? 'توزيع تقدم العملاء' : 'Client Progress Distribution',
    clients: isRTL ? 'عملاء' : 'Clients',
    onTrack: isRTL ? 'على المسار' : 'On Track',
    needsSupport: isRTL ? 'يحتاج دعم' : 'Needs Support',
    atRisk: isRTL ? 'معرض للخطر' : 'At Risk',
    dailyActivity: isRTL ? 'النشاط اليومي' : 'Daily Activity',
    messages: isRTL ? 'الرسائل' : 'Messages',
    plans: isRTL ? 'الخطط' : 'Plans',
    checkIns: isRTL ? 'التسجيلات' : 'Check-ins',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noClients: isRTL ? 'لا يوجد عملاء بعد' : 'No clients yet',
    noClientsDesc: isRTL
        ? 'ابدأ بإضافة عملاء لرؤية الإحصائيات'
        : 'Add clients to see analytics',
    noData: isRTL ? 'لا توجد بيانات' : 'No data',
};

// Day labels for chart (last 7 days dynamic)
const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabelsAr = ['أح', 'إث', 'ث', 'أر', 'خ', 'ج', 'س'];
    return isRTL ? dayLabelsAr[dayIndex] : dayLabelsEn[dayIndex];
};

// ============ MAIN COMPONENT ============
export default function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [timeFilter, setTimeFilter] = useState<TimeRange>('7days');
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch analytics data
    const { data, isLoading, isEmpty } = useDoctorAnalytics(timeFilter);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        // TODO: Implement refresh logic - refetch analytics data
        // For now, just simulate a refresh delay
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    // Handle send reminder button press
    const handleSendReminder = useCallback(async (clientId: string, clientName: string) => {
        setSendingReminderId(clientId);
        try {
            // TODO: Call backend API to send reminder
            console.log('Sending reminder to client:', clientId);
            Alert.alert(
                isRTL ? 'تم الإرسال' : 'Sent',
                isRTL ? `تم إرسال التذكير إلى ${clientName}` : `Reminder sent to ${clientName}`,
                [{ text: isRTL ? 'حسناً' : 'OK' }]
            );
        } catch (error) {
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                isRTL ? 'فشل إرسال التذكير' : 'Failed to send reminder',
                [{ text: isRTL ? 'حسناً' : 'OK' }]
            );
        } finally {
            setSendingReminderId(null);
        }
    }, []);

    // Handle view profile button press
    const handleViewProfile = useCallback((clientId: string) => {
        // router.push(`/(app)/doctor/client-profile?id=${clientId}`);
    }, [router]);

    const timeFilters: { key: TimeRange; label: string }[] = [
        { key: '7days', label: t.last7Days },
        { key: '30days', label: t.last30Days },
        { key: '3months', label: t.last3Months },
    ];

    // Calculate progress distribution with percentages
    const progressData = useMemo(() => {
        if (!data) return null;
        const buckets = calculateProgressPercentages(data.progressBuckets);
        return {
            onTrack: { percentage: buckets.onTrack.percentage, count: buckets.onTrack.count, color: '#10B981' },
            needsSupport: { percentage: buckets.needsSupport.percentage, count: buckets.needsSupport.count, color: '#F59E0B' },
            atRisk: { percentage: buckets.atRisk.percentage, count: buckets.atRisk.count, color: '#EF4444' },
            total: buckets.total,
        };
    }, [data]);

    // Chart calculations
    const chartSize = horizontalScale(160);
    const strokeWidth = horizontalScale(16);
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate bar chart max values
    const maxMessages = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.messages), 1);
    }, [data]);

    const maxPlans = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.plans), 1);
    }, [data]);

    const maxCheckIns = useMemo(() => {
        if (!data?.dailyActivity.length) return 1;
        return Math.max(...data.dailyActivity.map(d => d.checkIns), 1);
    }, [data]);

    // Calculate totals for daily activity
    const activityTotals = useMemo(() => {
        if (!data?.dailyActivity.length) return { messages: 0, plans: 0, checkIns: 0 };
        return data.dailyActivity.reduce(
            (acc, day) => ({
                messages: acc.messages + day.messages,
                plans: acc.plans + day.plans,
                checkIns: acc.checkIns + day.checkIns,
            }),
            { messages: 0, plans: 0, checkIns: 0 }
        );
    }, [data]);

    // ============ LOADING STATE ============
    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <AnalyticsHeader 
                    timeFilter={timeFilter} 
                    onTimeFilterChange={setTimeFilter}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ EMPTY STATE ============
    if (isEmpty || !data) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <AnalyticsHeader 
                    timeFilter={timeFilter} 
                    onTimeFilterChange={setTimeFilter}
                />
                <View style={styles.emptyContainer}>
                    <BarChart3 size={horizontalScale(64)} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>{t.noClients}</Text>
                    <Text style={styles.emptyDescription}>{t.noClientsDesc}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ============ MAIN RENDER ============
    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View>
                <AnalyticsHeader 
                    timeFilter={timeFilter} 
                    onTimeFilterChange={setTimeFilter}
                />
            </View>

            <Animated.ScrollView
                entering={FadeIn.duration(400)}
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primaryDark}
                        colors={[colors.primaryDark]}
                    />
                }
            >
                {/* Overview Stats */}
                <View style={styles.statsGrid}>
                    <StatCard
                        icon={<Users size={horizontalScale(22)} color="#10B981" />}
                        iconBg="#10B98120"
                        label={t.activeClients}
                        value={String(data.overview.activeClients)}
                        trend={null}
                        trendUp={true}
                    />
                    <StatCard
                        icon={<TrendingDown size={horizontalScale(22)} color="#3B82F6" />}
                        iconBg="#3B82F620"
                        label={t.avgProgress}
                        value={t.noData}
                        trend={null}
                        trendUp={false}
                    />
                    <StatCard
                        icon={<MessageSquare size={horizontalScale(22)} color="#8B5CF6" />}
                        iconBg="#8B5CF620"
                        label={t.checkInRate}
                        value={`${data.overview.checkInRate ?? 0}%`}
                        trend={null}
                        trendUp={(data.overview.checkInRate ?? 0) >= 80}
                    />
                    <StatCard
                        icon={<Clock size={horizontalScale(22)} color="#F59E0B" />}
                        iconBg="#F59E0B20"
                        label={t.responseTime}
                        value={data.overview.responseTime != null
                            ? `${data.overview.responseTime.toFixed(1)} ${t.hours}`
                            : t.noData
                        }
                        trend={null}
                        trendUp={false}
                    />
                </View>

                {/* Progress Distribution */}
                <ProgressChart data={progressData} />

                {/* Daily Activity Chart */}
                <DailyActivityChart data={data.dailyActivity} />

                {/* Check-in Status Table */}
                <ClientStatusTable
                    data={data.clients}
                    onSendReminder={handleSendReminder}
                    onViewProfile={handleViewProfile}
                    sendingReminderId={sendingReminderId}
                />

                {/* Bottom Spacing */}
                <View style={{ height: verticalScale(32) }} />
            </Animated.ScrollView>
        </SafeAreaView>
    );
}

// ============ STAT CARD COMPONENT ============
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    trend: string | null;
    trendUp: boolean;
}

function StatCard({ icon, iconBg, label, value, trend, trendUp }: StatCardProps) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                {icon}
            </View>
            <Text style={[styles.statLabel, { textAlign: isRTL ? 'right' : 'right' }]}>{label}</Text>
            <Text style={[styles.statValue, { textAlign: isRTL ? 'right' : 'right' }]}>{value}</Text>
            {trend && (
                <View style={[styles.trendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {trendUp ? (
                        <TrendingUp size={horizontalScale(12)} color={colors.success} />
                    ) : (
                        <TrendingDown size={horizontalScale(12)} color={colors.error} />
                    )}
                    <Text style={[styles.trendText, { color: trendUp ? colors.success : colors.error }]}>
                        {trend}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(32),
    },
    // Loading & Empty States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(32),
        gap: verticalScale(12),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(8),
    },
    emptyDescription: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: verticalScale(16),
    },
    statCard: {
        width: '48%',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(14),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
        alignItems:'flex-end'
    },
    statIcon: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: verticalScale(10),
    },
    statLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginBottom: verticalScale(4),
    },
    statValue: {
        fontSize: ScaleFontSize(22),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(6),
    },
    trendRow: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    trendText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
    },
    // Chart Card
    chartCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(20),
        paddingHorizontal: horizontalScale(16),
    },
    // Bar Chart
    barChartContainer: {
        height: verticalScale(160),
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: verticalScale(16),
        paddingTop: verticalScale(20),
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    barsWrapper: {
        flex: 1,
        width: '80%',
        justifyContent: 'flex-end',
        gap: verticalScale(2),
        paddingTop: verticalScale(15),
    },
    bar: {
        width: '100%',
        borderRadius: horizontalScale(3),
    },
    barMessages: {
        backgroundColor: '#3B82F6',
    },
    barPlans: {
        backgroundColor: '#10B981',
    },
    barCheckIns: {
        backgroundColor: '#F59E0B',
    },
    barLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(6),
    },
    // Activity Totals
    activityTotals: {
        justifyContent: 'space-around',
        paddingTop: verticalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    activityTotal: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    activityDot: {
        width: horizontalScale(10),
        height: horizontalScale(4),
        borderRadius: horizontalScale(5),
    },
    activityTotalLabel: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    activityTotalValue: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
});
