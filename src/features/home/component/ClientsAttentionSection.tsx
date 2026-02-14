import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Dimensions,
    Animated as RNAnimated,
} from 'react-native';
import { isRTL, doctorTranslations as t, translateName, attentionTranslations as at } from '@/src/i18n';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { colors } from '@/src/core/constants/Theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = horizontalScale(12);
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

// ============ TYPES ============
export interface Client {
    id: string;
    name: string;
    avatar: string | null;
    status: string;
    statusType: 'critical' | 'warning' | 'info';
    lastActive?: string;
    feeling?: string;
    // Attention metadata
    attentionType: 'late_message' | 'weight_gain' | 'missing_checkin';
    attentionReason?: 'inactive' | 'weight_no_diet' | 'late_message';
    weightChange?: number;
    lastMessageTime?: number;
    daysSinceCheckin?: number | null;
    daysSinceActive?: number;
    pendingMessageCount?: number;
}

export interface ClientsAttentionSectionProps {
    clients: Client[];
    isLoading?: boolean;
    isEmpty?: boolean;
    error?: Error;
    onViewAll: () => void;
    onClientPress: (clientId: string) => void;
    onMessagePress: (clientId: string) => void;
    onDismiss?: (clientId: string) => void;
    onRetry?: () => void;
}

// ============ CATEGORY CONFIG ============
const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bgColor: string; label: string }> = {
    inactive: {
        emoji: '🔴',
        color: '#B91C1C',
        bgColor: '#FEE2E2',
        label: isRTL ? 'غير نشط' : 'Inactive',
    },
    weight_no_diet: {
        emoji: '🟠',
        color: '#C2410C',
        bgColor: '#FFEDD5',
        label: isRTL ? 'بدون خطة' : 'No Diet Plan',
    },
    late_message: {
        emoji: '🟡',
        color: '#92400E',
        bgColor: '#FEF3C7',
        label: isRTL ? 'رسالة متأخرة' : 'Late Message',
    },
};

// ============ HELPER FUNCTIONS ============
function getCategoryConfig(client: Client) {
    const reason = client.attentionReason || 'inactive';
    return CATEGORY_CONFIG[reason] || CATEGORY_CONFIG.inactive;
}

function formatDateOnly(value?: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============ SUB-COMPONENTS ============

/**
 * Skeleton loader for the attention section
 */
function SkeletonLoader() {
    return (
        <View style={styles.sectionCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonViewAll} />
            </View>
            <View style={styles.skeletonCardBody}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonContent}>
                    <View style={styles.skeletonName} />
                    <View style={styles.skeletonStatus} />
                </View>
            </View>
        </View>
    );
}

/**
 * Empty state when all clients are on track
 */
function EmptyState() {
    return (
        <View style={[styles.sectionCard, styles.emptyCard]}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>{at.allClientsOnTrack}</Text>
            <Text style={styles.emptySubtitle}>{at.noClientsNeedAttention}</Text>
        </View>
    );
}

/**
 * Error state with retry button
 */
function ErrorState({ onRetry }: { onRetry?: () => void }) {
    return (
        <TouchableOpacity
            style={[styles.sectionCard, styles.errorCard]}
            onPress={onRetry}
            activeOpacity={0.7}
        >
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>{at.errorLoadingClients}</Text>
            <Text style={styles.errorSubtitle}>{at.tapToRetry}</Text>
        </TouchableOpacity>
    );
}

/**
 * Pagination dots
 */
function PaginationDots({ total, activeIndex }: { total: number; activeIndex: number }) {
    if (total <= 1) return null;
    return (
        <View style={styles.dotsContainer}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={[
                        styles.dot,
                        i === activeIndex ? styles.dotActive : styles.dotInactive,
                    ]}
                />
            ))}
        </View>
    );
}

/**
 * Single attention card rendered inside the FlatList
 */
function AttentionCard({
    client,
    onPress,
    onMessage,
    onDone,
}: {
    client: Client;
    onPress: () => void;
    onMessage: () => void;
    onDone: () => void;
}) {
    const config = getCategoryConfig(client);
    const lastActiveDate = formatDateOnly(client.lastActive);
    const fadeAnim = useRef(new RNAnimated.Value(1)).current;

    const handleDone = () => {
        RNAnimated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            onDone();
        });
    };

    return (
        <RNAnimated.View style={[styles.cardWrapper, { width: CARD_WIDTH, opacity: fadeAnim }]}>
            <TouchableOpacity
                style={styles.attentionCard}
                onPress={onPress}
                activeOpacity={0.85}
            >
                {/* Category badge */}
                <View style={[styles.categoryBadge, { backgroundColor: config.bgColor }, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.categoryEmoji}>{config.emoji}</Text>
                    <Text style={[styles.categoryLabel, { color: config.color }]}>{config.label}</Text>
                </View>

                {/* Client info row */}
                <View style={[styles.clientInfoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {client.avatar ? (
                        <Image
                            source={{ uri: client.avatar }}
                            style={styles.clientAvatar}
                        />
                    ) : (
                        <View style={[styles.clientAvatar, styles.avatarFallback]}>
                            <Text style={styles.avatarFallbackText}>
                                {client.name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}

                    <View style={[styles.clientDetails, isRTL ? { marginRight: horizontalScale(12) } : { marginLeft: horizontalScale(12) }]}>
                        <Text style={[styles.clientName, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {translateName(client.name)}
                        </Text>
                        {lastActiveDate ? (
                            <Text style={[styles.lastActiveText, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.lastActive} {lastActiveDate}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* Action buttons */}
                <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                        style={styles.doneButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDone();
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.doneButtonText}>{at.markDone}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.messageButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onMessage();
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.messageButtonText}>{t.message}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </RNAnimated.View>
    );
}

// ============ MAIN COMPONENT ============
export function ClientsAttentionSection({
    clients,
    isLoading = false,
    isEmpty = false,
    error,
    onViewAll,
    onClientPress,
    onMessagePress,
    onDismiss,
    onRetry
}: ClientsAttentionSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
    const flatListRef = useRef<FlatList>(null);

    // Filter out dismissed clients
    const visibleClients = clients.filter(c => !dismissedIds.has(c.id));

    const handleDismiss = useCallback((clientId: string) => {
        setDismissedIds(prev => {
            const next = new Set(prev);
            next.add(clientId);
            return next;
        });
        onDismiss?.(clientId);
    }, [onDismiss]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: any[] }) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index ?? 0);
        }
    }).current;

    const viewabilityConfig = useRef({
        viewAreaCoveragePercentThreshold: 50,
    }).current;

    // Loading state
    if (isLoading) {
        return <SkeletonLoader />;
    }

    // Error state
    if (error) {
        return <ErrorState onRetry={onRetry} />;
    }

    // Empty state
    if (isEmpty || visibleClients.length === 0) {
        return <EmptyState />;
    }

    return (
        <View style={styles.sectionCard}>
            {/* Header */}
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.needsAttention}</Text>
                <TouchableOpacity onPress={onViewAll}>
                    <Text style={styles.viewAllText}>{t.viewAll}</Text>
                </TouchableOpacity>
            </View>

            {/* Swipeable FlatList */}
            <FlatList
                ref={flatListRef}
                data={visibleClients}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH}
                decelerationRate="fast"
                contentContainerStyle={styles.flatListContent}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <AttentionCard
                        client={item}
                        onPress={() => onClientPress(item.id)}
                        onMessage={() => onMessagePress(item.id)}
                        onDone={() => handleDismiss(item.id)}
                    />
                )}
            />

            {/* Pagination dots */}
            <PaginationDots total={visibleClients.length} activeIndex={activeIndex} />

        </View>
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    sectionCard: {
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
    sectionHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    viewAllText: {
        fontSize: ScaleFontSize(14),
        color: colors.success,
        fontWeight: '500',
    },
    // FlatList
    flatListContent: {
        paddingHorizontal: 0,
    },
    cardWrapper: {
        paddingHorizontal: horizontalScale(2),
    },
    // Attention card
    attentionCard: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(14),
        padding: horizontalScale(16),
        width: '90%',
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
        marginBottom: verticalScale(12),
        gap: horizontalScale(6),
    },
    categoryEmoji: {
        fontSize: ScaleFontSize(12),
    },
    categoryLabel: {
        fontSize: ScaleFontSize(12),
        fontWeight: '600',
    },
    // Client info
    clientInfoRow: {
        alignItems: 'center',
        marginBottom: verticalScale(14),
    },
    clientAvatar: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
    },
    avatarFallback: {
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarFallbackText: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    clientDetails: {
        flex: 1,
    },
    clientName: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(3),
    },
    statusDescription: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        marginBottom: verticalScale(2),
    },
    lastActiveText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
    },
    // Action buttons
    actionRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: horizontalScale(10),
    },
    doneButton: {
        flex: 1,
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(10),
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: '#166534',
    },
    messageButton: {
        flex: 1,
        paddingVertical: verticalScale(10),
        borderRadius: horizontalScale(10),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgPrimary,
    },
    messageButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    // Pagination dots
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(12),
        gap: horizontalScale(6),
    },
    dot: {
        width: horizontalScale(8),
        height: horizontalScale(8),
        borderRadius: horizontalScale(4),
    },
    dotActive: {
        backgroundColor: colors.success,
        width: horizontalScale(20),
    },
    dotInactive: {
        backgroundColor: '#D1D5DB',
    },
    swipeHint: {
        textAlign: 'center',
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        marginTop: verticalScale(6),
    },
    // Skeleton styles
    skeletonTitle: {
        width: horizontalScale(140),
        height: verticalScale(20),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonViewAll: {
        width: horizontalScale(60),
        height: verticalScale(16),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
    },
    skeletonCardBody: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        padding: horizontalScale(16),
        borderRadius: horizontalScale(12),
        backgroundColor: colors.bgSecondary,
    },
    skeletonAvatar: {
        width: horizontalScale(48),
        height: horizontalScale(48),
        borderRadius: horizontalScale(24),
        backgroundColor: '#E5E7EB',
        marginHorizontal: horizontalScale(12),
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonName: {
        width: horizontalScale(100),
        height: verticalScale(14),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        marginBottom: verticalScale(8),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    skeletonStatus: {
        width: horizontalScale(150),
        height: verticalScale(12),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(4),
        alignSelf: isRTL ? 'flex-start' : 'flex-end',
    },
    // Empty state styles
    emptyCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(32),
        backgroundColor: '#DCFCE7',
    },
    emptyEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    emptyTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#166534',
        marginBottom: verticalScale(4),
    },
    emptySubtitle: {
        fontSize: ScaleFontSize(14),
        color: '#15803D',
    },
    // Error state styles
    errorCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(32),
        backgroundColor: '#FEF2F2',
    },
    errorEmoji: {
        fontSize: ScaleFontSize(32),
        marginBottom: verticalScale(8),
    },
    errorTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#991B1B',
        marginBottom: verticalScale(4),
    },
    errorSubtitle: {
        fontSize: ScaleFontSize(14),
        color: '#B91C1C',
    },
});
