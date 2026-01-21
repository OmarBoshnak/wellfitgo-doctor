import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { DoctorPlanItem } from '../hooks/useDoctorPlans';
import { Circle, Clock, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react-native';

interface Props {
    plans: DoctorPlanItem[];
    onPlanPress: (plan: DoctorPlanItem) => void;
    isLoading: boolean;
}

const t = {
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    week: isRTL ? 'الأسبوع' : 'Week',
    daysLeft: isRTL ? 'أيام متبقية' : 'days left',
    completed: isRTL ? 'مكتمل' : 'completed',
    missed: isRTL ? 'فائتة' : 'missed',
};

export default function ActivePlansList({ plans, onPlanPress, isLoading }: Props) {
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>{t.loading}</Text>
            </View>
        );
    }

    if (!plans || plans.length === 0) {
        return null; // Or empty state handled by parent
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return '#27AE60';
            case 'warning': return '#F2994A';
            case 'paused': return '#EB5757';
            default: return colors.textSecondary;
        }
    };

    const renderPlanItem = (plan: DoctorPlanItem) => {
        const statusColor = getStatusColor(plan.status);
        const progress = plan.totalMeals > 0 ? (plan.mealsCompleted / plan.totalMeals) : 0;

        return (
            <TouchableOpacity
                key={plan.id}
                style={styles.card}
                onPress={() => onPlanPress(plan)}
                activeOpacity={0.7}
            >
                <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {/* Client Info */}
                    <View style={[styles.clientInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Image
                            source={{ uri: plan.avatar || 'https://via.placeholder.com/40' }}
                            style={styles.avatar}
                        />
                        <View style={styles.clientText}>
                            <Text style={[styles.clientName, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {plan.clientName}
                            </Text>
                            <Text style={[styles.dietProgram, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {plan.dietProgram}
                            </Text>
                        </View>
                    </View>

                    {/* Status Indicator */}
                    <View style={styles.statusIndicator}>
                        {/* Week Badge */}
                        <View style={styles.weekBadge}>
                            <Text style={styles.weekText}>{t.week} {plan.weekNumber}</Text>
                        </View>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBarBg, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${progress * 100}%`,
                                    backgroundColor: statusColor
                                }
                            ]}
                        />
                    </View>
                    <View style={[styles.progressMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={styles.progressText}>
                            {Math.round(progress * 100)}% {t.completed}
                        </Text>
                        <Text style={styles.daysLeftText}>
                            {plan.daysLeft} {t.daysLeft}
                        </Text>
                    </View>
                </View>

                {/* Issues / Warning if any */}
                {plan.status === 'warning' && (
                    <View style={[styles.warningContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AlertCircle size={horizontalScale(14)} color="#F2994A" />
                        <Text style={styles.warningText}>
                            {plan.missedMeals} {t.missed}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {plans.map(renderPlanItem)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: verticalScale(12),
    },
    loadingContainer: {
        padding: verticalScale(20),
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(8),
        color: colors.textSecondary,
        fontSize: ScaleFontSize(14),
    },
    card: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(16),
        paddingVertical: verticalScale(16),
        marginBottom: verticalScale(4),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    clientInfo: {
        alignItems: 'center',
        gap: horizontalScale(12),
        flex: 1,
    },
    avatar: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        backgroundColor: colors.bgSecondary,
    },
    clientText: {
        flex: 1,
    },
    clientName: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    dietProgram: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    statusIndicator: {
        alignItems: 'flex-end',
    },
    weekBadge: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(6),
    },
    weekText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    progressContainer: {
        gap: verticalScale(6),
    },
    progressBarBg: {
        height: verticalScale(6),
        backgroundColor: colors.bgSecondary,
        borderRadius: verticalScale(3),
        overflow: 'hidden',
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: verticalScale(3),
    },
    progressMeta: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '500',
    },
    daysLeftText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    warningContainer: {
        marginTop: verticalScale(10),
        alignItems: 'center',
        gap: horizontalScale(6),
        backgroundColor: 'rgba(242, 153, 74, 0.1)',
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(4),
        alignSelf: 'flex-start',
    },
    warningText: {
        fontSize: ScaleFontSize(12),
        color: '#F2994A',
        fontWeight: '500',
    },
});
