/**
 * AnalyticsHeader Component
 * @description Header with title and time filter dropdown
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { TimeRange } from '@/src/features/analytics/types/analytics.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AnalyticsHeaderProps {
    timeFilter: TimeRange;
    onTimeFilterChange: (filter: TimeRange) => void;
}

// Translations
const t = {
    title: isRTL ? 'الإحصائيات' : 'Analytics',
    last7Days: isRTL ? 'آخر 7 أيام' : 'Last 7 days',
    last30Days: isRTL ? 'آخر 30 يوم' : 'Last 30 days',
    last3Months: isRTL ? 'آخر 3 أشهر' : 'Last 3 months',
};

const timeFilters: { key: TimeRange; label: string }[] = [
    { key: '7days', label: t.last7Days },
    { key: '30days', label: t.last30Days },
    { key: '3months', label: t.last3Months },
];

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
    timeFilter,
    onTimeFilterChange,
}) => {
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const insets = useSafeAreaInsets()
    const currentFilterLabel = timeFilters.find(f => f.key === timeFilter)?.label || t.last7Days;

    const handleFilterSelect = (filter: TimeRange) => {
        onTimeFilterChange(filter);
        setShowFilterDropdown(false);
    };

    return (
        <View style={styles.header}>
            <View style={[styles.headerTop, { flexDirection: isRTL ? 'row' : 'row-reverse',paddingTop:insets.top }]}>
                <View style={[styles.headerActions, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    {/* Time Filter Dropdown */}
                    <TouchableOpacity
                        style={[styles.filterDropdown, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
                        onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                        activeOpacity={0.7}
                    >
                        <ChevronDown size={horizontalScale(16)} color={colors.textSecondary} />
                        <Text style={styles.filterDropdownText}>{currentFilterLabel}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>{t.title}</Text>
                </View>
            </View>

            {/* Filter Dropdown Menu */}
            {showFilterDropdown && (
                <View style={styles.dropdownMenu}>
                    {timeFilters.map(filter => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.dropdownItem,
                                timeFilter === filter.key && styles.dropdownItemActive,
                            ]}
                            onPress={() => {
                                onTimeFilterChange(filter.key);
                                setShowFilterDropdown(false);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.dropdownItemText,
                                timeFilter === filter.key && styles.dropdownItemTextActive,
                                { textAlign: isRTL ? 'right' : 'left' },
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.bgPrimary,
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTop: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerActions: {
        gap: horizontalScale(8),
    },
    headerTitleContainer: {
        flex: 1,
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    filterDropdown: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        gap: horizontalScale(4),
        minHeight: verticalScale(44),
        justifyContent: 'center',
    },
    filterDropdownText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
    },
    dropdownMenu: {
        position: 'absolute',
        top: verticalScale(90),
        left: horizontalScale(16),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(8),
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.1,
        shadowRadius: horizontalScale(8),
        elevation: 4,
        zIndex: 100,
        minWidth: horizontalScale(120),
    },
    dropdownItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        minHeight: verticalScale(44),
        justifyContent: 'center',
    },
    dropdownItemActive: {
        backgroundColor: colors.success + '10',
    },
    dropdownItemText: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
    },
    dropdownItemTextActive: {
        color: colors.success,
        fontWeight: '600',
    },
});

export default AnalyticsHeader;
