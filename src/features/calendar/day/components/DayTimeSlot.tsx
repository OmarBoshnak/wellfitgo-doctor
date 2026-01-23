import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { dayViewTranslations as t, formatHour } from '../translations';
import { isRTL } from '@/src/i18n';
import { colors } from '@/src/core/constants/Theme';

interface DayTimeSlotProps {
    hour: number;
    hasEvent: boolean;
    onSchedulePress?: () => void;
}

export const DayTimeSlot: React.FC<DayTimeSlotProps> = ({
    hour,
    hasEvent,
    onSchedulePress,
}) => {
    const hourLabel = formatHour(hour);

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
            {/* Slot Content */}
            <View style={[
                styles.slotContent,
                isRTL ? styles.slotContentRTL : styles.slotContentLTR
            ]}>
                {!hasEvent && (
                    <View style={[
                        styles.emptySlot,
                        { flexDirection: isRTL ? 'row' : 'row-reverse' }
                    ]}>
                        <TouchableOpacity
                            style={[
                                styles.scheduleButton,
                                { flexDirection: isRTL ? 'row' : 'row-reverse' }
                            ]}
                            onPress={onSchedulePress}
                        >
                            <Plus size={horizontalScale(16)} color="#4d6efe" />
                            <Text style={styles.scheduleText}>{t.schedule}</Text>
                        </TouchableOpacity>

                        <Text style={styles.noAppointmentText}>
                            {t.noAppointments}
                        </Text>
                    </View>
                )}
            </View>

            {/* Time Label */}
            <Text style={[
                styles.timeText,
                { textAlign: isRTL ? 'right' : 'left' }
            ]}>
                {hourLabel}
            </Text>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: verticalScale(60),
        marginBottom: verticalScale(12),
        paddingHorizontal: horizontalScale(10)
    },
    timeText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
        marginHorizontal: horizontalScale(10)
    },
    slotContent: {
        flex: 1,
    },
    slotContentLTR: {
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        borderStyle: 'dashed',
    },
    slotContentRTL: {
        borderRightWidth: 1,
        borderRightColor: colors.border,
        borderStyle: 'dashed',
    },
    emptySlot: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noAppointmentText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    scheduleButton: {
        alignItems: 'center',
        gap: horizontalScale(4),
    },
    scheduleText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#4d6efe',
    },
});

export default DayTimeSlot;
