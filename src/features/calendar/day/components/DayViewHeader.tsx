import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { dayViewTranslations as t, getDayNameFromIndex, getMonthName, getDayLetterFromIndex } from '../translations';
import { getWeekStripDays } from '../utils/time';
import { isRTL } from '@/src/i18n';
import { colors } from '@/src/core/constants/Theme';

interface DayViewHeaderProps {
    currentDate: Date;
    onCalendarPress?: () => void;
    style?: ViewStyle;
}

export const DayViewHeader: React.FC<DayViewHeaderProps> = ({
    currentDate,
    onCalendarPress,
    style
}) => {
    const router = useRouter();
    const dayNumber = currentDate.getDate();
    const dayName = getDayNameFromIndex(currentDate.getDay());
    const monthName = getMonthName(currentDate.getMonth());
    const year = currentDate.getFullYear();

    // Get week strip days
    const weekDays = getWeekStripDays(currentDate);
    const selectedDayNumber = currentDate.getDate();

    const handleBackPress = useCallback(() => {
        console.log('DayViewHeader back button pressed'); // Debug log
        try {
            // Check if we can go back
            if (router.canGoBack()) {
                router.back();
            } else {
                // No navigation history, go to calendar
                console.log('No back history, navigating to calendar');
                router.replace('/doctor-calendar');
            }
        } catch (error) {
            console.error('DayViewHeader router back failed:', error);
            // Fallback: go to calendar
            router.replace('/doctor-calendar');
        }
    }, [router]);

    return (
        <LinearGradient
            colors={['#4d6efe', '#6b85ff']}
            style={styles.container}
        >
            {/* Top Navigation */}
            <View style={[styles.nav, { flexDirection: isRTL ? 'row' : 'row-reverse' }, style]}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={handleBackPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <ArrowLeft
                        size={horizontalScale(24)}
                        color={colors.white}
                    />
                </TouchableOpacity>

                <Text style={styles.title}>{t.dayView}</Text>

                <TouchableOpacity
                    disabled
                    style={styles.navButton}
                    onPress={onCalendarPress}
                >
                    <Calendar size={horizontalScale(24)} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {/* Date Display */}
            <View style={styles.dateContainer}>
                <Text style={styles.dayNumber}>{dayNumber}</Text>
                <Text style={styles.dayName}>{dayName}</Text>
                <Text style={styles.monthYear}>{monthName} {year}</Text>
            </View>

            {/* Week Strip */}
            <View style={[
                styles.weekStrip,
                { flexDirection: isRTL ? 'row' : 'row-reverse' }
            ]}>
                {weekDays.map((day, index) => {
                    const isSelected = day.dayNumber === selectedDayNumber;
                    const dayLetter = getDayLetterFromIndex(day.dayOfWeek);

                    return (
                        <View
                            key={index}
                            style={[
                                styles.weekDay,
                                isSelected && styles.weekDaySelected
                            ]}
                        >
                            <Text style={[
                                styles.weekDayLetter,
                                isSelected && styles.weekDayLetterSelected
                            ]}>
                                {dayLetter}
                            </Text>
                            <Text style={[
                                styles.weekDayNumber,
                                isSelected && styles.weekDayNumberSelected
                            ]}>
                                {day.dayNumber}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: verticalScale(24),
        borderBottomLeftRadius: horizontalScale(32),
        borderBottomRightRadius: horizontalScale(32),
        shadowColor: '#4d6efe',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    nav: {
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(12),
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    navButton: {
        borderRadius: horizontalScale(20),
        padding: horizontalScale(8),
        minWidth: horizontalScale(40),
        minHeight: verticalScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    dateContainer: {
        alignItems: 'center',
        marginTop: verticalScale(8),
    },
    dayNumber: {
        fontSize: ScaleFontSize(48),
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: ScaleFontSize(56),
    },
    dayName: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: '#FFFFFF',
        marginTop: verticalScale(4),
    },
    monthYear: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: verticalScale(4),
    },
    weekStrip: {
        marginTop: verticalScale(24),
        paddingHorizontal: horizontalScale(24),
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    weekDay: {
        alignItems: 'center',
        gap: verticalScale(4),
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(8),
    },
    weekDaySelected: {
        backgroundColor: '#FFFFFF',
        borderRadius: horizontalScale(12),
        paddingHorizontal: horizontalScale(14),
        paddingVertical: verticalScale(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        transform: [{ scale: 1.1 }],
    },
    weekDayLetter: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    weekDayLetterSelected: {
        fontSize: ScaleFontSize(12),
        fontWeight: '700',
        color: '#4d6efe',
    },
    weekDayNumber: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.6)',
    },
    weekDayNumberSelected: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#4d6efe',
    },
});

export default DayViewHeader;
