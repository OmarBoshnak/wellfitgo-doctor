/**
 * DailyActivityChart Component
 * @description Bar chart showing daily activity with totals
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { DailyActivity } from '@/src/features/analytics/types/analytics.types';

interface DailyActivityChartProps {
    data: DailyActivity[];
}

// Translations
const t = {
    dailyActivity: isRTL ? 'النشاط اليومي' : 'Daily Activity',
    messages: isRTL ? 'الرسائل' : 'Messages',
    plans: isRTL ? 'الخطط' : 'Plans',
    checkIns: isRTL ? 'التسجيلات' : 'Check-ins',
};

// Day labels for chart (last 7 days dynamic)
const getDayLabel = (dateStr: string): string => {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    const dayLabelsEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayLabelsAr = ['س', 'أح', 'إث', 'ث', 'أر', 'خ', 'ج'];
    return isRTL ? dayLabelsAr[dayIndex] : dayLabelsEn[dayIndex];
};

export const DailyActivityChart: React.FC<DailyActivityChartProps> = ({
    data,
}) => {
    if (!data || data.length === 0) {
        return null;
    }

    // Calculate bar chart max values
    const maxMessages = useMemo(() => {
        if (!data?.length) return 1;
        return Math.max(...data.map(d => d.messages), 1);
    }, [data]);

    const maxPlans = useMemo(() => {
        if (!data?.length) return 1;
        return Math.max(...data.map(d => d.plans), 1);
    }, [data]);

    const maxCheckIns = useMemo(() => {
        if (!data?.length) return 1;
        return Math.max(...data.map(d => d.checkIns), 1);
    }, [data]);

    // Calculate totals for daily activity
    const activityTotals = useMemo(() => {
        if (!data?.length) return { messages: 0, plans: 0, checkIns: 0 };
        return data.reduce(
            (acc, day) => ({
                messages: acc.messages + day.messages,
                plans: acc.plans + day.plans,
                checkIns: acc.checkIns + day.checkIns,
            }),
            { messages: 0, plans: 0, checkIns: 0 }
        );
    }, [data]);

    return (
        <View style={styles.chartCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t.dailyActivity}
            </Text>

            <View style={[styles.barChartContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {data.map((day, index) => (
                    <View key={day.date} style={styles.barColumn}>
                        <View style={styles.barsWrapper}>
                            <View
                                style={[
                                    styles.bar,
                                    styles.barMessages,
                                    { height: `${(day.messages / maxMessages) * 60}%` },
                                ]}
                            />
                            <View
                                style={[
                                    styles.bar,
                                    styles.barPlans,
                                    { height: `${(day.plans / Math.max(maxPlans, 1)) * 50}%` },
                                ]}
                            />
                            <View
                                style={[
                                    styles.bar,
                                    styles.barCheckIns,
                                    { height: `${(day.checkIns / Math.max(maxCheckIns, 1)) * 50}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.barLabel}>{getDayLabel(day.date)}</Text>
                    </View>
                ))}
            </View>

            {/* Activity Totals */}
            <View style={[styles.activityTotals, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.activityDot, { backgroundColor: '#3B82F6' }]} />
                    <View>
                        <Text style={styles.activityTotalLabel}>{t.messages}</Text>
                        <Text style={styles.activityTotalValue}>{activityTotals.messages}</Text>
                    </View>
                </View>
                <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.activityDot, { backgroundColor: '#10B981' }]} />
                    <View>
                        <Text style={styles.activityTotalLabel}>{t.plans}</Text>
                        <Text style={styles.activityTotalValue}>{activityTotals.plans}</Text>
                    </View>
                </View>
                <View style={[styles.activityTotal, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.activityDot, { backgroundColor: '#F59E0B' }]} />
                    <View>
                        <Text style={styles.activityTotalLabel}>{t.checkIns}</Text>
                        <Text style={styles.activityTotalValue}>{activityTotals.checkIns}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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

export default DailyActivityChart;
