/**
 * ProgressChart Component
 * @description Donut chart showing client progress distribution
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { ProgressData } from '@/src/features/analytics/types/analytics.types';

interface ProgressChartProps {
    data: ProgressData | null;
    isLoading?: boolean;
}

// Translations
const t = {
    progressDistribution: isRTL ? 'توزيع تقدم العملاء' : 'Client Progress Distribution',
    clients: isRTL ? 'عملاء' : 'Clients',
    onTrack: isRTL ? 'على المسار' : 'On Track',
    needsSupport: isRTL ? 'يحتاج دعم' : 'Needs Support',
    atRisk: isRTL ? 'معرض للخطر' : 'At Risk',
    noData: isRTL ? 'لا توجد بيانات' : 'No data',
};

export const ProgressChart: React.FC<ProgressChartProps> = ({
    data,
    isLoading = false,
}) => {
    const chartData = useMemo(() => {
        if (!data || data.total === 0) return null;
        return data;
    }, [data]);

    // Chart calculations
    const chartSize = horizontalScale(160);
    const strokeWidth = horizontalScale(16);
    const radius = (chartSize - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    if (!chartData) {
        return null;
    }

    return (
        <View style={styles.chartCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t.progressDistribution}
            </Text>

            <View style={styles.donutContainer}>
                <View style={styles.donutChart}>
                    <Svg width={chartSize} height={chartSize}>
                        {/* On Track */}
                        <Circle
                            cx={chartSize / 2}
                            cy={chartSize / 2}
                            r={radius}
                            fill="transparent"
                            stroke={chartData.onTrack.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${(chartData.onTrack.percentage / 100) * circumference} ${circumference}`}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                        />
                        {/* Needs Support */}
                        <Circle
                            cx={chartSize / 2}
                            cy={chartSize / 2}
                            r={radius}
                            fill="transparent"
                            stroke={chartData.needsSupport.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${(chartData.needsSupport.percentage / 100) * circumference} ${circumference}`}
                            strokeDashoffset={-(chartData.onTrack.percentage / 100) * circumference}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                        />
                        {/* At Risk */}
                        <Circle
                            cx={chartSize / 2}
                            cy={chartSize / 2}
                            r={radius}
                            fill="transparent"
                            stroke={chartData.atRisk.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${(chartData.atRisk.percentage / 100) * circumference} ${circumference}`}
                            strokeDashoffset={-((chartData.onTrack.percentage + chartData.needsSupport.percentage) / 100) * circumference}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${chartSize / 2} ${chartSize / 2})`}
                        />
                    </Svg>
                    <View style={styles.donutCenter}>
                        <Text style={styles.donutCenterLabel}>{t.clients}</Text>
                        <Text style={styles.donutCenterValue}>{chartData.total}</Text>
                    </View>
                </View>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.legendValue}>{chartData.onTrack.percentage}% ({chartData.onTrack.count})</Text>
                    <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.legendText}>{t.onTrack}</Text>
                        <View style={[styles.legendDot, { backgroundColor: chartData.onTrack.color }]} />
                    </View>
                </View>
                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.legendValue}>{chartData.needsSupport.percentage}% ({chartData.needsSupport.count})</Text>
                    <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.legendText}>{t.needsSupport}</Text>
                        <View style={[styles.legendDot, { backgroundColor: chartData.needsSupport.color }]} />
                    </View>
                </View>
                <View style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.legendValue}>{chartData.atRisk.percentage}% ({chartData.atRisk.count})</Text>
                    <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.legendText}>{t.atRisk}</Text>
                        <View style={[styles.legendDot, { backgroundColor: chartData.atRisk.color }]} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    donutContainer: {
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    donutChart: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutCenter: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    donutCenterValue: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    donutCenterLabel: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    legendContainer: {
        gap: verticalScale(8),
    },
    legendItem: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    legendRow: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    legendDot: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
    },
    legendText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    legendValue: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
});

export default ProgressChart;
