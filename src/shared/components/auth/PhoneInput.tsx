import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/core/constants/Theme';
import {
    horizontalScale,
    verticalScale,
    ScaleFontSize,
} from '@/src/core/utils/scaling';

interface CountryCode {
    code: string;
    name: string;
    dial_code: string;
    flag: string;
}

// Common country codes with focus on Egypt
const countryCodes: CountryCode[] = [
    { code: 'EG', name: 'مصر', dial_code: '+20', flag: '🇪🇬' },
    { code: 'SA', name: 'السعودية', dial_code: '+966', flag: '🇸🇦' },
    { code: 'AE', name: 'الإمارات', dial_code: '+971', flag: '🇦🇪' },
    { code: 'KW', name: 'الكويت', dial_code: '+965', flag: '🇰🇼' },
    { code: 'QA', name: 'قطر', dial_code: '+974', flag: '🇶🇦' },
    { code: 'BH', name: 'البحرين', dial_code: '+973', flag: '🇧🇭' },
    { code: 'OM', name: 'عمان', dial_code: '+968', flag: '🇴🇲' },
    { code: 'JO', name: 'الأردن', dial_code: '+962', flag: '🇯🇴' },
    { code: 'LB', name: 'لبنان', dial_code: '+961', flag: '🇱🇧' },
    { code: 'SY', name: 'سوريا', dial_code: '+963', flag: '🇸🇾' },
    { code: 'IQ', name: 'العراق', dial_code: '+964', flag: '🇮🇶' },
    { code: 'YE', name: 'اليمن', dial_code: '+967', flag: '🇾🇪' },
    { code: 'PS', name: 'فلسطين', dial_code: '+970', flag: '🇵🇸' },
    { code: 'LY', name: 'ليبيا', dial_code: '+218', flag: '🇱🇾' },
    { code: 'TN', name: 'تونس', dial_code: '+216', flag: '🇹🇳' },
    { code: 'DZ', name: 'الجزائر', dial_code: '+213', flag: '🇩🇿' },
    { code: 'MA', name: 'المغرب', dial_code: '+212', flag: '🇲🇦' },
    { code: 'SD', name: 'السودان', dial_code: '+249', flag: '🇸🇩' },
];

interface PhoneInputProps {
    value: string;
    onChangeText: (text: string) => void;
    countryCode: string;
    onCountryCodeChange: (code: string) => void;
    error?: string;
    editable?: boolean;
}

export default function PhoneInput({
    value,
    onChangeText,
    countryCode,
    onCountryCodeChange,
    error,
    editable = true,
}: PhoneInputProps) {
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    const selectedCountry = countryCodes.find(c => c.dial_code === countryCode) || countryCodes[0];

    const handlePhoneChange = (text: string) => {
        // Only allow digits
        const cleaned = text.replace(/[^0-9]/g, '');
        onChangeText(cleaned);
    };

    const renderCountryItem = ({ item }: { item: CountryCode }) => (
        <TouchableOpacity
            style={styles.countryItem}
            onPress={() => {
                onCountryCodeChange(item.dial_code);
                setShowCountryPicker(false);
            }}
        >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryDialCode}>{item.dial_code}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, error && styles.inputContainerError]}>
                {/* Country Code Selector */}
                <TouchableOpacity
                    style={styles.countryCodeButton}
                    onPress={() => setShowCountryPicker(true)}
                    disabled={!editable}
                >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.dial_code}</Text>
                    <Ionicons
                        name="chevron-down"
                        size={horizontalScale(16)}
                        color={colors.textSecondary}
                    />
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Phone Number Input */}
                <TextInput
                    style={styles.phoneInput}
                    value={value}
                    onChangeText={handlePhoneChange}
                    placeholder="رقم الهاتف"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    editable={editable}
                    maxLength={11}
                />
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons
                        name="alert-circle"
                        size={horizontalScale(14)}
                        color={colors.error}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* Country Picker Modal */}
            <Modal
                visible={showCountryPicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCountryPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>اختر رمز الدولة</Text>
                            <TouchableOpacity
                                onPress={() => setShowCountryPicker(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons
                                    name="close"
                                    size={horizontalScale(24)}
                                    color={colors.textPrimary}
                                />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={countryCodes}
                            renderItem={renderCountryItem}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: horizontalScale(12),
        borderWidth: 2,
        borderColor: colors.border,
        paddingHorizontal: horizontalScale(12),
        height: verticalScale(56),
    },
    inputContainerError: {
        borderColor: colors.error,
    },
    countryCodeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        paddingRight: horizontalScale(8),
    },
    countryFlag: {
        fontSize: ScaleFontSize(20),
    },
    countryCode: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    divider: {
        width: 1,
        height: verticalScale(28),
        backgroundColor: colors.border,
        marginHorizontal: horizontalScale(8),
    },
    phoneInput: {
        flex: 1,
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        textAlign: 'right',
        paddingVertical: 0,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(8),
        gap: horizontalScale(6),
    },
    errorText: {
        fontSize: ScaleFontSize(12),
        color: colors.error,
        writingDirection: 'rtl',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.white,
        borderTopLeftRadius: horizontalScale(24),
        borderTopRightRadius: horizontalScale(24),
        maxHeight: '70%',
        paddingBottom: verticalScale(20),
    },
    modalHeader: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: horizontalScale(20),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: horizontalScale(4),
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: verticalScale(14),
        paddingHorizontal: horizontalScale(20),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: horizontalScale(12),
    },
    countryName: {
        flex: 1,
        fontSize: ScaleFontSize(16),
        color: colors.textPrimary,
        writingDirection: 'rtl',
        textAlign: 'right',
    },
    countryDialCode: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        fontWeight: '500',
    },
});
