/**
 * Coach Activity History Page
 * Full paginated activity feed for the doctor's dashboard "See All" action
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { dashboardService, RecentActivityItem } from '@/src/shared/services/dashboard.service';

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'سجل النشاط' : 'Activity History',
    noActivities: isRTL ? 'لا يوجد نشاط بعد' : 'No activities yet',
    loadMore: isRTL ? 'تحميل المزيد' : 'Load More',
    errorLoading: isRTL ? 'خطأ في التحميل' : 'Error loading activities',
    tapToRetry: isRTL ? 'اضغط للمحاولة مرة أخرى' : 'Tap to retry',
};

// ============ TYPES ============
interface MappedActivity {
    id: string;
    text: string;
    time: string;
    type: string;
    clientId: string;
    clientName: string;
    clientAvatar: string;
}

// ============ HELPERS ============
function getActivityIcon(type: string): { name: string; color: string; bgColor: string } {
    switch (type) {
        case 'weight_log':
            return { name: 'scale', color: '#3B82F6', bgColor: '#DBEAFE' };
        case 'message':
            return { name: 'chatbubble', color: '#8B5CF6', bgColor: '#EDE9FE' };
        case 'meal_completed':
            return { name: 'restaurant', color: '#16A34A', bgColor: '#DCFCE7' };
        case 'plan_published':
            return { name: 'document-text', color: '#F59E0B', bgColor: '#FEF3C7' };
        case 'new_client':
            return { name: 'person-add', color: '#EC4899', bgColor: '#FCE7F3' };
        default:
            return { name: 'checkmark-circle', color: '#6B7280', bgColor: '#F3F4F6' };
    }
}

function formatRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} د` : `${diffMins}m ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} س` : `${diffHours}h ago`;
    return isRTL ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
}

function mapActivity(activity: RecentActivityItem): MappedActivity {
    let type = 'checkin';
    if (activity.type === 'weight_logged') type = 'weight_log';
    else if (activity.type === 'message_sent' || activity.type === 'message') type = 'message';
    else if (activity.type === 'meal_completed') type = 'meal_completed';
    else if (activity.type === 'plan_assigned') type = 'plan_published';
    else if (activity.type === 'client_assigned') type = 'new_client';

    return {
        id: activity.id,
        text: activity.description,
        time: formatRelativeTime(activity.timestamp),
        type,
        clientId: activity.clientId,
        clientName: activity.clientName,
        clientAvatar: activity.clientAvatar || `https://i.pravatar.cc/150?u=${activity.clientId}`,
    };
}

// ============ COMPONENT ============
export default function CoachActivityHistoryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const PAGE_SIZE = 20;

    const [activities, setActivities] = useState<MappedActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchActivities = useCallback(async (skip: number = 0, append: boolean = false) => {
        try {
            if (!append) setIsLoading(true);
            else setIsLoadingMore(true);

            setError(null);

            const data = await dashboardService.getRecentActivity(PAGE_SIZE);
            const mapped = data.map(mapActivity);

            if (append) {
                setActivities(prev => [...prev, ...mapped]);
            } else {
                setActivities(mapped);
            }

            setHasMore(mapped.length >= PAGE_SIZE);
        } catch (err) {
            console.error('[CoachActivityHistory] Error:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchActivities(0, false);
        setRefreshing(false);
    }, [fetchActivities]);

    const handleLoadMore = useCallback(() => {
        if (!isLoadingMore && hasMore) {
            fetchActivities(activities.length, true);
        }
    }, [isLoadingMore, hasMore, activities.length, fetchActivities]);

    const handleActivityPress = (activity: MappedActivity) => {
        if (activity.type === 'message') {
            router.push({
                pathname: '/doctor/messages' as any,
                params: activity.clientId ? { openChatWithClient: activity.clientId } : undefined,
            });
        } else if (activity.clientId) {
            router.push({
                pathname: '/doctor/client-profile' as any,
                params: { id: activity.clientId },
            });
        }
    };

    // ============ RENDER ITEM ============
    const renderItem = ({ item }: { item: MappedActivity }) => {
        const icon = getActivityIcon(item.type);
        return (
            <TouchableOpacity
                style={[styles.activityRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => handleActivityPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
                    <Ionicons name={icon.name as any} size={horizontalScale(18)} color={icon.color} />
                </View>
                <View style={[styles.activityContent, isRTL ? { marginRight: horizontalScale(12) } : { marginLeft: horizontalScale(12) }]}>
                    <Text style={[styles.activityText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                        {item.text}
                    </Text>
                    <View style={[styles.activityMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {item.clientAvatar ? (
                            <Image source={{ uri: item.clientAvatar }} style={styles.miniAvatar} />
                        ) : null}
                        <Text style={styles.clientName}>{item.clientName}</Text>
                        <Text style={styles.timeText}> • {item.time}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFooter = () => {
        if (!isLoadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        if (error) {
            return (
                <TouchableOpacity style={styles.emptyContainer} onPress={() => fetchActivities()}>
                    <Text style={styles.emptyEmoji}>⚠️</Text>
                    <Text style={styles.emptyTitle}>{t.errorLoading}</Text>
                    <Text style={styles.emptySubtitle}>{t.tapToRetry}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📋</Text>
                <Text style={styles.emptyTitle}>{t.noActivities}</Text>
            </View>
        );
    };

    const BackIcon = isRTL ? ChevronRight : ChevronLeft;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <BackIcon size={horizontalScale(24)} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <View style={styles.backButton} />
            </View>

            {/* Activity List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={activities}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.3}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + verticalScale(16) },
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: horizontalScale(16),
    },
    activityRow: {
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(14),
        marginBottom: verticalScale(8),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(1) },
        shadowOpacity: 0.04,
        shadowRadius: horizontalScale(4),
        elevation: 1,
    },
    iconContainer: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        fontWeight: '500',
        marginBottom: verticalScale(4),
    },
    activityMeta: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    miniAvatar: {
        width: horizontalScale(18),
        height: horizontalScale(18),
        borderRadius: horizontalScale(9),
    },
    clientName: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    timeText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    footerLoader: {
        paddingVertical: verticalScale(16),
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(40),
        marginBottom: verticalScale(12),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(4),
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});
