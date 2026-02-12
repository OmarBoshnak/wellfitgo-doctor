/**
 * NotificationPanel - Facebook-style notification dropdown
 * Shows unread messages and weight log updates from clients
 */
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    FlatList,
    Image,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { useNotifications, NotificationItem } from '../hooks/useNotifications';

interface NotificationPanelProps {
    visible: boolean;
    onClose: () => void;
    onNotificationPress?: (notification: NotificationItem) => void;
}

// Translation strings
const t = {
    notifications: isRTL ? 'الإشعارات' : 'Notifications',
    noNotifications: isRTL ? 'لا توجد إشعارات جديدة' : 'No new notifications',
    markAllRead: isRTL ? 'تحديد الكل كمقروء' : 'Mark all as read',
    newMessage: isRTL ? 'رسالة جديدة' : 'New message',
    weightUpdate: isRTL ? 'تحديث الوزن' : 'Weight update',
};

export function NotificationPanel({
    visible,
    onClose,
    onNotificationPress
}: NotificationPanelProps) {
    // Use the notifications hook for backend integration
    const { notifications, isLoading, markAsRead, markAllAsRead, refetch } = useNotifications();

    const formatTime = (value: string) => {
        if (!value.includes(':')) return value;

        const timeMatch = value.match(/^\d{1,2}:\d{2}:\d{2}/);
        if (!timeMatch) return value;

        const [hours, minutes] = timeMatch[0].split(':');
        return value.replace(timeMatch[0], `${hours}:${minutes}`);
    };

    // Refetch when panel becomes visible
    React.useEffect(() => {
        if (visible) {
            refetch();
        }
    }, [visible, refetch]);

    // Get icon based on notification type
    const getNotificationIcon = (type: 'message' | 'weight_log') => {
        switch (type) {
            case 'message':
                return 'chatbubble';
            case 'weight_log':
                return 'scale';
            default:
                return 'notifications';
        }
    };

    // Get icon color based on notification type
    const getIconColor = (type: 'message' | 'weight_log') => {
        switch (type) {
            case 'message':
                return '#2563EB'; // Blue
            case 'weight_log':
                return '#16A34A'; // Green
            default:
                return colors.textSecondary;
        }
    };

    // Render individual notification item
    const handleNotificationPress = (item: NotificationItem) => {
        if (!item.isRead) {
            void markAsRead([item.id]);
        }
        onNotificationPress?.(item);
    };

    const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
        <TouchableOpacity
            style={[styles.notificationItem, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            {/* Unread indicator */}
            {!item.isRead && <View style={styles.unreadDot} />}


            {/* Content */}
            <View style={styles.contentContainer}>
                <Text
                    style={[styles.notificationTitle, { textAlign: isRTL ? 'right' : 'left' }]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                <Text
                    style={[styles.notificationSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}
                    numberOfLines={2}
                >
                    {item.subtitle}
                </Text>
                <Text
                    style={[styles.timestamp, { textAlign: isRTL ? 'right' : 'left' }]}
                >
                    {formatTime(item.relativeTime)}
                </Text>
            </View>

            {/* Avatar or Icon */}
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.iconAvatar, { backgroundColor: `${getIconColor(item.type)}20` }]}>
                        <Ionicons
                            name={getNotificationIcon(item.type)}
                            size={18}
                            color={getIconColor(item.type)}
                        />
                    </View>
                )}
                {/* Notification type indicator */}
                <View style={[styles.typeIndicator, { backgroundColor: getIconColor(item.type) }]}>
                    <Ionicons
                        name={getNotificationIcon(item.type)}
                        size={10}
                        color="#fff"
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    // Empty state component
    const EmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t.noNotifications}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Pressable style={styles.backdrop} onPress={onClose}>
                <BlurView intensity={10} style={StyleSheet.absoluteFill} />
            </Pressable>

            {/* Panel */}
            <View style={[styles.panel, isRTL ? styles.panelRTL : styles.panelLTR]}>
                {/* Header */}
                <View style={[styles.header, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
                    <Text style={styles.headerTitle}>{t.notifications}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={22} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Notification List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                ) : notifications.length === 0 ? (
                    <EmptyState />
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    panel: {
        position: 'absolute',
        top: verticalScale(100),
        width: horizontalScale(320),
        maxHeight: verticalScale(450),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    panelLTR: {
        right: horizontalScale(16),
    },
    panelRTL: {
        left: horizontalScale(16),
    },
    header: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(14),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: horizontalScale(4),
    },
    listContent: {
        paddingVertical: verticalScale(8),
    },
    notificationItem: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: `${colors.border}50`,
    },
    avatarContainer: {
        position: 'relative',
        marginHorizontal: horizontalScale(10),
    },
    avatar: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
    },
    iconAvatar: {
        width: horizontalScale(44),
        height: horizontalScale(44),
        borderRadius: horizontalScale(22),
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: horizontalScale(18),
        height: horizontalScale(18),
        borderRadius: horizontalScale(9),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.bgPrimary,
    },
    contentContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: ScaleFontSize(14),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(2),
    },
    notificationSubtitle: {
        fontSize: ScaleFontSize(13),
        color: colors.textSecondary,
        marginBottom: verticalScale(4),
        lineHeight: ScaleFontSize(18),
    },
    timestamp: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
    },
    unreadDot: {
        width: horizontalScale(10),
        height: horizontalScale(10),
        borderRadius: horizontalScale(5),
        backgroundColor: '#2563EB',
        marginLeft: horizontalScale(8),
        marginRight: horizontalScale(8),
        alignSelf: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
        marginTop: verticalScale(12),
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(60),
    },
    loadingText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
});

export default NotificationPanel;
