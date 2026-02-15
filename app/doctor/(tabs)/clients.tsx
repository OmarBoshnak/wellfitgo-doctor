import React, { useState, useCallback } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Bell,
    Clock,
    Mail,
    Search,
    X,
    User,
    AlertTriangle,
    CheckCircle,
    UserPlus,
    UserX,
    TrendingDown,
    TrendingUp,
    MessageCircle,
    Sparkles,
    Eye,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/core/utils/scaling';
import {
    useClients,
    formatLastCheckIn,
    type Client,
    type DayFilter,
} from '@/src/hooks/useClients';

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'العملاء' : 'Clients',
    searchPlaceholder: isRTL ? 'ابحث بالاسم أو البريد...' : 'Search by name or email...',
    allClients: isRTL ? 'الكل' : 'All',
    saturday: isRTL ? 'السبت' : 'Sat',
    sunday: isRTL ? 'الأحد' : 'Sun',
    monday: isRTL ? 'الإثنين' : 'Mon',
    tuesday: isRTL ? 'الثلاثاء' : 'Tue',
    wednesday: isRTL ? 'الأربعاء' : 'Wed',
    thursday: isRTL ? 'الخميس' : 'Thu',
    friday: isRTL ? 'الجمعة' : 'Fri',
    today: isRTL ? 'اليوم' : 'Today',
    weightProgress: isRTL ? 'تقدم الوزن' : 'Weight Progress',
    lastCheckIn: isRTL ? 'آخر تسجيل' : 'Last check-in',
    joined: isRTL ? 'انضم' : 'Joined',
    viewProfile: isRTL ? 'عرض الملف' : 'View Profile',
    message: isRTL ? 'رسالة' : 'Message',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    noClients: isRTL ? 'لا يوجد عملاء' : 'No clients',
    noClientsSubtext: isRTL ? 'لم يتم العثور على عملاء لهذا اليوم' : 'No clients found for this day',
    reminderTime: isRTL ? 'وقت التذكير' : 'Reminder time',
    // Progress & Footer
    start: isRTL ? 'البداية' : 'Start',
    current: isRTL ? 'الحالي' : 'Current',
    target: isRTL ? 'الهدف' : 'Target',
    lost: isRTL ? 'فقد' : 'lost',
    gained: isRTL ? 'زاد' : 'gained',
    toGo: isRTL ? 'متبقي' : 'to go',
    newClient: isRTL ? 'جديد' : 'New',
    attention: isRTL ? 'يحتاج متابعة' : 'Needs Attention',
    unreadCount: isRTL
        ? (count: number) => `${count} رسائل`
        : (count: number) => `${count} unread`,
    active: isRTL ? 'نشط' : 'Active',
};


// ============ LOADING & EMPTY STATES ============

/** Skeleton loading card for clients */
function ClientCardSkeleton() {
    return (
        <View style={styles.clientCard}>
            <View style={styles.cardHeader}>
                <View style={[styles.cardHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.skeletonAvatar, styles.skeleton]} />
                    <View style={styles.skeletonInfo}>
                        <View style={[styles.skeletonName, styles.skeleton]} />
                        <View style={[styles.skeletonEmail, styles.skeleton]} />
                    </View>
                </View>
            </View>
            <View style={styles.progressSection}>
                <View style={[styles.skeletonProgress, styles.skeleton]} />
            </View>
        </View>
    );
}

/** Empty state component */
function EmptyState({ filter }: { filter: DayFilter }) {
    return (
        <View style={styles.emptyState}>
            <User size={horizontalScale(48)} color={colors.textSecondary} />
            <Text style={styles.emptyStateText}>{t.noClients}</Text>
            <Text style={styles.emptyStateSubtext}>{t.noClientsSubtext}</Text>
        </View>
    );
}

// ============ MAIN COMPONENT ============

export default function ClientsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // State
    const [activeFilter, setActiveFilter] = useState<DayFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Get current day to highlight "Today" tab
    const getCurrentDay = (): DayFilter => {
        const days: DayFilter[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return days[new Date().getDay()];
    };
    const todayDay = getCurrentDay();

    const formatCheckinTime = (time?: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return time;
        }
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')} ${ampm}`;
    };

    // Fetch clients using hook
    const {
        clients,
        counts,
        isLoading,
        isEmpty,
        sendReminder,
        isSendingReminder,
        refetch,
    } = useClients(activeFilter, searchQuery);

    // ============ HANDLERS ============

    const navigateToProfile = useCallback((clientId: string) => {
        router.push({
            pathname: '/doctor/client-profile',
            params: { id: clientId },
        } as any);
    }, [router]);

    const navigateToMessages = useCallback((clientId: string) => {
        router.push({
            pathname: '/doctor/(tabs)/messages',
            params: { openChatWithClient: clientId },
        } as any);
    }, [router]);

    const handleSendReminder = useCallback(async (client: Client) => {
        // Determine reminder type based on client status
        const reminderType = client.lastCheckInDays && client.lastCheckInDays > 7
            ? "weight"
            : "general";
        await sendReminder(client.id, reminderType);
    }, [sendReminder]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    // ============ FILTER CHIPS (Day-based) ============

    const filterChips: { key: DayFilter; label: string; count: number; isToday: boolean }[] = [
        { key: 'all', label: t.allClients, count: counts.all, isToday: false },
        { key: 'sat', label: t.saturday, count: counts.sat, isToday: todayDay === 'sat' },
        { key: 'sun', label: t.sunday, count: counts.sun, isToday: todayDay === 'sun' },
        { key: 'mon', label: t.monday, count: counts.mon, isToday: todayDay === 'mon' },
        { key: 'tue', label: t.tuesday, count: counts.tue, isToday: todayDay === 'tue' },
        { key: 'wed', label: t.wednesday, count: counts.wed, isToday: todayDay === 'wed' },
        { key: 'thu', label: t.thursday, count: counts.thu, isToday: todayDay === 'thu' },
    ];

    const renderFilterChip = (item: typeof filterChips[0]) => {
        const isActive = activeFilter === item.key;

        if (isActive) {
            return (
                <TouchableOpacity
                    key={item.key}
                    onPress={() => setActiveFilter(item.key)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.filterChipActive}
                    >
                        <Text style={styles.filterChipTextActive}>
                            {item.label} {item.isToday && `• ${t.today}`} {item.count > 0 && `(${item.count})`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, item.isToday && styles.filterChipToday]}
                onPress={() => setActiveFilter(item.key)}
                activeOpacity={0.7}
            >
                <Text style={[styles.filterChipText, item.isToday && styles.filterChipTextToday]}>
                    {item.label} {item.isToday && `• ${t.today}`} {item.count > 0 && `(${item.count})`}
                </Text>
            </TouchableOpacity>
        );
    };

    // ============ CLIENT CARD ============

    const renderClientCard = (client: Client) => {
        const isNewClient = client.daysSinceJoined < 7;
        const needsReminder = (client.lastCheckInDays || 0) > 7;

        return (
            <View
                key={client.id}
                style={styles.clientCard}
            >
                {/* Header */}
                <TouchableOpacity
                    style={[styles.cardHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                    onPress={() => navigateToProfile(client.id)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardHeaderLeft, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <View style={[styles.clientInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <View style={[styles.nameRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                {/* Check-in Day Badge */}
                                <View style={styles.dayBadge}>
                                    <Text style={styles.dayBadgeText}>
                                        {client.weeklyCheckinDay?.toUpperCase() || 'THU'}
                                    </Text>
                                </View>
                                <Text style={styles.clientName}>{client.name}</Text>
                            </View>
                            <Text style={styles.clientEmail}>{client.email}</Text>
                            {client.weeklyCheckinEnabled && client.weeklyCheckinTime && (
                                <View style={styles.reminderRow}>
                                    <Clock size={horizontalScale(14)} color={colors.textSecondary} />
                                    <Text style={styles.reminderText}>
                                        {t.reminderTime} {formatCheckinTime(client.weeklyCheckinTime)}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.avatarContainer}>
                            {client.avatar ? (
                                <Image source={{ uri: client.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarPlaceholderText}>
                                        {client.firstName.charAt(0)}
                                    </Text>
                                </View>
                            )}
                        </View>

                    </View>
                </TouchableOpacity>

                {/* Progress Section */}
                {(() => {
                    // Compute ideal target based on age & height
                    let idealTarget = client.targetWeight;
                    if (client.height && client.height > 0) {
                        const heightM = client.height / 100;
                        let targetBmi = 22.0;

                        // Age-adjusted BMI targets
                        if (client.age) {
                            if (client.age < 30) targetBmi = 21.5;
                            else if (client.age >= 50) targetBmi = 23.0;
                        }

                        // Calculate ideal weight
                        idealTarget = Math.round(targetBmi * heightM * heightM * 10) / 10;
                    }

                    const weightChange = client.startWeight - client.currentWeight;
                    const isLosing = weightChange > 0;

                    // Re-calculate progress based on ideal target
                    const totalToLose = client.startWeight - idealTarget;
                    const actuallyLost = client.startWeight - client.currentWeight;
                    const progressPercentage = totalToLose > 0
                        ? Math.min(Math.round((actuallyLost / totalToLose) * 100), 100)
                        : 0;

                    const progressColor =
                        progressPercentage >= 70 ? colors.success :
                            progressPercentage >= 30 ? colors.warning : colors.error;
                    const changeColor = isLosing ? colors.success : colors.error;
                    const clampedProgress = Math.min(100, Math.max(0, progressPercentage));

                    return (
                        <View style={styles.progressSection}>
                            {/* Header: Label + Percentage */}
                            <View style={[styles.progressHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <View style={[styles.progressPercentageContainer, { backgroundColor: `${progressColor}15` }]}>
                                    <Text style={[styles.progressPercentage, { color: progressColor }]}>
                                        {progressPercentage}%
                                    </Text>
                                </View>
                                <Text style={styles.progressLabel}>{t.weightProgress}</Text>
                            </View>

                            {/* Weight Flow: Start → Current → Target */}
                            <View style={[styles.weightFlowContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={styles.weightItem}>
                                    <Text style={styles.weightItemLabel}>{t.start}</Text>
                                    <Text style={styles.weightItemValue}>{client.startWeight.toFixed(1)}</Text>
                                </View>
                                <View style={styles.weightFlowArrow}>
                                    <Text style={styles.weightArrowText}>{isRTL ? '←' : '→'}</Text>
                                </View>
                                <View style={styles.weightItem}>
                                    <Text style={styles.weightItemLabel}>{t.current}</Text>
                                    <Text style={[styles.weightItemValue, styles.weightItemCurrent, { color: changeColor }]}>
                                        {client.currentWeight.toFixed(1)}
                                    </Text>
                                </View>
                                <View style={styles.weightFlowArrow}>
                                    <Text style={styles.weightArrowText}>{isRTL ? '←' : '→'}</Text>
                                </View>
                                <View style={styles.weightItem}>
                                    <Text style={styles.weightItemLabel}>{t.target}</Text>
                                    <Text style={[styles.weightItemValue, { color: colors.primaryDark }]}>
                                        {idealTarget.toFixed(1)}kg
                                    </Text>
                                    <Text style={styles.weightItemSubtext}>
                                        {Math.abs(client.currentWeight - idealTarget).toFixed(1)}kg {t.toGo}
                                    </Text>
                                </View>
                            </View>

                            {/* Weight Change Badge */}
                            {weightChange !== 0 && (
                                <View style={[styles.weightChangeBadge, {
                                    backgroundColor: `${changeColor}12`,
                                    flexDirection: isRTL ? 'row' : 'row-reverse',
                                    alignSelf: isRTL ? 'flex-end' : 'flex-start',
                                }]}>
                                    {isLosing ? (
                                        <TrendingDown size={horizontalScale(12)} color={changeColor} />
                                    ) : (
                                        <TrendingUp size={horizontalScale(12)} color={changeColor} />
                                    )}
                                    <Text style={[styles.weightChangeText, { color: changeColor }]}>
                                        {isLosing ? '−' : '+'}{Math.abs(weightChange).toFixed(1)} kg {isLosing ? t.lost : t.gained}
                                    </Text>
                                </View>
                            )}

                            {/* Progress Bar with Milestones */}
                            <View style={styles.progressBarWrapper}>
                                <View style={styles.progressBarContainer}>
                                    <LinearGradient
                                        colors={client.progress >= 70 ? gradients.success : client.progress >= 30 ? gradients.warning : gradients.error}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.progressBarFill, { width: `${clampedProgress}%` }]}
                                    />
                                </View>
                                {/* Milestone Markers */}
                                <View style={styles.milestoneContainer}>
                                    {[25, 50, 75].map((milestone) => (
                                        <View
                                            key={milestone}
                                            style={[
                                                styles.milestoneDot,
                                                { left: `${milestone}%` },
                                                clampedProgress >= milestone && styles.milestoneDotReached,
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>
                    );
                })()}

                {/* Footer */}
                <View style={[styles.cardFooter, client.needsAttention && styles.cardFooterWarning]}>
                    {/* Info Badges */}
                    <View style={[styles.infoBadges, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {/* Check-in Badge */}
                        <View style={[styles.infoBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <Text
                                style={[
                                    styles.infoBadgeText,
                                    needsReminder && styles.infoBadgeTextDanger,
                                ]}
                            >
                                {isNewClient ? t.joined : t.lastCheckIn}:{' '}
                                {formatLastCheckIn(
                                    isNewClient ? client.daysSinceJoined : client.lastCheckInDays
                                )}
                            </Text>
                            <Clock size={horizontalScale(12)} color={needsReminder ? colors.error : colors.textSecondary} />
                        </View>

                        {/* New Client Badge */}
                        {isNewClient && (
                            <View style={[styles.newBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Sparkles size={horizontalScale(11)} color={colors.primaryDark} />
                                <Text style={styles.newBadgeText}>{t.newClient}</Text>
                            </View>
                        )}

                        {/* Needs Attention Badge */}
                        {client.needsAttention && (
                            <View style={[styles.attentionBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <AlertTriangle size={horizontalScale(11)} color={colors.warning} />
                                <Text style={styles.attentionBadgeText}>{t.attention}</Text>
                            </View>
                        )}

                        {/* Unread Messages Badge */}
                        {client.unreadMessages > 0 && (
                            <View style={[styles.unreadBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <MessageCircle size={horizontalScale(11)} color={colors.error} />
                                <Text style={styles.unreadBadgeText}>{t.unreadCount(client.unreadMessages)}</Text>
                            </View>
                        )}

                        {/* Active Status */}
                        <View style={[styles.statusActiveBadge, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                            <View style={styles.statusDotGreen} />
                            <Text style={styles.statusActiveText}>{t.active}</Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.actionButtons, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <TouchableOpacity
                            style={styles.viewProfileButton}
                            onPress={() => navigateToProfile(client.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.viewProfileInner, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                <Eye size={horizontalScale(14)} color={colors.primaryDark} />
                                <Text style={styles.viewProfileText}>{t.viewProfile}</Text>
                            </View>
                        </TouchableOpacity>

                        {needsReminder ? (
                            <TouchableOpacity
                                style={styles.reminderButton}
                                onPress={() => handleSendReminder(client)}
                                activeOpacity={0.7}
                                disabled={isSendingReminder}
                            >
                                {isSendingReminder ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Bell size={horizontalScale(16)} color="#FFFFFF" />
                                        <Text style={styles.reminderButtonText}>{t.sendReminder}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => navigateToMessages(client.id)}
                            >
                                <LinearGradient
                                    colors={gradients.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.messageButton}
                                >
                                    <View style={[styles.messageButtonInner, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                                        <Mail size={horizontalScale(14)} color="#FFFFFF" />
                                        <Text style={styles.messageButtonText}>{t.message}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // ============ RENDER ============

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse', paddingTop: insets.top }]}>
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setShowSearch(!showSearch)}
                        activeOpacity={0.7}
                    >
                        <Search size={horizontalScale(22)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.title}>{t.title}</Text>

            </View>

            {/* Search Bar */}
            {showSearch && (
                <View style={styles.searchContainer}>
                    <View style={[styles.searchInputWrapper, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Search size={horizontalScale(18)} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                            placeholder={t.searchPlaceholder}
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={horizontalScale(18)} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.filterScrollContent,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                >
                    {filterChips.map(renderFilterChip)}
                </ScrollView>
            </View>

            {/* Client List */}
            <ScrollView
                style={styles.clientList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.clientListContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primaryDark}
                    />
                }
            >
                {/* Loading State */}
                {isLoading && (
                    <>
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                        <ClientCardSkeleton />
                    </>
                )}

                {/* Empty State */}
                {!isLoading && isEmpty && <EmptyState filter={activeFilter} />}

                {/* Client Cards */}
                {!isLoading && !isEmpty && clients.map(renderClientCard)}
            </ScrollView>
        </SafeAreaView>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Header
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(8),
        backgroundColor: colors.bgSecondary,
    },
    title: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    headerActions: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    headerIconButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Search
    searchContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(8),
    },
    searchInputWrapper: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(10),
        alignItems: 'center',
        gap: horizontalScale(10),
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        paddingVertical: 0,
    },
    // Filter Chips
    filterContainer: {
        paddingBottom: verticalScale(8),
    },
    filterScrollContent: {
        paddingHorizontal: horizontalScale(16),
        gap: horizontalScale(10),
    },
    filterChip: {
        height: verticalScale(36),
        paddingHorizontal: horizontalScale(18),
        borderRadius: horizontalScale(18),
        backgroundColor: colors.bgPrimary,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipActive: {
        height: verticalScale(36),
        paddingHorizontal: horizontalScale(18),
        borderRadius: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterChipText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterChipTextActive: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    filterChipToday: {
        borderColor: colors.primaryDark,
        borderWidth: 2,
    },
    filterChipTextToday: {
        color: colors.primaryDark,
        fontWeight: '600',
    },
    dayBadge: {
        backgroundColor: 'rgba(81, 115, 251, 0.12)',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(6),
    },
    dayBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: colors.primaryDark,
        letterSpacing: 0.5,
    },
    // Client List
    clientList: {
        flex: 1,
    },
    clientListContent: {
        padding: horizontalScale(16),
        paddingBottom: verticalScale(100),
        gap: verticalScale(16),
    },
    // Client Card
    clientCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    clientCardOverdue: {
        backgroundColor: '#FFFBEB',
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
    },
    clientCardAtRisk: {
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    cardHeader: {
        padding: horizontalScale(16),
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardHeaderLeft: {
        flex: 1,
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    avatarContainer: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        borderWidth: 2,
        borderColor: colors.bgPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(24),
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: horizontalScale(24),
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarPlaceholderText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    clientInfo: {
        flex: 1,
    },
    nameRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(2),
    },
    clientName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    clientEmail: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
    },
    reminderRow: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        marginTop: verticalScale(4),
    },
    reminderText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '600',
    },
    // Status Badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(3),
        borderRadius: horizontalScale(4),
        gap: horizontalScale(4),
    },
    statusBadgeText: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Progress Section
    progressSection: {
        marginHorizontal: horizontalScale(16),
        marginBottom: horizontalScale(16),
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(14),
    },
    progressHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(10),
    },
    progressLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressPercentageContainer: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(2),
        borderRadius: horizontalScale(8),
    },
    progressPercentage: {
        fontSize: ScaleFontSize(13),
        fontWeight: '800',
    },
    // Weight Flow
    weightFlowContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(8),
        paddingHorizontal: horizontalScale(4),
    },
    weightItem: {
        alignItems: 'center',
        gap: verticalScale(2),
    },
    weightItemLabel: {
        fontSize: ScaleFontSize(9),
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    weightItemValue: {
        fontSize: ScaleFontSize(15),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    weightItemCurrent: {
        fontSize: ScaleFontSize(16),
    },
    weightItemSubtext: {
        fontSize: ScaleFontSize(9),
        fontWeight: '500',
        color: colors.textSecondary,
        marginTop: verticalScale(1),
    },
    weightFlowArrow: {
        paddingHorizontal: horizontalScale(2),
    },
    weightArrowText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        fontWeight: '300',
    },
    // Weight Change Badge
    weightChangeBadge: {
        alignItems: 'center',
        gap: horizontalScale(4),
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
        marginBottom: verticalScale(6),
    },
    weightChangeText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
    },
    // Progress Bar + Milestones
    progressBarWrapper: {
        position: 'relative',
        marginTop: verticalScale(4),
    },
    progressBarContainer: {
        height: verticalScale(8),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: horizontalScale(4),
    },
    milestoneContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: verticalScale(8),
    },
    milestoneDot: {
        position: 'absolute',
        top: verticalScale(2),
        width: horizontalScale(4),
        height: horizontalScale(4),
        borderRadius: horizontalScale(2),
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginLeft: -horizontalScale(2),
    },
    milestoneDotReached: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    // Card Footer
    cardFooter: {
        padding: horizontalScale(16),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: verticalScale(12),
    },
    cardFooterWarning: {
        backgroundColor: '#FFFBEB',
        borderTopColor: 'rgba(226, 185, 59, 0.3)',
    },
    infoBadges: {
        flexWrap: 'wrap',
        gap: horizontalScale(6),
    },
    infoBadge: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    infoBadgeText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    infoBadgeTextDanger: {
        color: colors.error,
        fontWeight: '700',
    },
    // New Client Badge
    newBadge: {
        backgroundColor: 'rgba(80, 115, 254, 0.1)',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    newBadgeText: {
        fontSize: ScaleFontSize(11),
        color: colors.primaryDark,
        fontWeight: '700',
    },
    // Attention Badge
    attentionBadge: {
        backgroundColor: 'rgba(226, 185, 59, 0.12)',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    attentionBadgeText: {
        fontSize: ScaleFontSize(11),
        color: colors.warning,
        fontWeight: '700',
    },
    // Unread Badge
    unreadBadge: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    unreadBadgeText: {
        fontSize: ScaleFontSize(11),
        color: colors.error,
        fontWeight: '700',
    },
    // Status Badge
    statusActiveBadge: {
        backgroundColor: 'rgba(39, 174, 97, 0.1)',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    statusDotGreen: {
        width: horizontalScale(6),
        height: horizontalScale(6),
        borderRadius: horizontalScale(3),
        backgroundColor: colors.success,
    },
    statusActiveText: {
        fontSize: ScaleFontSize(11),
        color: colors.success,
        fontWeight: '600',
    },
    // Action Buttons
    actionButtons: {
        gap: horizontalScale(10),
    },
    viewProfileButton: {
        flex: 1,
        height: verticalScale(38),
        borderRadius: horizontalScale(10),
        borderWidth: 1.5,
        borderColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewProfileInner: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    viewProfileText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    messageButton: {
        flex: 1,
        height: verticalScale(38),
        width: horizontalScale(130),
        borderRadius: horizontalScale(10),
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageButtonInner: {
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    messageButtonText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    reminderButton: {
        flex: 1,
        flexDirection: 'row',
        height: verticalScale(38),
        borderRadius: horizontalScale(10),
        backgroundColor: colors.warning,
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(6),
    },
    reminderButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // Loading Skeleton
    skeleton: {
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonAvatar: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
    },
    skeletonInfo: {
        flex: 1,
        marginHorizontal: horizontalScale(12),
        gap: verticalScale(8),
    },
    skeletonName: {
        width: '60%',
        height: verticalScale(16),
    },
    skeletonEmail: {
        width: '80%',
        height: verticalScale(12),
    },
    skeletonProgress: {
        width: '100%',
        height: verticalScale(60),
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyStateText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginTop: verticalScale(16),
    },
    emptyStateSubtext: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(4),
    },
});
