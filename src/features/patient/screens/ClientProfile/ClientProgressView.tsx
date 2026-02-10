/**
 * ClientProgressView Component
 * Doctor's view to see a specific client's meal plan progress
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScaleFontSize, horizontalScale, verticalScale } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { colors, gradients, shadows } from '@/src/core/constants/Theme';
import ProgressChart from '../../../meals/components/ProgressChart';
import DayScroller from '../../../meals/components/DayScroller';
import { plansService } from '@/src/shared/services';
import type { ClientProgressDetails, DailyMealLog, ClientAnalytics } from '@/src/shared/services/plans.service';
import settingsService, { ClientSettings } from '@/src/shared/services/settings.service';


// Translations
const t = {
    clientProgress: isRTL ? 'تقدم العميل' : 'Client Progress',
    active: isRTL ? 'نشط' : 'Active',
    thisWeek: isRTL ? 'هذا الأسبوع' : 'This Week',
    weekLabel: isRTL ? 'الأسبوع' : 'Week',
    ofTotal: isRTL ? 'من' : 'of',
    assigned: isRTL ? 'تم التعيين' : 'Assigned',
    planProgress: isRTL ? 'تقدم الخطة' : 'Plan Progress',
    ongoing: isRTL ? 'مستمر' : 'Ongoing',
    noActivePlan: isRTL ? 'لا توجد خطة نشطة' : 'No Active Plan',
    noActivePlanDesc: isRTL ? 'لم يتم تعيين خطة غذائية لهذا العميل' : "This client doesn't have an assigned meal plan",
    completed: isRTL ? 'مكتمل' : 'Completed',
    scheduled: isRTL ? 'مجدول' : 'Scheduled',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    reminderSent: isRTL ? 'تم إرسال التذكير بنجاح!' : 'Reminder sent successfully!',
    reminderFailed: isRTL ? 'فشل إرسال التذكير' : 'Failed to send reminder',
    modifyPlan: isRTL ? 'تعديل الخطة' : 'Modify Plan',
    messageClient: isRTL ? 'مراسلة العميل' : 'Message Client',
    reminderSettings: isRTL ? 'إعدادات تذكير الوجبات' : 'Meal Reminder Settings',
    remindersDisabled: isRTL ? 'التذكيرات معطلة' : 'Reminders disabled',
    remindersLoading: isRTL ? 'جاري تحميل الإعدادات...' : 'Loading reminder settings...',
    enabled: isRTL ? 'مفعل' : 'Enabled',
    disabled: isRTL ? 'معطل' : 'Disabled',
    timezone: isRTL ? 'المنطقة الزمنية' : 'Timezone',
};

const MEAL_LABELS = {
    breakfast: { en: 'Breakfast', ar: 'الإفطار' },
    snack1: { en: 'Snack', ar: 'وجبة خفيفة' },
    lunch: { en: 'Lunch', ar: 'الغداء' },
    snack2: { en: 'Snack', ar: 'وجبة خفيفة' },
    dinner: { en: 'Dinner', ar: 'العشاء' },
};

const DEFAULT_MEAL_REMINDERS_SCHEDULE = {
    breakfast: { enabled: true, time: '08:00' },
    snack1: { enabled: false, time: '11:00' },
    lunch: { enabled: true, time: '13:00' },
    snack2: { enabled: false, time: '16:00' },
    dinner: { enabled: true, time: '19:00' },
};

// Helper functions
const formatStartDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', options);
};

const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

const formatCompletedAt = (timestamp?: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

/**
 * Generate days array for DayScroller based on plan start date and duration
 * @param startDateISO - Plan start date in ISO format (YYYY-MM-DD)
 * @param durationDays - Total number of days in the plan
 * @returns Array of day objects for DayScroller component
 */
const generatePlanDays = (startDateISO: string, durationDays: number) => {
    const days = [];
    const startDate = new Date(startDateISO);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < durationDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateString = currentDate.toISOString().split('T')[0];
        const isToday = currentDate.getTime() === today.getTime();
        const weekNumber = Math.floor(i / 7) + 1;

        days.push({
            date: dateString,
            dayNum: currentDate.getDate(),
            label: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
            labelAr: currentDate.toLocaleDateString('ar-EG', { weekday: 'short' }),
            isToday,
            weekNumber,
        });
    }

    return days;
};

interface MealItem {
    id: string;
    name: string;
    nameAr: string;
    time: string;
    isCompleted: boolean;
    completedAt?: number;
    imageUrl?: string;
}

interface ClientProgressViewProps {
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    planId?: string;
    dietProgram?: string;
    clientGoal?: string;
    weekNumber?: string;
    totalWeeks?: string;
    startDate?: string;
    endDate?: string;
    completionRate?: string;
    streakDays?: string;
    viewProgress?: string;
    onBack?: () => void;
}

// Meal Checklist Item (Read-only for doctors)
const MealChecklistItem: React.FC<{ 
    meal: MealItem; 
}> = ({ meal }) => {
    const displayName = isRTL ? meal.nameAr : meal.name;

    return (
        <View style={styles.mealItem}>
            <View
                style={[
                    styles.checkbox,
                    meal.isCompleted && styles.checkboxCompleted
                ]}
            >
                {meal.isCompleted ? (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : null}
            </View>

            <View style={styles.mealContent}>
                <View style={[styles.mealHeader, isRTL && styles.mealHeaderRTL]}>
                    {meal.isCompleted && meal.completedAt ? (
                        <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>
                                {t.completed} {formatCompletedAt(meal.completedAt)}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.scheduledBadge}>
                            <Text style={styles.scheduledBadgeText}>
                                {t.scheduled} {formatTime(meal.time)}
                            </Text>
                        </View>
                    )}
                    <Text
                        style={[
                            styles.mealName,
                            meal.isCompleted && styles.mealNameCompleted,
                        ]}
                    >
                        {displayName}
                    </Text>
                </View>
            </View>

            {meal.imageUrl && (
                <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
            )}
        </View>
    );
};

// Main Component
export const ClientProgressView: React.FC<ClientProgressViewProps> = ({
    clientId,
    clientName,
    clientAvatar,
    planId,
    dietProgram,
    clientGoal,
    weekNumber,
    totalWeeks,
    startDate,
    endDate,
    completionRate,
    streakDays,
    viewProgress,
    onBack,
}) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Debug: Log received props
    console.log('ClientProgressView received props:', {
        clientId,
        clientName,
        planId,
        dietProgram,
        viewProgress
    });

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });

    // Local state for enhanced progress data
    const [progressDetails, setProgressDetails] = useState<ClientProgressDetails | null>(null);
    const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [clientSettings, setClientSettings] = useState<ClientSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);

    // Fetch enhanced client progress from backend
    useEffect(() => {
        const fetchEnhancedProgress = async () => {
            if (!planId) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Fetch detailed progress data
                const [progressData, analyticsData] = await Promise.all([
                    plansService.getClientProgressDetails(clientId, planId),
                    plansService.getClientAnalytics(clientId, planId, 'month')
                ]);

                setProgressDetails(progressData);
                setAnalytics(analyticsData);

            } catch (err) {
                console.error('Error fetching enhanced client progress:', err);
                setError('Failed to load progress data. Please try again.');
                // Do not set mock data - let the error UI show with retry option
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnhancedProgress();
    }, [clientId, planId, retryCount]);

    const fetchClientSettings = useCallback(async () => {
        if (!clientId) return;

        setSettingsLoading(true);
        try {
            const settings = await settingsService.getClientSettings(clientId);
            setClientSettings(settings);
        } catch (err) {
            console.error('Error fetching client settings:', err);
        } finally {
            setSettingsLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchClientSettings();
    }, [fetchClientSettings, retryCount]);

    // Retry handler
    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
    }, []);

    // Refresh handler
    const handleRefresh = useCallback(async () => {
        if (!planId) return;

        setRefreshing(true);
        try {
            setError(null);
            // Fetch detailed progress data
            const [progressData, analyticsData] = await Promise.all([
                plansService.getClientProgressDetails(clientId, planId),
                plansService.getClientAnalytics(clientId, planId, 'month')
            ]);

            setProgressDetails(progressData);
            setAnalytics(analyticsData);
            await fetchClientSettings();
        } catch (err) {
            console.error('Error refreshing client progress:', err);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setRefreshing(false);
        }
    }, [clientId, planId, fetchClientSettings]);

    const handleDaySelect = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    // Navigate to messages with this client
    const handleMessageClient = useCallback(() => {
        onBack?.(); // Close the progress view first
        // router.push({
        //     pathname: '/(app)/doctor/(tabs)/messages',
        //     params: { openChatWithClient: clientId },
        // });
    }, [clientId, onBack, router]);

    // Send reminder notification to client
    const sendClientReminder = useCallback(async (data: { clientId: string; reminderType: string }) => {
        try {
            await plansService.sendClientReminder(data.clientId, data.reminderType as any);
        } catch (error) {
            console.error('Error sending reminder:', error);
        }
    }, []);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    const handleSendReminder = useCallback(async () => {
        if (isSendingReminder) return;

        setIsSendingReminder(true);
        try {
            await sendClientReminder({
                clientId: clientId,
                reminderType: 'general',
            });
            // Show success feedback
            Alert.alert(
                isRTL ? 'تم الإرسال' : 'Sent!',
                t.reminderSent
            );
        } catch (error) {
            Alert.alert(
                isRTL ? 'خطأ' : 'Error',
                t.reminderFailed
            );
        } finally {
            setIsSendingReminder(false);
        }
    }, [clientId, isSendingReminder, sendClientReminder]);

    // Get selected day data
    const selectedDayData = useMemo(() => {
        if (!progressDetails?.dailyProgress) return null;
        return progressDetails.dailyProgress.find(d => d.date === selectedDate);
    }, [progressDetails?.dailyProgress, selectedDate]);

    // Get selected day label
    const selectedDayLabel = useMemo(() => {
        if (!selectedDayData) return isRTL ? 'اليوم' : 'Today';
        const dayDate = new Date(selectedDayData.date);
        const isToday = dayDate.toDateString() === new Date().toDateString();
        if (isToday) return isRTL ? 'اليوم' : 'Today';
        return dayDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short' });
    }, [selectedDayData]);

    const reminderSettings = clientSettings?.notificationSettings;
    const reminderSchedule = reminderSettings?.mealRemindersSchedule || DEFAULT_MEAL_REMINDERS_SCHEDULE;
    const reminderTimezone = reminderSettings?.timezone || 'UTC';

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
                <Text style={styles.loadingText}>{t.loading}</Text>
            </SafeAreaView>
        );
    }

    // Empty state
    if (!progressDetails) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <View style={[styles.header, isRTL && styles.headerRTL]}>
                    <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backButton}>
                        <Ionicons
                            name={isRTL ? 'arrow-forward' : 'arrow-back'}
                            size={24}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{clientName}</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyContent}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyTitle}>{t.noActivePlan}</Text>
                    <Text style={styles.emptyDesc}>{t.noActivePlanDesc}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { plan, weeklyStats } = progressDetails;
    const meals = selectedDayData?.meals || [];

    // Debug: Log meal data to verify diet plan integration
    console.log('ClientProgressView meal data:', {
        selectedDate,
        selectedDayData,
        mealsCount: meals.length,
        meals: meals.map(m => ({ id: m.id, name: m.name, time: m.time, isCompleted: m.isCompleted }))
    });

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            {/* Header */}
            <View style={[styles.header, isRTL && styles.headerRTL, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backButton}>
                    <Ionicons
                        name={isRTL ? 'arrow-forward' : 'arrow-back'}
                        size={24}
                        color={colors.textPrimary}
                    />
                </TouchableOpacity>
                <View style={[styles.headerClient, isRTL && styles.headerClientRTL]}>
                    <Text style={styles.headerTitle}>{clientName}</Text>
                    {clientAvatar ? (
                        <Image source={{ uri: clientAvatar }} style={styles.clientAvatar} />
                    ) : (
                        <View style={[styles.clientAvatar, styles.clientAvatarFallback]}>
                            <Text style={styles.clientAvatarText}>
                                {clientName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <FlatList
                data={meals}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primaryDark}
                        colors={[colors.primaryDark]}
                    />
                }
                ListHeaderComponent={() => (
                    <>
                        {/* Plan Summary Card */}
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.summaryCard, shadows.medium]}
                        >
                            <View style={styles.decorBlob1} />
                            <View style={styles.decorBlob2} />

                            <View style={[styles.summaryContent]}>
                                <View style={styles.activeBadge}>
                                    <View style={styles.activeDot} />
                                    <Text style={styles.activeBadgeText}>{t.active}</Text>
                                </View>
                                <View style={styles.summaryIcon}>
                                    <Ionicons name="restaurant-outline" size={24} color={colors.white} />
                                </View>
                            </View>
                            <View>
                                <Text style={styles.planName}>
                                    {plan.emoji} {isRTL ? plan.nameAr : plan.name}
                                </Text>

                                <View style={styles.metaRow}>
                                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.metaText}>
                                        {t.assigned} {formatStartDate(plan.startDate)}
                                    </Text>

                                </View>
                                <View style={styles.metaRow}>
                                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                                    <Text style={styles.metaText}>
                                        {t.weekLabel} {plan.currentWeek} {t.ofTotal} {plan.totalWeeks} {isRTL ? 'أسابيع' : 'weeks'}
                                    </Text>
                                </View>

                            </View>
                        </LinearGradient>

                        {/* Plan Progress Card */}
                        <View style={[styles.card, shadows.light]}>
                            <View style={[styles.cardHeader]}>
                                <Text style={styles.cardTitle}>{t.planProgress}</Text>
                            </View>

                            <View style={styles.chartContainer}>
                                <ProgressChart
                                    completed={weeklyStats.completedMeals}
                                    total={weeklyStats.totalMeals}
                                />
                            </View>

                            <DayScroller
                                days={generatePlanDays(
                                    plan.startDate,
                                    plan.endDate
                                        ? Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                        : plan.totalWeeks * 7
                                ).map((day) => {
                                    // Find the progress data for this day
                                    const dayProgress = progressDetails.dailyProgress.find(d => d.date === day.date);
                                    const dayDate = new Date(day.date);
                                    let status: 'completed' | 'partial' | 'missed' | 'upcoming';

                                    if (dayProgress) {
                                        if (dayProgress.completionRate === 100) {
                                            status = 'completed';
                                        } else if (dayProgress.completionRate > 0) {
                                            status = 'partial';
                                        } else if (day.isToday) {
                                            status = 'partial'; // Today with no completion is still partial (in progress)
                                        } else {
                                            status = 'missed';
                                        }
                                    } else {
                                        status = 'upcoming';
                                    }

                                    if (dayDate > new Date()) {
                                        status = 'upcoming';
                                    }

                                    return {
                                        ...day,
                                        status,
                                        completionRate: dayProgress?.completionRate || 0,
                                    };
                                })}
                                selectedDate={selectedDate}
                                onDaySelect={handleDaySelect}
                            />
                        </View>

                        {/* Reminder Settings Card */}
                        <View style={[styles.card, shadows.light]}>
                            <View style={[styles.cardHeader]}>
                                <Text style={styles.cardTitle}>{t.reminderSettings}</Text>
                            </View>

                            {settingsLoading ? (
                                <Text style={styles.reminderLoadingText}>{t.remindersLoading}</Text>
                            ) : reminderSettings?.mealReminders === false ? (
                                <Text style={styles.reminderDisabledText}>{t.remindersDisabled}</Text>
                            ) : (
                                <View style={styles.reminderList}>
                                    <Text style={styles.reminderTimezoneText}>
                                        {t.timezone}: {reminderTimezone}
                                    </Text>
                                    {Object.keys(reminderSchedule).map((mealKey) => {
                                        const typedKey = mealKey as keyof typeof reminderSchedule;
                                        const config = reminderSchedule[typedKey];
                                        const label = isRTL ? MEAL_LABELS[typedKey].ar : MEAL_LABELS[typedKey].en;

                                        return (
                                            <View key={mealKey} style={[styles.reminderRow, isRTL && styles.reminderRowRTL]}>
                                                <Text style={styles.reminderMealName}>{label}</Text>
                                                <View style={[styles.reminderMeta, isRTL && styles.reminderMetaRTL]}>
                                                    <Text style={styles.reminderTimeText}>
                                                        {formatTime(config.time)}
                                                    </Text>
                                                    <View style={[
                                                        styles.reminderBadge,
                                                        config.enabled ? styles.reminderBadgeOn : styles.reminderBadgeOff,
                                                    ]}>
                                                        <Text style={styles.reminderBadgeText}>
                                                            {config.enabled ? t.enabled : t.disabled}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>

                        {/* Daily Meals Header */}
                        <View style={[styles.checklistHeader]}>
                            <Text style={styles.checklistTitle}>{selectedDayLabel}</Text>
                        </View>
                    </>
                )}
                renderItem={({ item }) => (
                    <MealChecklistItem 
                        meal={item} 
                    />
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyMeals}>
                        <Text style={styles.emptyMealsText}>
                            {isRTL ? 'لا توجد وجبات لهذا اليوم' : 'No meals for this day'}
                        </Text>
                    </View>
                )}
                ListFooterComponent={() => <View style={{ height: verticalScale(100) }} />}
            />

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessageClient}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.actionButtonText}>{t.messageClient}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButtonPrimary, isSendingReminder && { opacity: 0.6 }]}
                    onPress={handleSendReminder}
                    disabled={isSendingReminder}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionButtonGradient}
                    >
                        <Ionicons name="notifications" size={16} color={colors.white} />
                        <Text style={styles.actionButtonTextPrimary}>
                            {isSendingReminder ? (isRTL ? 'جاري...' : 'Sending...') : t.sendReminder}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: verticalScale(16),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    emptyContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: horizontalScale(32),
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: verticalScale(16),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    emptyDesc: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        marginBottom: verticalScale(10)
    },
    headerRTL: {
        flexDirection: 'row-reverse',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerClient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(10),
    },
    headerClientRTL: {
        flexDirection: 'row',
    },
    clientAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    clientAvatarFallback: {
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientAvatarText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.white,
    },
    headerTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerSpacer: {
        width: 40,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: verticalScale(16),
    },
    summaryCard: {
        borderRadius: 20,
        padding: horizontalScale(20),
        overflow: 'hidden',
        position: 'relative',
    },
    decorBlob1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorBlob2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(2,195,205,0.2)',
    },
    summaryContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryInfo: {
        flex: 1,
        gap: verticalScale(8),
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    activeBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.white,
    },
    planName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.white,
        marginVertical: verticalScale(8),
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 6,
        marginVertical: verticalScale(5)
    },
    metaText: {
        fontSize: ScaleFontSize(13),
        color: 'rgba(255,255,255,0.9)',
    },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        padding: horizontalScale(16),
        marginVertical: verticalScale(16),
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(16),
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textSecondary,
        textAlign: 'right'
    },
    reminderLoadingText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    reminderDisabledText: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        textAlign: 'center',
    },
    reminderList: {
        gap: verticalScale(10),
    },
    reminderTimezoneText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        textAlign: 'right',
    },
    reminderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(10),
        borderRadius: 10,
    },
    reminderRowRTL: {
        flexDirection: 'row-reverse',
    },
    reminderMealName: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    reminderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    reminderMetaRTL: {
        flexDirection: 'row-reverse',
    },
    reminderTimeText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    reminderBadge: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(3),
        borderRadius: 10,
    },
    reminderBadgeOn: {
        backgroundColor: `${colors.success}22`,
    },
    reminderBadgeOff: {
        backgroundColor: `${colors.textSecondary}22`,
    },
    reminderBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(24),
    },
    checklistHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    checklistTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: 12,
        padding: horizontalScale(16),
        gap: horizontalScale(12),
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxCompleted: {
        backgroundColor: colors.success,
        borderColor: colors.success,
    },
    mealContent: {
        flex: 1,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: horizontalScale(8),
    },
    mealHeaderRTL: {
        flexDirection: 'row',
    },
    mealName: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    mealNameCompleted: {
        textDecorationLine: 'line-through',
        color: colors.textSecondary,
    },
    completedBadge: {
        backgroundColor: `${colors.success}15`,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    completedBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.success,
    },
    scheduledBadge: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    scheduledBadgeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    mealImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
        backgroundColor: colors.bgSecondary,
    },
    emptyMeals: {
        padding: verticalScale(32),
        alignItems: 'center',
    },
    emptyMealsText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: `${colors.bgPrimary}F5`,
        paddingTop: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(8),
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionButton: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: horizontalScale(6),
    },
    actionButtonText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    actionButtonPrimary: {
        flex: 1,
        height: 44,
        borderRadius: 10,
        overflow: 'hidden',
    },
    actionButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
    },
    actionButtonTextPrimary: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: colors.white,
    },
});

export default ClientProgressView;
