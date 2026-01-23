/**
 * EditProfileScreen - Edit doctor/coach profile
 * Features: Photo upload, personal info editing, availability settings
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
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    Camera,
    User,
    Clock,
    ChevronDown,
    Mail,
} from 'lucide-react-native';
import { colors } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ProfileService, DoctorProfile, UpdateProfileData } from '@/src/shared/services/profile/profile.service';

// =============================================================================
// TRANSLATIONS
// =============================================================================

import { getDoctorProfileTranslations } from '@/src/features/settings/locales/doctor-profile.locale';

// =============================================================================
// TRANSLATIONS
// =============================================================================

const t = getDoctorProfileTranslations();

// =============================================================================
// TYPES
// =============================================================================

type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

interface DayAvailability {
    enabled: boolean;
    from: number;  // Minutes since midnight (0-1440)
    to: number;    // Minutes since midnight (0-1440)
}

type AvailabilityState = Record<DayKey, DayAvailability>;

// =============================================================================
// TIME UTILITIES
// =============================================================================

function generateTimeOptions(): Array<{ label: string; minutes: number }> {
    const options: Array<{ label: string; minutes: number }> = [];
    for (let minutes = 540; minutes <= 1440; minutes += 30) {
        options.push({
            label: minutesToLabel(minutes === 1440 ? 0 : minutes, minutes === 1440),
            minutes: minutes,
        });
    }
    return options;
}

function minutesToLabel(minutes: number, isMidnight = false): string {
    if (isMidnight) return '12:00 AM';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
}

function getValidToOptions(fromMinutes: number): Array<{ label: string; minutes: number }> {
    const allOptions = generateTimeOptions();
    return allOptions.filter(opt => opt.minutes > fromMinutes);
}

function validateToTime(fromMinutes: number, toMinutes: number): number {
    if (toMinutes <= fromMinutes) {
        return Math.min(fromMinutes + 30, 1440);
    }
    return toMinutes;
}

const TIME_OPTIONS = generateTimeOptions();

const DEFAULT_AVAILABILITY: AvailabilityState = {
    sunday: { enabled: true, from: 540, to: 1080 },
    monday: { enabled: true, from: 540, to: 1080 },
    tuesday: { enabled: true, from: 540, to: 1080 },
    wednesday: { enabled: true, from: 540, to: 1080 },
    thursday: { enabled: true, from: 540, to: 1080 },
    friday: { enabled: false, from: 540, to: 1080 },
    saturday: { enabled: false, from: 540, to: 1080 },
};

const DAY_KEYS: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// =============================================================================
// COMPONENTS
// =============================================================================

interface DayRowProps {
    day: DayKey;
    dayLabel: string;
    availability: DayAvailability;
    onToggle: (day: DayKey) => void;
    onFromChange: (day: DayKey, value: number) => void;
    onToChange: (day: DayKey, value: number) => void;
}

function DayRow({ day, dayLabel, availability, onToggle, onFromChange, onToChange }: DayRowProps) {
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const validToOptions = getValidToOptions(availability.from);
    const isDropdownOpen = showFromPicker || showToPicker;

    return (
        <View style={[
            styles.dayRow,
            !availability.enabled && styles.dayRowDisabled,
            isDropdownOpen && styles.dayRowActive
        ]}>
            <View style={[styles.dayHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[
                    styles.dayLabel,
                    !availability.enabled && styles.dayLabelDisabled,
                    { textAlign: isRTL ? 'right' : 'left' }
                ]}>
                    {dayLabel}
                </Text>
                <Switch
                    value={availability.enabled}
                    onValueChange={() => onToggle(day)}
                    trackColor={{ true: '#ea5757', false: '#E5E7EB' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#e5e5e5"
                    style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
                />
            </View>

            {availability.enabled ? (
                <View style={[styles.timePickerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {/* From Time */}
                    <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>{isRTL ? 'من' : 'From'}</Text>
                        <TouchableOpacity
                            style={styles.timePicker}
                            onPress={() => {
                                setShowFromPicker(!showFromPicker);
                                setShowToPicker(false);
                            }}
                        >
                            <Text style={styles.timeText}>
                                {minutesToLabel(availability.from)}
                            </Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {showFromPicker && (
                            <View style={styles.timeDropdown}>
                                <ScrollView style={styles.timeDropdownScroll} nestedScrollEnabled>
                                    {TIME_OPTIONS.map((option) => (
                                        <TouchableOpacity
                                            key={option.minutes}
                                            style={[
                                                styles.timeOption,
                                                availability.from === option.minutes && styles.timeOptionSelected
                                            ]}
                                            onPress={() => {
                                                onFromChange(day, option.minutes);
                                                setShowFromPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                availability.from === option.minutes && styles.timeOptionTextSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <Text style={styles.timeSeparator}>-</Text>

                    {/* To Time */}
                    <View style={styles.timePickerGroup}>
                        <Text style={styles.timeLabel}>{isRTL ? 'إلى' : 'To'}</Text>
                        <TouchableOpacity
                            style={styles.timePicker}
                            onPress={() => {
                                setShowToPicker(!showToPicker);
                                setShowFromPicker(false);
                            }}
                        >
                            <Text style={styles.timeText}>
                                {minutesToLabel(availability.to === 1440 ? 0 : availability.to, availability.to === 1440)}
                            </Text>
                            <ChevronDown size={16} color={colors.textSecondary} />
                        </TouchableOpacity>

                        {showToPicker && (
                            <View style={styles.timeDropdown}>
                                <ScrollView style={styles.timeDropdownScroll} nestedScrollEnabled>
                                    {validToOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.minutes}
                                            style={[
                                                styles.timeOption,
                                                availability.to === option.minutes && styles.timeOptionSelected
                                            ]}
                                            onPress={() => {
                                                onToChange(day, option.minutes);
                                                setShowToPicker(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.timeOptionText,
                                                availability.to === option.minutes && styles.timeOptionTextSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
            ) : (
                <View style={styles.notAvailableContainer}>
                    <Text style={styles.notAvailableText}>{t.notAvailable}</Text>
                </View>
            )}
        </View>
    );
}

// =============================================================================
// LOADING OVERLAY COMPONENT
// =============================================================================

function LoadingOverlay({ message }: { message: string }) {
    return (
        <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ea5757" />
                <Text style={styles.loadingText}>{message}</Text>
            </View>
        </View>
    );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function EditProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Form state
    const [fullName, setFullName] = useState('');
    const [professionalTitle, setProfessionalTitle] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [availability, setAvailability] = useState<AvailabilityState>(DEFAULT_AVAILABILITY);
    const [userAvatar, setUserAvatar] = useState('');

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Load profile on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const profile = await ProfileService.getDoctorProfile();

            // Set form values from profile
            setFullName(`${profile.firstName} ${profile.lastName || ''}`.trim());
            setPhone(profile.phone || '');
            setEmail(profile.email || '');
            setProfessionalTitle(profile.specialization || '');
            setBio(profile.bio || profile.specialization || '');
            setUserAvatar(profile.avatarUrl || '');

            // Set availability from profile if exists
            if (profile.workingHours?.days) {
                const days = profile.workingHours.days;
                const newAvailability: AvailabilityState = { ...DEFAULT_AVAILABILITY };

                DAY_KEYS.forEach(day => {
                    if (days[day]) {
                        newAvailability[day] = {
                            enabled: days[day].enabled ?? true,
                            from: days[day].from ?? 540,
                            to: days[day].to ?? 1080,
                        };
                    }
                });

                setAvailability(newAvailability);
            }
        } catch (error) {
            console.error('[EditProfile] Failed to load profile:', error);
            Alert.alert(t.error, t.failedToLoad);
        } finally {
            setIsLoading(false);
        }
    };

    // Handlers
    const handleToggleDay = (day: DayKey) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], enabled: !prev[day].enabled }
        }));
    };

    const handleFromChange = (day: DayKey, value: number) => {
        setAvailability(prev => {
            const currentTo = prev[day].to;
            const validatedTo = validateToTime(value, currentTo);
            return {
                ...prev,
                [day]: { ...prev[day], from: value, to: validatedTo }
            };
        });
    };

    const handleToChange = (day: DayKey, value: number) => {
        setAvailability(prev => ({
            ...prev,
            [day]: { ...prev[day], to: value }
        }));
    };

    const handleResetAvailability = () => {
        setAvailability(DEFAULT_AVAILABILITY);
    };

    const handleChangePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(t.permissionNeeded, t.photoPermission);
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsUploadingPhoto(true);
                const imageUri = result.assets[0].uri;

                try {
                    // Upload to Cloudinary via backend
                    const uploadedUrl = await ProfileService.uploadProfileImage(imageUri);
                    setUserAvatar(uploadedUrl);

                    Alert.alert(
                        t.success,
                        isRTL ? 'تم تحديث صورتك الشخصية بنجاح' : 'Your profile photo has been updated successfully'
                    );
                } catch (uploadError) {
                    console.error('[EditProfile] Photo upload error:', uploadError);
                    Alert.alert(t.error, isRTL ? 'فشل رفع الصورة' : 'Failed to upload photo');
                } finally {
                    setIsUploadingPhoto(false);
                }
            }
        } catch (error) {
            console.error('[EditProfile] Photo picker error:', error);
            setIsUploadingPhoto(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert(t.error, isRTL ? 'الاسم مطلوب' : 'Name is required');
            return;
        }

        setIsSaving(true);

        try {
            // Parse full name
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            // Build working hours object
            const workingHours = {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                days: {} as Record<string, { enabled: boolean; from: number; to: number }>,
            };

            DAY_KEYS.forEach(day => {
                workingHours.days[day] = {
                    enabled: availability[day].enabled,
                    from: availability[day].from,
                    to: availability[day].to,
                };
            });

            // Build update data
            const updateData: UpdateProfileData = {
                firstName,
                lastName,
                phone,
                specialization: professionalTitle,
                workingHours,
            };

            // Only include avatarUrl if it changed
            if (userAvatar) {
                updateData.avatarUrl = userAvatar;
            }

            // Make API call
            await ProfileService.updateDoctorProfile(updateData);

            Alert.alert(t.success, t.profileUpdated, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('[EditProfile] Failed to save:', error);
            Alert.alert(t.error, t.failedToUpdate);
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state while fetching initial data
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t.title}</Text>
                    <View style={styles.saveButton} />
                </View>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#ea5757" />
                    <Text style={styles.loadingTextCenter}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Full-page loading overlay when saving */}
                {isSaving && <LoadingOverlay message={t.saving} />}

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top, flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={isSaving}
                    >
                        <ArrowLeft size={24} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>{t.title}</Text>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#ea5757" />
                        ) : (
                            <Text style={styles.saveButtonText}>{t.save}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Photo Section */}
                    <View style={styles.photoSection}>
                        <TouchableOpacity
                            style={styles.avatarWrapper}
                            onPress={handleChangePhoto}
                            disabled={isUploadingPhoto || isSaving}
                        >
                            <LinearGradient
                                colors={['#ea5757', 'rgba(234, 87, 87, 0.4)']}
                                style={styles.avatarGradient}
                            >
                                <View style={styles.avatarInner}>
                                    {userAvatar ? (
                                        <Image
                                            source={{ uri: userAvatar }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarInitials}>
                                                {fullName.charAt(0).toUpperCase() || 'D'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>

                            {isUploadingPhoto && (
                                <View style={styles.photoLoadingOverlay}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            )}

                            <View style={styles.cameraButton}>
                                <Camera size={16} color="#ea5757" />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.changePhotoButton}
                            onPress={handleChangePhoto}
                            disabled={isUploadingPhoto || isSaving}
                        >
                            <Text style={styles.changePhotoText}>{t.changePhoto}</Text>
                        </TouchableOpacity>

                        <Text style={styles.photoHint}>{t.photoHint}</Text>
                    </View>

                    {/* Personal Information Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <User size={14} color="#ea5757" />
                            <Text style={styles.cardTitle}>{t.personalInfo}</Text>
                        </View>

                        {/* Full Name */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.fullName}
                            </Text>
                            <TextInput
                                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder={t.fullNamePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                editable={!isSaving}
                            />
                        </View>

                        {/* Professional Title */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.professionalTitle}
                            </Text>
                            <TextInput
                                style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={professionalTitle}
                                onChangeText={setProfessionalTitle}
                                placeholder={t.professionalTitlePlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                editable={!isSaving}
                            />
                        </View>

                        {/* Bio */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.bio}
                            </Text>
                            <TextInput
                                style={[styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder={t.bioPlaceholder}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                editable={!isSaving}
                            />
                        </View>

                        {/* Email (Read Only) */}
                        <View style={[styles.inputGroup, styles.inputGroupDisabled]}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.email}
                            </Text>
                            <View style={[styles.emailContainer, { flexDirection: isRTL ? 'row-reverse' : 'row-reverse' }]}>
                                <TextInput
                                    style={[styles.inputDisabled, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={email}
                                    editable={false}
                                />
                                <Mail size={16} color={colors.textSecondary} />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                                {t.phone}
                            </Text>
                            <View style={[styles.phoneContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryCodeText}>+20</Text>
                                </View>
                                <TextInput
                                    style={[styles.phoneInput, { textAlign: isRTL ? 'right' : 'left' }]}
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={colors.textSecondary}
                                    editable={!isSaving}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Availability Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row-reverse' }]}>
                                <Clock size={14} color="#ea5757" />
                                <Text style={styles.cardTitle}>{t.availability}</Text>
                            </View>
                            <TouchableOpacity onPress={handleResetAvailability} disabled={isSaving}>
                                <Text style={styles.resetText}>{t.resetDefault}</Text>
                            </TouchableOpacity>
                        </View>

                        {DAY_KEYS.map((day) => (
                            <DayRow
                                key={day}
                                day={day}
                                dayLabel={t.days[day]}
                                availability={availability[day]}
                                onToggle={handleToggleDay}
                                onFromChange={handleFromChange}
                                onToChange={handleToChange}
                            />
                        ))}
                    </View>

                    {/* Bottom spacing for the save button */}
                    <View style={{ height: verticalScale(100) }} />
                </ScrollView>

                {/* Sticky Save Button */}
                <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={styles.saveChangesButton}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.9}
                    >
                        <LinearGradient
                            colors={['#ea5757', '#ff8a8a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveChangesGradient}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.saveChangesText}>{t.saveChanges}</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f6f6',
    },
    // Center container for loading state
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingTextCenter: {
        marginTop: verticalScale(16),
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    // Loading overlay
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: horizontalScale(40),
        paddingVertical: verticalScale(30),
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    loadingText: {
        marginTop: verticalScale(16),
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    // Header
    header: {
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(12),
        backgroundColor: '#f8f6f6',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: horizontalScale(20),
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        paddingHorizontal: horizontalScale(8),
    },
    saveButtonText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: '#ea5757',
    },
    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: horizontalScale(16),
        paddingBottom: verticalScale(140)
    },
    // Photo Section
    photoSection: {
        alignItems: 'center',
        paddingVertical: verticalScale(32),
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarGradient: {
        padding: 4,
        borderRadius: 70,
    },
    avatarInner: {
        backgroundColor: '#fff',
        borderRadius: 66,
        padding: 4,
    },
    avatar: {
        width: horizontalScale(112),
        height: horizontalScale(112),
        borderRadius: horizontalScale(56),
    },
    avatarPlaceholder: {
        backgroundColor: '#E8F4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontSize: ScaleFontSize(40),
        fontWeight: '700',
        color: '#ea5757',
    },
    photoLoadingOverlay: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        borderRadius: 66,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        left: 0,
        backgroundColor: '#fff',
        width: horizontalScale(36),
        height: horizontalScale(36),
        borderRadius: horizontalScale(18),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    changePhotoButton: {
        marginTop: verticalScale(16),
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(8),
        backgroundColor: 'rgba(234, 87, 87, 0.1)',
        borderRadius: 100,
    },
    changePhotoText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#ea5757',
    },
    photoHint: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        marginTop: verticalScale(8),
    },
    // Cards
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: horizontalScale(20),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f5f5f5',
    },
    cardHeader: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(8),
        marginBottom: verticalScale(16),
    },
    cardHeaderRow: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(8),
    },
    cardTitle: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    resetText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#ea5757',
    },
    // Input Groups
    inputGroup: {
        marginBottom: verticalScale(20),
    },
    inputGroupDisabled: {
        opacity: 0.7,
    },
    inputLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: verticalScale(8),
        marginLeft: horizontalScale(4),
    },
    input: {
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
    },
    textArea: {
        height: verticalScale(100),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(12),
        paddingVertical: verticalScale(10),
        fontSize: ScaleFontSize(14),
        fontWeight: '400',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
        lineHeight: 22,
    },
    emailContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderColor: '#e6d0d0',
        height: verticalScale(44),
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        backgroundColor: '#f0f0f0',
    },
    inputDisabled: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textSecondary,
        backgroundColor: '#f0f0f0',
    },
    phoneContainer: {
        flexDirection: 'row',
        gap: horizontalScale(8),
    },
    countryCode: {
        width: horizontalScale(80),
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f6f6',
    },
    countryCodeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    phoneInput: {
        flex: 1,
        height: verticalScale(44),
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
        paddingHorizontal: horizontalScale(16),
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
        backgroundColor: '#f8f6f6',
    },
    // Day Row
    dayRow: {
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.03)',
        position: 'relative',
    },
    dayRowDisabled: {
        opacity: 0.6,
    },
    dayRowActive: {
        zIndex: 100,
        overflow: 'visible',
    },
    dayHeader: {
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(12),
    },
    dayLabel: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    dayLabelDisabled: {
        color: colors.textSecondary,
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
        paddingLeft: horizontalScale(4),
    },
    timePicker: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: verticalScale(40),
        paddingHorizontal: horizontalScale(12),
        backgroundColor: '#f8f6f6',
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderRadius: 10,
    },
    timeText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    timeSeparator: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    timePickerGroup: {
        flex: 1,
        position: 'relative',
        zIndex: 10,
    },
    timeLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: '#ea5757',
        marginBottom: verticalScale(4),
        textAlign: 'center',
    },
    notAvailableContainer: {
        flex: 1,
        height: verticalScale(36),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e6d0d0',
        borderStyle: 'dashed',
    },
    notAvailableText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: colors.textSecondary,
    },
    timeDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1000,
        borderWidth: 1,
        borderColor: '#e6d0d0',
        maxHeight: verticalScale(150),
    },
    timeDropdownScroll: {
        maxHeight: verticalScale(150),
    },
    timeOption: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    timeOptionSelected: {
        backgroundColor: 'rgba(234, 87, 87, 0.1)',
    },
    timeOptionText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    timeOptionTextSelected: {
        color: '#ea5757',
        fontWeight: '600',
    },
    // Sticky Bottom
    stickyBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        backgroundColor: 'rgba(248, 246, 246, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    saveChangesButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#ea5757',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    saveChangesGradient: {
        height: verticalScale(52),
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveChangesText: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: '#fff',
    },
});
