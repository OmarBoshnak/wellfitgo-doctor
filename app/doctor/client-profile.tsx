import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ClientProfileScreen from '@/src/features/patient/screens/ClientProfile';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Theme';

export default function ClientProfileRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ClientProfileScreen clientId={id} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
});
