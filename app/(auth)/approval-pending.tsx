import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, gradients } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { useAppDispatch } from '@/src/shared/store';
import { logout, setCredentials } from '@/src/shared/store/slices/authSlice';
import { AuthService } from '@/src/shared/services/auth/auth.service';
import api from '@/src/shared/services/api/client';

export default function ApprovalPendingScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckStatus = async () => {
        setIsLoading(true);
        try {
            // Fetch fresh user data from backend
            const response = await api.get('/auth/me');
            const freshUser = response.data?.data || response.data;

            if (freshUser) {
                // Update AsyncStorage with fresh data
                await AsyncStorage.setItem('user', JSON.stringify(freshUser));

                // Update Redux state
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    dispatch(setCredentials({ user: freshUser, token }));
                }

                // Handle navigation based on status
                if (freshUser.status === 'active') {
                    Alert.alert('Approved!', 'Your account has been approved.', [
                        { text: 'Continue', onPress: () => router.replace('/doctor') }
                    ]);
                } else if (freshUser.status === 'rejected') {
                    Alert.alert('Status Update', 'Your account application has been rejected.');
                } else {
                    Alert.alert('Still Pending', 'Your account is still under review. Please check back later.');
                }
            } else {
                Alert.alert('Error', 'Could not get user data.');
            }
        } catch (error) {
            console.error('Check status error:', error);
            Alert.alert('Error', 'Failed to check status. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(logout()).unwrap();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="time-outline" size={horizontalScale(80)} color={colors.primary} />
                </View>

                <Text style={styles.title}>Waiting for Approval</Text>
                <Text style={styles.subtitle}>
                    Thank you for signing up! Your account is currently under review by the administrator.
                </Text>
                <Text style={styles.description}>
                    You will be able to access the doctor dashboard once your profile has been approved.
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.8}
                        onPress={handleCheckStatus}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={gradients.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.primaryButtonGradient}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={colors.white} />
                            ) : (
                                <Text style={styles.primaryButtonText}>Check Status</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleLogout}
                        disabled={isLoading}
                    >
                        <Text style={styles.secondaryButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgPrimary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: horizontalScale(24),
    },
    iconContainer: {
        marginBottom: verticalScale(32),
        backgroundColor: colors.bgSecondary,
        padding: horizontalScale(24),
        borderRadius: horizontalScale(64),
    },
    title: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(12),
        textAlign: 'center',
    },
    subtitle: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: verticalScale(16),
        lineHeight: verticalScale(24),
    },
    description: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: verticalScale(48),
        opacity: 0.8,
    },
    buttonContainer: {
        width: '100%',
        gap: verticalScale(16),
    },
    primaryButton: {
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
    },
    primaryButtonGradient: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(16),
    },
    primaryButtonText: {
        fontSize: ScaleFontSize(16),
        color: colors.white,
        fontWeight: '600',
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: verticalScale(16),
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        borderColor: colors.border,
    },
    secondaryButtonText: {
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        fontWeight: '600',
    },
});
