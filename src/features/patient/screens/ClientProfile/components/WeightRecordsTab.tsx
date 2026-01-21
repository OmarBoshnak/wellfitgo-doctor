/**
 * Weight Records Tab - Using Supabase for Heavy Reads
 *
 * This component displays weight history with pagination.
 * Shows 20 records at a time with "Load More" capability.
 *
 * USES SUPABASE for reduced Convex bandwidth.
 */

import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/core/utils/scaling';
import { useWeightLogs } from '@/src/lib/hooks';
import {
    Calendar,
    Minus,
    TrendingDown,
    TrendingUp,
} from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ============ TRANSLATIONS ============
const t = {
    weightHistory: isRTL ? 'تسجيلات الوزن' : 'Weight Records',
    currentWeight: isRTL ? 'الوزن الحالي' : 'Current Weight',
    lastUpdated: isRTL ? 'آخر تحديث' : 'Last updated',
    historyLog: isRTL ? 'سجل التسجيلات' : 'History Log',
    noRecords: isRTL ? 'لا توجد تسجيلات بعد' : 'No records yet',
    stable: isRTL ? 'ثابت' : 'Stable',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    loadMore: isRTL ? 'عرض المزيد' : 'Load More',
    kg: 'kg',
};

// ============ PROPS ============
interface WeightRecordsTabProps {
    clientId: string;
}

// ============ WEIGHT RECORD ROW ============
interface WeightLogEntry {
    id: string;
    weight: number;
    unit: 'kg' | 'lbs';
    date: string;
    feeling?: string;
    created_at: string;
}

interface WeightRecordRowProps {
    record: WeightLogEntry;
    previousWeight?: number;
    isLatest: boolean;
}

function formatDateArabic(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateEnglish(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getWeekLabel(dateStr: string): { en: string; ar: string } {
    const date = new Date(dateStr);
    const weekNum = Math.ceil((date.getDate()) / 7);
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return {
        en: `Week ${weekNum} – ${monthsEn[date.getMonth()]}`,
        ar: `الأسبوع ${weekNum} – ${monthsAr[date.getMonth()]}`,
    };
}

function WeightRecordRow({ record, previousWeight, isLatest }: WeightRecordRowProps) {
    const change = previousWeight ? record.weight - previousWeight : 0;
    const isDown = change < -0.1;
    const isUp = change > 0.1;
    const isStable = !isDown && !isUp;

    const weekLabel = getWeekLabel(record.date);
    const dateLabel = isRTL ? formatDateArabic(record.date) : formatDateEnglish(record.date);

    return (
        <TouchableOpacity style={styles.recordRow} activeOpacity={0.7}>
            {/* Icon */}
            <View style={[
                styles.recordIcon,
                isLatest ? styles.recordIconActive : styles.recordIconInactive
            ]}>
                <Calendar
                    size={horizontalScale(20)}
                    color={isLatest ? colors.primaryDark : '#94A3B8'}
                />
            </View>

            {/* Info */}
            <View style={styles.recordInfo}>
                <Text style={styles.recordWeek}>
                    {isRTL ? weekLabel.ar : weekLabel.en}
                </Text>
                <Text style={styles.recordDate}>{dateLabel}</Text>
            </View>

            {/* Weight & Change */}
            <View style={styles.recordWeight}>
                <Text style={styles.recordWeightText}>
                    {record.weight} {t.kg}
                </Text>
                <View style={[
                    styles.changeContainer,
                    isDown && styles.changeDown,
                    isUp && styles.changeUp,
                    isStable && styles.changeStable,
                ]}>
                    {isDown && (
                        <>
                            <TrendingDown size={horizontalScale(12)} color="#27AE61" />
                            <Text style={styles.changeTextDown}>{Math.abs(change).toFixed(1)}kg</Text>
                        </>
                    )}
                    {isUp && (
                        <>
                            <TrendingUp size={horizontalScale(12)} color="#EB5757" />
                            <Text style={styles.changeTextUp}>{Math.abs(change).toFixed(1)}kg</Text>
                        </>
                    )}
                    {isStable && (
                        <>
                            <Minus size={horizontalScale(12)} color="#94A3B8" />
                            <Text style={styles.changeTextStable}>{t.stable}</Text>
                        </>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ============ LOADING STATE ============
function LoadingState() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
            <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
    );
}

// ============ EMPTY STATE ============
function EmptyState() {
    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t.noRecords}</Text>
        </View>
    );
}

// ============ LOAD MORE BUTTON ============
function LoadMoreButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
    return (
        <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color={colors.primaryDark} />
            ) : (
                <Text style={styles.loadMoreText}>{t.loadMore}</Text>
            )}
        </TouchableOpacity>
    );
}

// ============ MAIN COMPONENT ============
export function WeightRecordsTab({ clientId }: WeightRecordsTabProps) {
    // Use Supabase hook with pagination
    const { logs, isLoading, hasMore, loadMore, totalCount } = useWeightLogs(clientId);

    // Loading state (initial)
    if (isLoading && logs.length === 0) {
        return <LoadingState />;
    }

    // Empty state
    if (!isLoading && logs.length === 0) {
        return <EmptyState />;
    }

    const currentWeight = logs[0]?.weight || 0;
    const previousWeight = logs[1]?.weight;
    const currentWeightChange = previousWeight ? currentWeight - previousWeight : 0;
    const lastUpdated = logs[0] ? (isRTL ? formatDateArabic(logs[0].date) : formatDateEnglish(logs[0].date)) : '';

    const isWeightDown = currentWeightChange < 0;

    const renderItem = ({ item, index }: { item: WeightLogEntry; index: number }) => (
        <WeightRecordRow
            record={item}
            previousWeight={logs[index + 1]?.weight}
            isLatest={index === 0}
        />
    );

    const renderFooter = () => {
        if (!hasMore) return null;
        return <LoadMoreButton onPress={loadMore} loading={isLoading} />;
    };

    return (
        <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            ListHeaderComponent={
                <>
                    {/* Current Weight Card */}
                    <View style={styles.currentWeightCard}>
                        <View style={styles.decorativeBlur} />
                        <View style={styles.currentWeightContent}>
                            <View style={styles.currentWeightHeader}>
                                <Text style={styles.currentWeightLabel}>{t.currentWeight}</Text>
                                {currentWeightChange !== 0 && (
                                    <View style={[
                                        styles.changeBadge,
                                        isWeightDown ? styles.changeBadgeDown : styles.changeBadgeUp
                                    ]}>
                                        {isWeightDown ? (
                                            <TrendingDown size={horizontalScale(14)} color="#27AE61" />
                                        ) : (
                                            <TrendingUp size={horizontalScale(14)} color="#EB5757" />
                                        )}
                                        <Text style={[
                                            styles.changeBadgeText,
                                            isWeightDown ? styles.changeBadgeTextDown : styles.changeBadgeTextUp
                                        ]}>
                                            {isWeightDown ? '' : '+'}{currentWeightChange.toFixed(1)} kg
                                        </Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.weightValueRow}>
                                <Text style={styles.weightValue}>{currentWeight}</Text>
                                <Text style={styles.weightUnit}>{t.kg}</Text>
                            </View>
                            {lastUpdated && (
                                <Text style={styles.lastUpdated}>
                                    {t.lastUpdated}: {lastUpdated}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Section Title */}
                    <Text style={styles.sectionTitle}>{t.historyLog}</Text>
                </>
            }
            ListFooterComponent={renderFooter}
            onEndReached={() => {
                if (hasMore && !isLoading) {
                    loadMore();
                }
            }}
            onEndReachedThreshold={0.5}
        />
    );
}

// ============ STYLES ============
const styles = StyleSheet.create({
    contentContainer: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(80),
        gap: verticalScale(12),
    },
    // Loading & Empty
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
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
        paddingVertical: verticalScale(60),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    // Current Weight Card
    currentWeightCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden',
        position: 'relative',
    },
    decorativeBlur: {
        position: 'absolute',
        top: -horizontalScale(24),
        right: -horizontalScale(24),
        width: horizontalScale(128),
        height: horizontalScale(128),
        borderRadius: horizontalScale(64),
        backgroundColor: `${colors.primaryDark}10`,
    },
    currentWeightContent: {
        position: 'relative',
        zIndex: 10,
    },
    currentWeightHeader: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: verticalScale(8),
    },
    currentWeightLabel: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(4),
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(20),
    },
    changeBadgeDown: {
        backgroundColor: 'rgba(39, 174, 97, 0.1)',
    },
    changeBadgeUp: {
        backgroundColor: 'rgba(235, 87, 87, 0.1)',
    },
    changeBadgeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
    },
    changeBadgeTextDown: {
        color: '#27AE61',
    },
    changeBadgeTextUp: {
        color: '#EB5757',
    },
    weightValueRow: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'baseline',
        gap: horizontalScale(8),
        marginBottom: verticalScale(8),
    },
    weightValue: {
        fontSize: ScaleFontSize(36),
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -1,
    },
    weightUnit: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    lastUpdated: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    // Section Title
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
        textAlign: isRTL ? 'right' : 'left',
    },
    // Record Row
    recordRow: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        padding: horizontalScale(16),
        borderRadius: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        gap: horizontalScale(16),
    },
    recordIcon: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordIconActive: {
        backgroundColor: `${colors.primaryDark}15`,
    },
    recordIconInactive: {
        backgroundColor: '#F1F5F9',
    },
    recordInfo: {
        flex: 1,
    },
    recordWeek: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: isRTL ? 'right' : 'left',
    },
    recordDate: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(2),
        textAlign: isRTL ? 'right' : 'left',
    },
    recordWeight: {
        alignItems: isRTL ? 'flex-start' : 'flex-end',
    },
    recordWeightText: {
        fontSize: ScaleFontSize(15),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(2),
        marginTop: verticalScale(2),
    },
    changeDown: {},
    changeUp: {},
    changeStable: {},
    changeTextDown: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#27AE61',
    },
    changeTextUp: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#EB5757',
    },
    changeTextStable: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#94A3B8',
    },
    // Load More Button
    loadMoreButton: {
        backgroundColor: colors.bgPrimary,
        paddingVertical: verticalScale(12),
        paddingHorizontal: horizontalScale(24),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        marginTop: verticalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
    },
    loadMoreText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
});
