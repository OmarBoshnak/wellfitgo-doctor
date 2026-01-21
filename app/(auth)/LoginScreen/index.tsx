import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { colors, gradients } from '@/src/core/constants/Theme';
import {
    horizontalScale,
    verticalScale,
    ScaleFontSize,
} from '@/src/core/utils/scaling';
import PhoneInput from '@/src/shared/components/auth/PhoneInput';
import { AuthService } from '@/src/shared/services/auth/auth.service';
import { OAuthProvider } from 'react-native-appwrite';
import { useAppDispatch } from '@/src/shared/store';
import { setCredentials } from '@/src/shared/store/slices/authSlice';

// Phone number validation for Egypt
const validateEgyptianPhone = (phone: string): boolean => {
    // Egyptian mobile numbers: 10-11 digits starting with 01
    const egyptPattern = /^(01)[0-9]{9}$/;
    return egyptPattern.test(phone);
};

// Generic phone validation (at least 8 digits)
const validatePhoneNumber = (phone: string): boolean => {
    return phone.length >= 8 && phone.length <= 15;
};

export default function LoginScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);
    const [showPhoneInput, setShowPhoneInput] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [countryCode, setCountryCode] = useState('+20');
    const [phoneError, setPhoneError] = useState('');

    // Handle phone input validation
    const validatePhone = (): boolean => {
        if (!phoneNumber) {
            setPhoneError('يرجى إدخال رقم الهاتف');
            return false;
        }

        // Specific validation for Egypt
        if (countryCode === '+20') {
            if (!validateEgyptianPhone(phoneNumber)) {
                setPhoneError('رقم الهاتف المصري يجب أن يبدأ بـ 01 ويتكون من 10-11 رقم');
                return false;
            }
        } else {
            if (!validatePhoneNumber(phoneNumber)) {
                setPhoneError('رقم الهاتف غير صالح');
                return false;
            }
        }

        setPhoneError('');
        return true;
    };

    // Handle phone authentication
    const handlePhoneAuth = async () => {
        if (!showPhoneInput) {
            setShowPhoneInput(true);
            return;
        }

        if (!validatePhone()) {
            return;
        }

        setIsLoading(true);
        try {
            // Remove leading zero from phone number if present for E.164 format
            const cleanPhoneNumber = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
            const fullPhoneNumber = `${countryCode}${cleanPhoneNumber}`;
            const result = await AuthService.requestOtp(fullPhoneNumber);

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to send OTP');
            }

            Alert.alert('نجاح', 'تم إرسال رمز التحقق إلى هاتفك');

            // Navigate to OTP verification screen with parameters
            router.push({
                pathname: '/(auth)/PhoneVerificationScreen',
                params: {
                    userId: result.data.userId,
                    phone: fullPhoneNumber
                }
            } as any);
            setIsLoading(false);
        } catch (error) {
            console.error('Login Error:', error);
            Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الرمز. يرجى التأكد من رقم الهاتف والمحاولة مرة أخرى.');
            setIsLoading(false);
        }
    };


    // Generic Social Auth Handler
    const handleSocialAuth = async (provider: string) => {
        setIsLoading(true);
        try {
            let oauthProvider;
            switch (provider) {
                case 'Google':
                    oauthProvider = OAuthProvider.Google;
                    break;
                case 'Facebook':
                    oauthProvider = OAuthProvider.Facebook;
                    break;
                case 'Apple':
                    oauthProvider = OAuthProvider.Apple;
                    break;
                default:
                    Alert.alert('تنبيه', `غير مدعوم حالياً`);
                    setIsLoading(false);
                    return;
            }

            const { user, token, routing } = await AuthService.loginWithOAuth(oauthProvider);

            // Dispatch to Redux store
            dispatch(setCredentials({ user, token }));

            Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح');

            if (user.status === 'pending' || !user.status) {
                router.replace('/(auth)/ApprovalPendingScreen');
            } else if (user.status === 'rejected') {
                Alert.alert('تنبيه', 'تم رفض طلب حسابك. يرجى الاتصال بالدعم.');
                await AuthService.logout();
            } else if (routing && routing.destination) {
                router.replace(routing.destination as any);
            } else {
                router.replace('/doctor');
            }
        } catch (error) {
            console.error('Social Login Error:', error);
            // Don't show alert if user cancelled (checking error message usually required, but keeping simple for now)
            Alert.alert('خطأ', 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>

                <Image source={require('../../../assets/Wellfitgo.png')} style={styles.logo} />

                {/* Title */}
                <Text style={styles.title}>تسجيل الدخول</Text>
                <Text style={styles.subtitle}>سجل دخولك للوصول إلى منصة الأطباء</Text>

                {/* Phone Input Section */}
                {showPhoneInput && (
                    <View style={styles.phoneInputWrapper}>
                        <PhoneInput
                            value={phoneNumber}
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                if (phoneError) setPhoneError('');
                            }}
                            countryCode={countryCode}
                            onCountryCodeChange={setCountryCode}
                            error={phoneError}
                            editable={!isLoading}
                        />
                    </View>
                )}

                {/* Login buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        activeOpacity={0.8}
                        onPress={handlePhoneAuth}
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
                                <Ionicons
                                    name={showPhoneInput ? "arrow-back" : "call-outline"}
                                    size={horizontalScale(20)}
                                    color={colors.white}
                                />
                            )}
                            <Text style={styles.primaryButtonText}>
                                {isLoading
                                    ? 'جاري التحميل...'
                                    : showPhoneInput
                                        ? 'إرسال رمز التحقق'
                                        : 'تسجيل برقم الهاتف'
                                }
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Back button when phone input is shown */}
                    {showPhoneInput && (
                        <TouchableOpacity
                            style={styles.backToLoginButton}
                            onPress={() => {
                                setShowPhoneInput(false);
                                setPhoneNumber('');
                                setPhoneError('');
                            }}
                            disabled={isLoading}
                        >
                            <Text style={styles.backToLoginText}>العودة</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>أو</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Social login */}
                <View style={styles.socialContainer}>
                    <TouchableOpacity
                        style={styles.socialButton}
                        activeOpacity={0.7}
                        onPress={() => handleSocialAuth('Google')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#EA4335" />
                        ) : (
                            <Ionicons name="logo-google" size={horizontalScale(24)} color="#EA4335" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.socialButton}
                        activeOpacity={0.7}
                        onPress={() => handleSocialAuth('Facebook')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#1877F2" />
                        ) : (
                            <Ionicons name="logo-facebook" size={horizontalScale(24)} color="#1877F2" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.socialButton}
                        activeOpacity={0.7}
                        onPress={() => handleSocialAuth('Apple')}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#000000" />
                        ) : (
                            <Ionicons name="logo-apple" size={horizontalScale(24)} color="#000000" />
                        )}
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
    logo: {
        width: horizontalScale(100),
        height: horizontalScale(100),
        borderRadius: horizontalScale(24),
        marginBottom: verticalScale(40)
    },
    title: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: colors.textPrimary,
        writingDirection: 'rtl',
        marginBottom: verticalScale(8),
    },
    subtitle: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
        writingDirection: 'rtl',
        marginBottom: verticalScale(40),
    },
    phoneInputWrapper: {
        width: '100%',
        marginBottom: verticalScale(20),
    },
    buttonContainer: {
        width: '100%',
        gap: verticalScale(12),
    },
    primaryButton: {
        borderRadius: horizontalScale(12),
        overflow: 'hidden',
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(16),
        gap: horizontalScale(10),
    },
    primaryButtonText: {
        fontSize: ScaleFontSize(16),
        color: colors.white,
        fontWeight: '600',
        writingDirection: 'rtl',
    },
    backToLoginButton: {
        alignItems: 'center',
        paddingVertical: verticalScale(12),
    },
    backToLoginText: {
        fontSize: ScaleFontSize(14),
        color: colors.primaryDark,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: verticalScale(24),
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        color: colors.textSecondary,
        marginHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
    },
    socialContainer: {
        flexDirection: 'row',
        gap: horizontalScale(16),
    },
    socialButton: {
        width: horizontalScale(56),
        height: horizontalScale(56),
        borderRadius: horizontalScale(28),
        backgroundColor: colors.bgSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
