import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { calendarTranslations as t } from '../translations';
import { isRTL } from '@/src/i18n';
import { colors } from '@/src/core/constants/Theme';

interface CalendarHeaderProps {
    style?: ViewStyle;
    onEditPress?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({ style, onEditPress }) => {
    const router = useRouter();

    const handleBackPress = useCallback(() => {
        console.log('Back button pressed'); // Debug log
        try {
            // Check if we can go back
            if (router.canGoBack()) {
                router.back();
            } else {
                // No navigation history, go to doctor dashboard
                console.log('No back history, navigating to dashboard');
                router.replace('/doctor/(tabs)/home');
            }
        } catch (error) {
            console.error('Router back failed:', error);
            // Fallback: go to doctor dashboard
            router.replace('/doctor/(tabs)/home');
        }
    }, [router]);

    return (
        <View style={[styles.container, { flexDirection: isRTL ? 'row' : 'row-reverse' }, style]}>
            <TouchableOpacity
                onPress={handleBackPress}
                style={styles.backButton}
            >
                <ArrowLeft
                    size={horizontalScale(24)}
                    color={colors.dark}
                />
            </TouchableOpacity>

            <Text style={styles.title}>{t.calendar}</Text>

            <TouchableOpacity onPress={onEditPress}>
                <View style={styles.addButton}>
                    <Text style={styles.addButtonText}>{t.add}</Text>
                </View>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: horizontalScale(10),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomColor: colors.border,
    },
    backButton: {
        minWidth: horizontalScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.primaryDark,
    },
});

export default CalendarHeader;
