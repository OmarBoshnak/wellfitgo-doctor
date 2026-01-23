import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    CodeField,
    Cursor,
    useBlurOnFulfill,
    useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import { colors, gradients } from '@/src/core/constants/Theme';
import {
    horizontalScale,
    verticalScale,
    ScaleFontSize,
} from '@/src/core/utils/scaling';
import { AuthService } from '@/src/shared/services/auth/auth.service';
import { useAppDispatch } from '@/src/shared/store';
import { setCredentials } from '@/src/shared/store/slices/authSlice';

const CELL_COUNT = 6;

export default function PhoneVerificationScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const params = useLocalSearchParams() as { userId?: string; phone?: string };
    const [value, setValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const phone = params.phone || '';

    // Hooks from react-native-confirmation-code-field
    const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
    const [props, getCellOnLayoutHandler] = useClearByFocusCell({
        value,
        setValue,
    });

    // Start resend timer
    const startResendTimer = () => {
        setResendTimer(60);
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Handle OTP verification
    const handleVerifyOtp = async () => {
        if (value.length !== CELL_COUNT) {
            Alert.alert('خطأ', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }

        if (!params.userId) {
            Alert.alert('خطأ', 'حدث خطأ غير متوقع: معرف المستخدم مفقود');
            return;
        }

        setIsLoading(true);
        try {
            const { user, token, routing } = await AuthService.verifyOtp(params.userId, value);

            // Dispatch to Redux store
            dispatch(setCredentials({ user, token }));

            Alert.alert('نجاح', 'تم تسجيل الدخول بنجاح');

            // Navigate based on routing decision from backend
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

            setIsLoading(false);
        } catch (error) {
            console.error('Verification Error:', error);
            Alert.alert('خطأ', 'رمز التحقق غير صحيح أو منتهي الصلاحية');
            setValue(''); // Clear on error
            setIsLoading(false);
        }
    };


    // Handle resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0) {
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.requestOtp(phone);

            Alert.alert('نجاح', 'تم إعادة إرسال رمز التحقق');
            setValue(''); // Clear previous code
            startResendTimer();
            setIsLoading(false);
        } catch (error) {
            console.error('Resend Error:', error);
            Alert.alert('خطأ', 'حدث خطأ أثناء إعادة إرسال الرمز');
            setIsLoading(false);
        }
    };


    // Render individual cell
    const renderCell = ({ index, symbol, isFocused }: { index: number; symbol: string; isFocused: boolean }) => {
        const hasValue = symbol !== '';

        return (
            <View
                key={index}
                style={[
                    styles.cell,
                    isFocused && styles.cellFocused,
                    hasValue && styles.cellFilled,
                ]}
                onLayout={getCellOnLayoutHandler(index)}
            >
                <Text style={[styles.cellText, isFocused && styles.cellTextFocused]}>
                    {symbol || (isFocused ? <Cursor /> : '')}
                </Text>
            </View>
        );
    };

    // Mask phone number for display
    const maskPhoneNumber = (phoneNumber: string): string => {
        if (phoneNumber.length < 4) return phoneNumber;
        return phoneNumber.slice(0, -4).replace(/./g, '•') + phoneNumber.slice(-4);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    disabled={isLoading}
                >
                    <Ionicons name="arrow-back" size={horizontalScale(24)} color={colors.textPrimary} />
                </TouchableOpacity>

                {/* Icon */}
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="shield-checkmark" size={horizontalScale(40)} color={colors.white} />
                    </LinearGradient>
                </View>

                {/* Title */}
                <Text style={styles.title}>تحقق من رقم الهاتف</Text>
                <Text style={styles.subtitle}>
                    لقد أرسلنا رمز تحقق مكون من 6 أرقام إلى
                </Text>
                <Text style={styles.phoneDisplay}>{maskPhoneNumber(phone)}</Text>

                {/* OTP Input using react-native-confirmation-code-field */}
                <CodeField
                    ref={ref}
                    {...props}
                    value={value}
                    onChangeText={setValue}
                    cellCount={CELL_COUNT}
                    rootStyle={styles.codeFieldRoot}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                    renderCell={renderCell}
                    editable={!isLoading}
                />

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        value.length !== CELL_COUNT && styles.verifyButtonDisabled
                    ]}
                    onPress={handleVerifyOtp}
                    disabled={isLoading || value.length !== CELL_COUNT}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={value.length === CELL_COUNT ? gradients.primary : ['#ccc', '#ccc']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.verifyButtonGradient}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                            <>
                                <Text style={styles.verifyButtonText}>تحقق</Text>
                                <Ionicons name="checkmark-circle" size={horizontalScale(20)} color={colors.white} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>لم تستلم الرمز؟</Text>
                    <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={isLoading || resendTimer > 0}
                    >
                        <Text style={[
                            styles.resendLink,
                            (isLoading || resendTimer > 0) && styles.resendLinkDisabled
                        ]}>
                            {resendTimer > 0
                                ? `إعادة الإرسال (${resendTimer}ث)`
                                : 'إعادة الإرسال'
                            }
                        </Text>
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
        paddingHorizontal: horizontalScale(30),
        paddingTop: verticalScale(10),
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: verticalScale(40),
    },
    iconContainer: {
        marginBottom: verticalScale(24),
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    iconGradient: {
        width: horizontalScale(80),
        height: horizontalScale(80),
        borderRadius: horizontalScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: ScaleFontSize(26),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: verticalScale(12),
    },
    subtitle: {
        fontSize: ScaleFontSize(15),
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: ScaleFontSize(22),
    },
    phoneDisplay: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.primaryDark,
        marginTop: verticalScale(4),
        marginBottom: verticalScale(32),
        letterSpacing: 1,
    },
    codeFieldRoot: {
        marginBottom: verticalScale(32),
        gap: horizontalScale(6),
    },
    cell: {
        width: horizontalScale(48),
        height: horizontalScale(60),
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: horizontalScale(12),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
    },
    cellFocused: {
        borderColor: colors.primaryDark,
        backgroundColor: colors.primaryLightBg,
    },
    cellFilled: {
        borderColor: colors.primaryLight,
        backgroundColor: colors.white,
    },
    cellText: {
        fontSize: ScaleFontSize(24),
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    cellTextFocused: {
        color: colors.primaryDark,
    },
    verifyButton: {
        width: '100%',
        borderRadius: horizontalScale(14),
        overflow: 'hidden',
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    verifyButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonGradient: {
        flexDirection: 'row',
        paddingVertical: verticalScale(16),
        paddingHorizontal: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(10),
    },
    verifyButtonText: {
        fontSize: ScaleFontSize(16),
        color: colors.white,
        fontWeight: '700',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(24),
        gap: horizontalScale(8),
    },
    resendText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    resendLink: {
        fontSize: ScaleFontSize(14),
        color: colors.primaryDark,
        fontWeight: '700',
    },
    resendLinkDisabled: {
        color: colors.textSecondary,
        fontWeight: '500',
    },
});
