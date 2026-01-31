import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withDelay,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { colors, gradients } from '@/src/core/constants/Theme';
import { splashTranslations, isRTL } from '@/src/core/constants/translation';
import {
    horizontalScale,
    verticalScale,
    ScaleFontSize,
} from '@/src/core/utils/scaling';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const SPLASH_DURATION = 2500; // 2.5 seconds

export default function SplashScreenComponent() {
    const router = useRouter();

    // Animation values
    const logoScale = useSharedValue(0);
    const logoOpacity = useSharedValue(0);
    const taglineOpacity = useSharedValue(0);
    const taglineTranslateY = useSharedValue(20);
    const loadingOpacity = useSharedValue(0);
    const dot1Scale = useSharedValue(1);
    const dot2Scale = useSharedValue(1);
    const dot3Scale = useSharedValue(1);

    // Animated styles
    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
        opacity: logoOpacity.value,
    }));

    const taglineAnimatedStyle = useAnimatedStyle(() => ({
        opacity: taglineOpacity.value,
        transform: [{ translateY: taglineTranslateY.value }],
    }));

    const loadingAnimatedStyle = useAnimatedStyle(() => ({
        opacity: loadingOpacity.value,
    }));

    const dot1Style = useAnimatedStyle(() => ({
        transform: [{ scale: dot1Scale.value }],
    }));

    const dot2Style = useAnimatedStyle(() => ({
        transform: [{ scale: dot2Scale.value }],
    }));

    const dot3Style = useAnimatedStyle(() => ({
        transform: [{ scale: dot3Scale.value }],
    }));

    /**
     * Navigate to home screen
     */
    const navigateToScreen = useCallback(() => {
        try {
            // Navigate to login screen
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Navigation error:', error);
            // Fallback
            router.replace('/(auth)/login');
        }
    }, [router]);

    useEffect(() => {
        const initSplash = async () => {
            // Hide native splash screen
            await SplashScreen.hideAsync();

            // Start logo animation
            logoScale.value = withSpring(1, {
                damping: 12,
                stiffness: 100,
            });
            logoOpacity.value = withTiming(1, { duration: 600 });

            // Start tagline animation with delay
            taglineOpacity.value = withDelay(
                400,
                withTiming(1, { duration: 500 })
            );
            taglineTranslateY.value = withDelay(
                400,
                withSpring(0, { damping: 15 })
            );

            // Start loading animation with delay
            loadingOpacity.value = withDelay(
                700,
                withTiming(1, { duration: 400 })
            );

            // Animated dots with staggered pulse
            const pulseAnimation = (delay: number) =>
                withDelay(
                    800 + delay,
                    withRepeat(
                        withSequence(
                            withTiming(1.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                            withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
                        ),
                        -1,
                        false
                    )
                );

            dot1Scale.value = pulseAnimation(0);
            dot2Scale.value = pulseAnimation(150);
            dot3Scale.value = pulseAnimation(300);
        };

        initSplash();

        // Navigate after splash duration
        const timer = setTimeout(navigateToScreen, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, [navigateToScreen]);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative circles */}
                <View style={styles.decorationContainer}>
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />
                </View>

                {/* Main content */}
                <View style={styles.content}>
                    {/* Logo */}
                    <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                        <Image
                            source={require('../../assets/Wellfitgo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Tagline */}
                    <Animated.View style={[styles.taglineContainer, taglineAnimatedStyle]}>
                        <Text style={[styles.tagline, isRTL && styles.rtlText]}>
                            {splashTranslations.tagline}
                        </Text>
                    </Animated.View>
                </View>

                {/* Loading indicator */}
                <Animated.View style={[styles.loadingContainer, loadingAnimatedStyle]}>
                    <View style={styles.dotsContainer}>
                        <Animated.View style={[styles.dot, dot1Style]} />
                        <Animated.View style={[styles.dot, dot2Style]} />
                        <Animated.View style={[styles.dot, dot3Style]} />
                    </View>
                    <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                        {splashTranslations.gettingReady}
                    </Text>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    decorationContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    decorCircle1: {
        width: horizontalScale(300),
        height: horizontalScale(300),
        top: -horizontalScale(100),
        right: -horizontalScale(100),
    },
    decorCircle2: {
        width: horizontalScale(200),
        height: horizontalScale(200),
        bottom: verticalScale(100),
        left: -horizontalScale(80),
    },
    decorCircle3: {
        width: horizontalScale(150),
        height: horizontalScale(150),
        bottom: -horizontalScale(50),
        right: horizontalScale(50),
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: verticalScale(20),
    },
    logo: {
        width: horizontalScale(150),
        height: horizontalScale(150),
        borderRadius: horizontalScale(24),
    },
    taglineContainer: {
        paddingHorizontal: horizontalScale(40),
    },
    tagline: {
        fontSize: ScaleFontSize(18),
        color: colors.white,
        textAlign: 'center',
        fontWeight: '500',
        letterSpacing: 0.5,
        opacity: 0.95,
    },
    rtlText: {
        writingDirection: 'rtl',
        textAlign: 'center',
    },
    loadingContainer: {
        position: 'absolute',
        bottom: verticalScale(100),
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: verticalScale(12),
    },
    dot: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: colors.white,
        marginHorizontal: horizontalScale(6),
        opacity: 0.9,
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.white,
        opacity: 0.8,
        fontWeight: '400',
    },
});
