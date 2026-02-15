import { gradients } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale } from '@/src/core/utils/scaling';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowRight, Mail, Phone } from 'lucide-react-native';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../styles';
import { t } from '../translations';

// Client interface matching Mongdb data
interface ClientData {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
}

interface ProfileHeaderProps {
    client: ClientData;
    onBack: () => void;
    onCall: () => void;
    onEmail: () => void;
}

export function ProfileHeader({
                                  client,
                                  onBack,
                                  onCall,
                                  onEmail
                              }: ProfileHeaderProps) {
    const insets = useSafeAreaInsets();
    const initials = client.name
        .replace(/\s+/g, '')
        .slice(0, 2)
        .toUpperCase();

    return (
        <LinearGradient
            colors={gradients.primary}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientHeader}
        >
            {/* Header Navigation */}
            <View style={[styles.headerNav, {paddingTop: insets.top, flexDirection: isRTL ? 'row-reverse' : 'row'}]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                >
                    {isRTL ? (
                        <ArrowRight size={horizontalScale(24)} color="#FFFFFF"/>
                    ) : (
                        <ArrowLeft size={horizontalScale(24)} color="#FFFFFF"/>
                    )}
                </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    {client.avatar ? (
                        <Image source={{uri: client.avatar}} style={styles.avatar}/>
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarPlaceholderText}>
                                {initials}
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.clientName}>{client.name}</Text>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>{t.premiumClient}</Text>
                </View>
                {/* Contact Icons */}
                <View style={[styles.contactIcons, {flexDirection: isRTL ? 'row' : 'row-reverse'}]}>
                    {client.email && (
                        <TouchableOpacity onPress={onEmail}>
                            <Mail size={horizontalScale(18)} color="rgba(255,255,255,0.9)"/>
                        </TouchableOpacity>
                    )}
                    {client.email && client.phone && (
                        <View style={styles.iconDivider}/>
                    )}
                    {client.phone && (
                        <TouchableOpacity onPress={onCall}>
                            <Phone size={horizontalScale(18)} color="rgba(255,255,255,0.9)"/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </LinearGradient>
    );
}
