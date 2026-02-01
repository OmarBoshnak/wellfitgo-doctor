/**
 * StatCard Component
 * @description Reusable card for displaying statistics with optional trend indicators
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { StatCardProps } from '@/src/features/analytics/types/analytics.types';

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    icon,
    trend,
    loading = false,
}) => {
    if (loading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="small" color={colors.primaryDark} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {icon && (
                <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                    {icon}
                </View>
            )}
            
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'right' }]}>{label}</Text>
            <Text style={[styles.value, { textAlign: isRTL ? 'right' : 'right' }]}>{value}</Text>
            
            {trend && (
                <View style={[styles.trendRow, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {trend.isUp ? (
                        <TrendingUp size={horizontalScale(12)} color="#10B981" />
                    ) : (
                        <TrendingDown size={horizontalScale(12)} color="#EF4444" />
                    )}
                    <Text style={[styles.trendText, { color: trend.isUp ? '#10B981' : '#EF4444' }]}>
                        {trend.value}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        alignItems: 'flex-end',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: verticalScale(100),
    },
    iconContainer: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    label: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginBottom: verticalScale(4),
    },
    value: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    trendRow: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    trendText: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
    },
});

export default StatCard;
