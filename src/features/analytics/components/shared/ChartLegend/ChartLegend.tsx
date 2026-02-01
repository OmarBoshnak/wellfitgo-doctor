/**
 * ChartLegend Component
 * @description Reusable legend component for charts
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { ChartLegendProps } from '@/src/features/analytics/types/analytics.types';

export const ChartLegend: React.FC<ChartLegendProps> = ({ items }) => {
    return (
        <View style={styles.container}>
            {items.map((item, index) => (
                <View
                    key={index}
                    style={[styles.legendItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                >
                    <View style={[styles.legendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                        <Text style={styles.legendText}>{item.label}</Text>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    </View>
                    {item.value && (
                        <Text style={styles.legendValue}>{item.value}</Text>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: verticalScale(12),
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
        width: horizontalScale(12),
        height: horizontalScale(12),
        borderRadius: horizontalScale(6),
    },
    legendText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    legendValue: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        fontWeight: '600',
    },
});

export default ChartLegend;
