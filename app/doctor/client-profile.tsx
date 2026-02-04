import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientProfileScreen from '@/src/features/patient/screens/ClientProfile';
import ClientProgressView from '@/src/features/patient/screens/ClientProfile/ClientProgressView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Theme';

export default function ClientProfileRoute() {
    const {
        id,
        clientId: clientIdParam,
        viewProgress,
        clientName,
        clientAvatar,
        planId,
        dietProgram,
        clientGoal,
        weekNumber,
        totalWeeks,
        startDate,
        endDate,
        completionRate,
        streakDays
    } = useLocalSearchParams<{
        id?: string;
        clientId?: string;
        viewProgress?: string;
        clientName?: string;
        clientAvatar?: string;
        planId?: string;
        dietProgram?: string;
        clientGoal?: string;
        weekNumber?: string;
        totalWeeks?: string;
        startDate?: string;
        endDate?: string;
        completionRate?: string;
        streakDays?: string;
    }>();

    // Support both 'id' and 'clientId' parameter names for compatibility
    const clientId = id || clientIdParam || '';

    // If viewProgress is true, show the ClientProgressView with enhanced data
    if (viewProgress === 'true' && planId) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right',]}>
                <ClientProgressView
                    clientId={clientId}
                    clientName={clientName || ''}
                    clientAvatar={clientAvatar}
                    planId={planId}
                    dietProgram={dietProgram}
                    clientGoal={clientGoal}
                    weekNumber={weekNumber}
                    totalWeeks={totalWeeks}
                    startDate={startDate}
                    endDate={endDate}
                    completionRate={completionRate}
                    streakDays={streakDays}
                    viewProgress={viewProgress}
                />
            </SafeAreaView>
        );
    }

    // Otherwise, show the regular client profile
    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ClientProfileScreen clientId={clientId} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
});
