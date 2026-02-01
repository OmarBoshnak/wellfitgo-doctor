import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import clientsService from '@/src/shared/services/clients.service';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityItem, ActivityTimelineItem } from './components/ActivityTimelineItem';
import { styles } from './styles';
import { t } from './translations';

interface ActivityHistoryScreenProps {
    clientId?: string;
}

export default function ActivityHistoryScreen({ clientId: propClientId }: ActivityHistoryScreenProps) {
    const router = useRouter();
    const params = useLocalSearchParams<{ clientId: string }>();
    const insets = useSafeAreaInsets();

    // Use prop or route param
    const clientId = propClientId || params.clientId;

    // Local state for activities
    const [activities, setActivities] = useState<ActivityItem[] | undefined>(undefined);

    const activityTitles: Record<ActivityItem['type'], string> = {
        weight: t.weightLogged,
        meals: t.mealCompleted,
        message: t.messageSent,
        plan: t.planAssigned,
        missed: t.missedMeal,
        water: t.waterLogged,
    };

    const activityColors: Record<ActivityItem['type'], string> = {
        weight: '#60A5FA',
        meals: '#27AE61',
        message: '#5073FE',
        plan: '#8B5CF6',
        missed: '#FBBF24',
        water: '#27AE61',
    };

    const formatTime = (value: string | number) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const formatDate = (value: string | number) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    const parseTimestamp = (value?: string | number) => {
        if (!value) return Date.now();
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
    };

    const mapActivity = (activity: any, index: number): ActivityItem => {
        const rawTimestamp = activity.timestamp ?? activity.createdAt ?? activity.date ?? Date.now();
        const timestamp = parseTimestamp(rawTimestamp);
        const type = (activity.type as ActivityItem['type']) ?? 'message';
        const actor = (activity.actor === 'doctor' ? 'coach' : activity.actor) as ActivityItem['actor'] || 'system';
        return {
            id: activity.id ?? activity._id ?? `${clientId || 'client'}-activity-${index}`,
            type,
            color: activity.color ?? activityColors[type],
            title: activity.title ?? activityTitles[type],
            description: activity.description ?? activity.subtext ?? activity.details ?? '',
            time: activity.time ?? formatTime(timestamp),
            date: activity.date ?? formatDate(timestamp),
            actor,
            actorName: activity.actorName ?? activity.actor?.name ?? '',
            timestamp,
        };
    };

    // Fetch activities from backend
    useEffect(() => {
        let isMounted = true;

        const fetchActivities = async () => {
            if (!clientId) {
                setActivities([]);
                return;
            }

            setActivities(undefined);
            const data = await clientsService.getClientActivity(clientId, 50);

            if (!isMounted) return;

            const mapped = (data || []).map(mapActivity).sort((a, b) => b.timestamp - a.timestamp);
            setActivities(mapped);
        };

        fetchActivities();

        return () => {
            isMounted = false;
        };
    }, [clientId]);

    // Memoize activities to prevent scroll reset
    const memoizedActivities = useMemo(
        () => (activities ?? []) as ActivityItem[],
        [activities]
    );
    const activitiesLength = memoizedActivities.length;

    const isLoading = activities === undefined;

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Memoized key extractor - CRITICAL for preventing scroll reset
    const keyExtractor = useCallback((item: ActivityItem) => item.id, []);

    // Memoized render item - CRITICAL for preventing scroll reset
    const renderItem = useCallback(
        ({ item, index }: { item: ActivityItem; index: number }) => (
            <ActivityTimelineItem
                activity={item}
                isFirst={index === 0}
                isLast={index === activitiesLength - 1}
            />
        ),
        [activitiesLength]
    );

    // Memoized empty component
    const ListEmptyComponent = useMemo(
        () => (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>{t.noActivities}</Text>
            </View>
        ),
        []
    );

    // Loading state
    if (isLoading) {
        return (
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <View style={[
                        styles.headerContent,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' }
                    ]}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                        >
                            <Ionicons
                                name={isRTL ? "chevron-back" : "chevron-back"}
                                size={24}
                                color={colors.textPrimary}
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t.screenTitle}</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                </View>

                {/* Loading indicator */}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Sticky Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={[
                    styles.headerContent,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' }
                ]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Ionicons
                            name={isRTL ? "chevron-back" : "chevron-forward"}
                            size={24}
                            color={colors.textPrimary}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t.screenTitle}</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {/* Timeline FlatList */}
            <FlatList
                data={memoizedActivities}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmptyComponent}
                initialNumToRender={20}
                maxToRenderPerBatch={15}
                windowSize={21}
                removeClippedSubviews={false}
                extraData={activitiesLength}
            />
        </View>
    );
}
