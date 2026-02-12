import React from 'react';
import { Text, View } from 'react-native';
import { isRTL } from '@/src/core/constants/translation';
import { colors } from '@/src/core/constants/Theme';
import { styles } from '../styles';
import { t } from '../translations';

interface StatsCardsProps {
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    startDate: string;
    weightDiff: number;
    remainingWeight: number;
}

/** Format a weight value to 1 decimal place (e.g. 74.0, 67.4) */
const fmt = (v: number) => Number(v).toFixed(1);

export function StatsCards({
    startWeight,
    currentWeight,
    targetWeight,
    startDate,
    weightDiff,
    remainingWeight,
}: StatsCardsProps) {
    // weightDiff = startWeight - currentWeight
    // positive → lost weight (good), negative → gained weight (bad)
    const gained = weightDiff < 0;
    const arrow = gained ? '↑' : '↓';
    const changeColor = gained ? colors.error : colors.success;

    return (
        <View style={styles.statsCardsContainer}>
            <View style={[styles.statsCards, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t.target}</Text>
                    <Text style={styles.statValue}>{fmt(targetWeight)}kg</Text>
                    <Text style={styles.statSubtext}>{fmt(Math.abs(remainingWeight))}kg {t.toGo}</Text>
                </View>
                <View style={[styles.statCard, styles.statCardHighlight]}>
                    <Text style={styles.statLabel}>{t.current}</Text>
                    <Text style={[styles.statValueGradient, gained && { color: colors.error }]}>{fmt(currentWeight)}kg</Text>
                    <Text style={[styles.statChange, { color: changeColor }]}>{arrow} {fmt(Math.abs(weightDiff))}kg</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>{t.start}</Text>
                    <Text style={styles.statValue}>{fmt(startWeight)}kg</Text>
                    <Text style={styles.statSubtext}>{startDate}</Text>
                </View>

            </View>
        </View>
    );
}
