import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    TrendingUp,
    Bell,
    MessageSquare,
    Activity,
    User,
} from 'lucide-react-native';
import { colors, gradients } from '@/src/core/constants/Theme';
import { isRTL } from '@/src/core/constants/translation';
import { horizontalScale, ScaleFontSize, verticalScale } from '@/src/core/utils/scaling';
import { clientsService } from '@/src/shared/services/clients.service';

// ============ TRANSLATIONS ============
const t = {
    title: isRTL ? 'ملف العميل' : 'Client Profile',
    weightProgress: isRTL ? 'تقدم الوزن' : 'Weight Progress',
    startWeight: isRTL ? 'الوزن الابتدائي' : 'Start Weight',
    currentWeight: isRTL ? 'الوزن الحالي' : 'Current Weight',
    targetWeight: isRTL ? 'الوزن المستهدف' : 'Target Weight',
    activity: isRTL ? 'النشاط الأخير' : 'Recent Activity',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    sendMessage: isRTL ? 'إرسال رسالة' : 'Send Message',
    noActivity: isRTL ? 'لا يوجد نشاط' : 'No activity yet',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    error: isRTL ? 'خطأ' : 'Error',
    reminderSent: isRTL ? 'تم إرسال التذكير' : 'Reminder sent successfully',
    kg: 'kg',
};

// ============ TYPES ============
interface ClientProfile {
    id: string;
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
    startWeight: number;
    currentWeight: number;
    targetWeight: number;
    progress: number;
}

interface ActivityItem {
    id: string;
    type: string;
    description: string;
    timestamp: string;
}

// ============ COMPONENTS ============

function WeightCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={styles.weightCard}>
            <Text style={styles.weightLabel}>{label}</Text>
            <Text style={[styles.weightValue, { color }]}>{value} {t.kg}</Text>
        </View>
    );
}

function ActivityItemCard({ item }: { item: ActivityItem }) {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return isRTL ? 'الآن' : 'Just now';
        if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
        if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
        return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    };

    return (
        <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
                <Activity size={horizontalScale(16)} color={colors.primaryDark} />
            </View>
            <View style={styles.activityContent}>
                <Text style={styles.activityDescription}>{item.description}</Text>
                <Text style={styles.activityTime}>{formatTime(item.timestamp)}</Text>
            </View>
        </View>
    );
}

// ============ MAIN COMPONENT ============

export default function ClientProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [client, setClient] = useState<ClientProfile | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSendingReminder, setIsSendingReminder] = useState(false);

    // Fetch client data
    const fetchClientData = useCallback(async () => {
        if (!id) return;

        try {
            const [progressData, activityData] = await Promise.all([
                clientsService.getClientProgress(id),
                clientsService.getClientActivity(id, 10),
            ]);

            // Set client from progress data
            setClient({
                id,
                firstName: '', // Will need to get from a different endpoint or pass via params
                lastName: '',
                email: '',
                startWeight: progressData.startWeight,
                currentWeight: progressData.currentWeight,
                targetWeight: progressData.targetWeight,
                progress: Math.round(
                    ((progressData.startWeight - progressData.currentWeight) /
                        (progressData.startWeight - progressData.targetWeight)) * 100
                ),
            });

            setActivity(activityData);
        } catch (error) {
            console.error('Error fetching client data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchClientData();
        setRefreshing(false);
    }, [fetchClientData]);

    const handleSendReminder = useCallback(async () => {
        if (!id) return;

        setIsSendingReminder(true);
        try {
            await clientsService.sendReminder(id, 'general');
            Alert.alert(t.sendReminder, t.reminderSent);
        } catch (error) {
            Alert.alert(t.error, (error as Error).message);
        } finally {
            setIsSendingReminder(false);
        }
    }, [id]);

    const handleSendMessage = useCallback(() => {
        router.push({
            pathname: '/doctor/(tabs)/messages',
            params: { openChatWithClient: id },
        } as any);
    }, [router, id]);

    // Loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const clientName = client ? `${client.firstName} ${client.lastName || ''}`.trim() || 'Client' : 'Client';

    return (
        <SafeAreaView edges={['left', 'right']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={horizontalScale(24)} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <View style={{ width: horizontalScale(40) }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primaryDark}
                    />
                }
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {client?.avatarUrl ? (
                            <Image source={{ uri: client.avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={horizontalScale(40)} color="#FFFFFF" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.clientName}>{clientName}</Text>
                    {client?.email && (
                        <View style={styles.contactRow}>
                            <Mail size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.contactText}>{client.email}</Text>
                        </View>
                    )}
                    {client?.phone && (
                        <View style={styles.contactRow}>
                            <Phone size={horizontalScale(14)} color={colors.textSecondary} />
                            <Text style={styles.contactText}>{client.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Weight Progress Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.weightProgress}</Text>
                    <View style={styles.weightCards}>
                        <WeightCard
                            label={t.startWeight}
                            value={client?.startWeight || 0}
                            color={colors.textSecondary}
                        />
                        <WeightCard
                            label={t.currentWeight}
                            value={client?.currentWeight || 0}
                            color={colors.primaryDark}
                        />
                        <WeightCard
                            label={t.targetWeight}
                            value={client?.targetWeight || 0}
                            color={colors.success}
                        />
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBackground}>
                            <LinearGradient
                                colors={gradients.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[
                                    styles.progressBarFill,
                                    { width: `${Math.min(client?.progress || 0, 100)}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>{client?.progress || 0}%</Text>
                    </View>
                </View>

                {/* Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t.activity}</Text>
                    {activity.length === 0 ? (
                        <View style={styles.emptyActivity}>
                            <Activity size={horizontalScale(32)} color={colors.textSecondary} />
                            <Text style={styles.emptyText}>{t.noActivity}</Text>
                        </View>
                    ) : (
                        activity.map((item) => (
                            <ActivityItemCard key={item.id} item={item} />
                        ))
                    )}
                </View>

                {/* Spacer for bottom buttons */}
                <View style={{ height: verticalScale(100) }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + verticalScale(16) }]}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSendReminder}
                    disabled={isSendingReminder}
                    activeOpacity={0.7}
                >
                    {isSendingReminder ? (
                        <ActivityIndicator size="small" color={colors.primaryDark} />
                    ) : (
                        <>
                            <Bell size={horizontalScale(18)} color={colors.primaryDark} />
                            <Text style={styles.secondaryButtonText}>{t.sendReminder}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} onPress={handleSendMessage}>
                    <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.primaryButton}
                    >
                        <MessageSquare size={horizontalScale(18)} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>{t.sendMessage}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ============ STYLES ============

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: horizontalScale(40),
        height: horizontalScale(40),
        borderRadius: horizontalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    content: {
        flex: 1,
    },
    profileCard: {
        backgroundColor: colors.bgPrimary,
        margin: horizontalScale(16),
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    avatarContainer: {
        width: horizontalScale(80),
        height: horizontalScale(80),
        borderRadius: horizontalScale(40),
        marginBottom: verticalScale(12),
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientName: {
        fontSize: ScaleFontSize(20),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(8),
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(6),
        marginTop: verticalScale(4),
    },
    contactText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    section: {
        backgroundColor: colors.bgPrimary,
        marginHorizontal: horizontalScale(16),
        marginBottom: verticalScale(16),
        borderRadius: horizontalScale(16),
        padding: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: verticalScale(16),
    },
    weightCards: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: horizontalScale(12),
    },
    weightCard: {
        flex: 1,
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(12),
        alignItems: 'center',
    },
    weightLabel: {
        fontSize: ScaleFontSize(11),
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: verticalScale(4),
    },
    weightValue: {
        fontSize: ScaleFontSize(16),
        fontWeight: '700',
    },
    progressContainer: {
        marginTop: verticalScale(16),
        flexDirection: 'row',
        alignItems: 'center',
        gap: horizontalScale(12),
    },
    progressBarBackground: {
        flex: 1,
        height: verticalScale(10),
        backgroundColor: '#E5E7EB',
        borderRadius: horizontalScale(5),
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: horizontalScale(5),
    },
    progressText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: colors.success,
    },
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: verticalScale(24),
        gap: verticalScale(8),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    activityIcon: {
        width: horizontalScale(32),
        height: horizontalScale(32),
        borderRadius: horizontalScale(16),
        backgroundColor: 'rgba(81, 115, 251, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: horizontalScale(12),
    },
    activityContent: {
        flex: 1,
    },
    activityDescription: {
        fontSize: ScaleFontSize(14),
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    activityTime: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: horizontalScale(16),
        paddingTop: verticalScale(16),
        gap: horizontalScale(12),
        backgroundColor: colors.bgPrimary,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    secondaryButton: {
        flex: 1,
        height: verticalScale(48),
        borderRadius: horizontalScale(12),
        borderWidth: 1.5,
        borderColor: colors.primaryDark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
    },
    secondaryButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.primaryDark,
    },
    primaryButton: {
        flex: 1,
        height: verticalScale(48),
        borderRadius: horizontalScale(12),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: horizontalScale(8),
        paddingHorizontal: horizontalScale(20),
    },
    primaryButtonText: {
        fontSize: ScaleFontSize(14),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
