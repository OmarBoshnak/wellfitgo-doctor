/**
 * DoctorSettingsScreen - Settings menu for doctor/coach
 * Features: Profile header with avatar upload, menu sections (Account, Work, Support, Other), Sign Out
 * Integrated with backend API
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    User,
    Globe,
    Users,
    ChevronRight,
    ChevronLeft,
    Camera,
    ArrowLeft,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ProfileService, DoctorProfile } from '@/src/shared/services/profile/profile.service';
import { AuthService } from '@/src/shared/services/auth/auth.service';
import api from '@/src/shared/services/api/client';

import { getDoctorProfileTranslations } from '@/src/features/settings/locales/doctor-profile.locale';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = getDoctorProfileTranslations();

// =============================================================================
// TYPES
// =============================================================================

interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    subLabel?: string;
    rightText?: string;
    onPress?: () => void;
}

interface MenuSectionProps {
    title: string;
    children: React.ReactNode;
}

interface DashboardStats {
    activeClients: number;
}

// =============================================================================
// COMPONENTS
// =============================================================================

function MenuItem({ icon, label, subLabel, rightText, onPress }: MenuItemProps) {
    const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

    return (
        <TouchableOpacity
            style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.menuItemLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.menuIconContainer}>
                    {icon}
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {label}
                    </Text>
                    {subLabel && (
                        <Text style={[styles.menuSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                            {subLabel}
                        </Text>
                    )}
                </View>
            </View>
            <View style={[styles.menuItemRight, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                {rightText && <Text style={styles.menuRightText}>{rightText}</Text>}
                <ChevronIcon size={24} color="#D1D5DB" />
            </View>
        </TouchableOpacity>
    );
}

function MenuSection({ title, children }: MenuSectionProps) {
    return (
        <View style={styles.menuSection}>
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {title}
                </Text>
            </View>
            {children}
        </View>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DoctorSettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Data state
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ activeClients: 0 });

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Derived values
    const fullName = profile ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Doctor';
    const avatarUrl = profile?.avatarUrl;
    const activeClients = dashboardStats?.activeClients || 0;
    const specialization = profile?.specialization || t.registeredDietitian;

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Fetch profile and stats in parallel
            const [profileResponse, statsResponse] = await Promise.all([
                ProfileService.getDoctorProfile(),
                api.get<{ activeClients: number }>('/doctors/dashboard/stats').catch(() => ({ data: { activeClients: 0 } })),
            ]);

            setProfile(profileResponse);
            setDashboardStats({ activeClients: statsResponse.data.activeClients || 0 });
        } catch (error) {
            console.error('[Settings] Failed to load data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle avatar image selection and upload
    const handleEditAvatar = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    isRTL ? 'تحتاج إذن' : 'Permission needed',
                    isRTL ? 'نحتاج إذن للوصول للصور' : 'We need permission to access your photos'
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingAvatar(true);
                const imageUri = result.assets[0].uri;

                try {
                    // Upload to Cloudinary via backend
                    const uploadedUrl = await ProfileService.uploadProfileImage(imageUri);

                    // Update local profile state
                    setProfile(prev => prev ? { ...prev, avatarUrl: uploadedUrl } : prev);

                    // Update profile on backend
                    await ProfileService.updateDoctorProfile({ avatarUrl: uploadedUrl });

                    Alert.alert(
                        isRTL ? 'تم التحديث' : 'Updated',
                        isRTL ? 'تم تحديث صورتك الشخصية بنجاح' : 'Your profile photo has been updated successfully'
                    );
                } catch (uploadError) {
                    console.error('[Settings] Avatar upload error:', uploadError);
                    Alert.alert(
                        isRTL ? 'خطأ' : 'Error',
                        isRTL ? 'فشل رفع الصورة' : 'Failed to upload photo'
                    );
                } finally {
                    setIsUploadingAvatar(false);
                }
            }
        } catch (error) {
            console.error('[Settings] Avatar picker error:', error);
            setIsUploadingAvatar(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            t.signOut,
            t.signOutConfirm,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.signOut,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsSigningOut(true);
                            await AuthService.logout();
                            router.replace('/(auth)/LoginScreen');
                        } catch (error) {
                            console.error('Sign out error:', error);
                            Alert.alert(
                                isRTL ? 'خطأ' : 'Error',
                                isRTL ? 'فشل تسجيل الخروج' : 'Failed to sign out'
                            );
                        } finally {
                            setIsSigningOut(false);
                        }
                    },
                },
            ]
        );
    };

    // Show loading state
    if (isLoading) {
        return (
            <SafeAreaView edges={['left', 'right']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5073FE" />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Gradient Header */}
                <LinearGradient
                    colors={['#5073FE', '#02C3CD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.header, { paddingTop: insets.top }]}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <View style={{ flexDirection: isRTL ? 'row' : 'row-reverse', paddingHorizontal: 10 }} >
                            <ArrowLeft size={24} color={colors.white} />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.headerContent}>

                        {/* Avatar with Edit Button */}
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            onPress={handleEditAvatar}
                            disabled={isUploadingAvatar}
                            activeOpacity={0.8}
                        >
                            {avatarUrl ? (
                                <Image
                                    source={{ uri: avatarUrl }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarInitials}>
                                        {fullName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}

                            {/* Loading overlay */}
                            {isUploadingAvatar && (
                                <View style={styles.avatarLoadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}

                            {/* Edit button */}
                            <View style={styles.avatarEditButton}>
                                <Camera size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>

                        {/* User Info */}
                        <Text style={styles.userName}>{fullName}</Text>
                        <Text style={styles.userRole}>{specialization}</Text>

                        {/* Active Clients Badge */}
                        <View style={styles.clientsBadge}>
                            <Users size={14} color="#fff" />
                            <Text style={styles.clientsBadgeText}>
                                {activeClients} {t.activeClients}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
                <View style={{ paddingHorizontal: horizontalScale(10), marginTop: verticalScale(20) }}>
                    {/* Account Section */}
                    <MenuSection title={t.account}>
                        <MenuItem
                            icon={<User size={20} color="#355dfd" />}
                            label={t.editProfile}
                            onPress={() => router.push('/doctor/edit-profile')}
                        />
                    </MenuSection>



                    {/* Sign Out Button */}
                    <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                        disabled={isSigningOut}
                    >
                        {isSigningOut ? (
                            <ActivityIndicator size="small" color="#EB5757" />
                        ) : (
                            <Text style={styles.signOutText}>{t.signOut}</Text>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: verticalScale(16),
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    // Header
    header: {
        paddingBottom: verticalScale(40),
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: verticalScale(24),
        paddingHorizontal: horizontalScale(24),
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: verticalScale(12),
    },
    avatar: {
        width: horizontalScale(80),
        height: horizontalScale(80),
        borderRadius: horizontalScale(40),
        borderWidth: 4,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: ScaleFontSize(28),
        fontWeight: '700',
        color: '#5073FE',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: horizontalScale(20),
        height: horizontalScale(20),
        borderRadius: horizontalScale(10),
        backgroundColor: '#22C55E',
        borderWidth: 3,
        borderColor: '#5073FE',
    },
    avatarEditButton: {
        position: 'absolute',
        bottom: 0,
        right: 10,
        width: horizontalScale(28),
        height: horizontalScale(28),
        borderRadius: horizontalScale(14),
        backgroundColor: '#355dfd',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    avatarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: horizontalScale(40),
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '600',
        color: '#fff',
        marginBottom: verticalScale(4),
    },
    userRole: {
        fontSize: ScaleFontSize(14),
        color: 'rgba(255,255,255,0.9)',
        marginBottom: verticalScale(12),
    },
    clientsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(6),
        borderRadius: 100,
    },
    clientsBadgeText: {
        fontSize: ScaleFontSize(13),
        fontWeight: '500',
        color: '#fff',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {

        paddingBottom: verticalScale(100),
    },
    // Menu Section
    menuSection: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        marginBottom: verticalScale(20),
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sectionTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // Menu Item
    menuItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    languageRow: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        alignItems: 'center',
        gap: horizontalScale(16),
        flex: 1,
    },
    menuIconContainer: {
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: 8,
        backgroundColor: 'rgba(53, 93, 253, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTextContainer: {
        flex: 1,
    },
    menuLabel: {
        fontSize: ScaleFontSize(16),
        fontWeight: '400',
        color: colors.textPrimary,
    },
    menuSubLabel: {
        fontSize: ScaleFontSize(10),
        fontWeight: '700',
        color: '#355dfd',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: verticalScale(2),
    },
    menuItemRight: {
        alignItems: 'center',
        gap: horizontalScale(8),
    },
    menuRightText: {
        fontSize: ScaleFontSize(14),
        color: '#9CA3AF',
        fontWeight: '500',
    },
    // Sign Out
    signOutButton: {
        backgroundColor: colors.bgPrimary,
        borderRadius: 16,
        paddingVertical: verticalScale(16),
        alignItems: 'center',
        marginBottom: verticalScale(32),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    signOutText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '500',
        color: '#EB5757',
    },
});
