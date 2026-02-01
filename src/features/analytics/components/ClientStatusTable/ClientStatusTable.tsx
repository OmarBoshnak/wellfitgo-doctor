/**
 * ClientStatusTable Component
 * @description Table showing client check-in status with actions
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { isRTL } from '@/src/core/constants/translation';
import { ClientCheckIn, ClientStatus } from '@/src/features/analytics/types/analytics.types';

interface ClientStatusTableProps {
    data: ClientCheckIn[];
    isLoading?: boolean;
    onSendReminder?: (clientId: string, clientName: string) => void;
    onViewProfile?: (clientId: string) => void;
    sendingReminderId?: string | null;
}

// Translations
const t = {
    checkInStatus: isRTL ? 'حالة تسجيل العملاء' : 'Client Check-in Status',
    client: isRTL ? 'العميل' : 'Client',
    lastCheckIn: isRTL ? 'آخر تسجيل' : 'Last Check-in',
    status: isRTL ? 'الحالة' : 'Status',
    action: isRTL ? 'الإجراء' : 'Action',
    today: isRTL ? 'اليوم' : 'Today',
    dayAgo: isRTL ? 'منذ يوم' : '1 day ago',
    daysAgo: isRTL ? 'أيام مضت' : 'days ago',
    never: isRTL ? 'لم يسجل' : 'Never',
    onTime: isRTL ? 'في الوقت' : 'On time',
    overdue: isRTL ? 'متأخر' : 'Overdue',
    sendReminder: isRTL ? 'إرسال تذكير' : 'Send Reminder',
    viewProfile: isRTL ? 'عرض الملف' : 'View Profile',
    loading: isRTL ? 'جاري التحميل...' : 'Loading...',
    noData: isRTL ? 'لا توجد بيانات' : 'No data',
};

// Format check-in time helper
const formatLastCheckIn = (lastCheckIn: string | null): string => {
    if (!lastCheckIn) return t.never;
    
    const checkInDate = new Date(lastCheckIn);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - checkInDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return t.today;
    if (diffDays === 1) return t.dayAgo;
    return `${diffDays} ${t.daysAgo}`;
};

export const ClientStatusTable: React.FC<ClientStatusTableProps> = ({
    data,
    isLoading = false,
    onSendReminder,
    onViewProfile,
    sendingReminderId,
}) => {
    const tableData = useMemo(() => {
        if (!data || data.length === 0) return null;
        return data;
    }, [data]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </View>
        );
    }

    if (!tableData) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t.noData}</Text>
                </View>
            </View>
        );
    }

    // Map client status to display (matching analytics screen pattern)
    const getStatusDisplay = (status: ClientStatus): { emoji: string; style: object } => {
        switch (status) {
            case 'on_track':
                return { emoji: '✅', style: styles.statusOnTime };
            case 'needs_support':
                return { emoji: '⚠️', style: styles.statusOverdue };
            case 'at_risk':
                return { emoji: '🔴', style: styles.statusAtRisk };
        }
    };

    const handleSendReminder = useCallback((client: ClientCheckIn) => {
        if (onSendReminder) {
            onSendReminder(client.id, client.name);
        }
    }, [onSendReminder]);

    const handleViewProfile = useCallback((client: ClientCheckIn) => {
        if (onViewProfile) {
            onViewProfile(client.id);
        }
    }, [onViewProfile]);

    return (
        <View style={styles.tableCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t.checkInStatus}
            </Text>

            {/* Table Header */}
            <View style={[styles.tableHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.tableHeaderText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.client}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.lastCheckIn}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.status}
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.action}
                    </Text>
                </View>

                {/* Table Rows */}
                {tableData.map((client) => {
                    const statusDisplay = getStatusDisplay(client.status);
                    const lastCheckInText = formatLastCheckIn(client.lastCheckIn);

                    return (
                        <View
                            key={client.id}
                            style={[styles.tableRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        >
                            <Text
                                style={[styles.tableText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}
                                numberOfLines={1}
                            >
                                {client.name}
                            </Text>
                            <Text
                                style={[styles.tableTextSecondary, { flex: 1.5, textAlign: isRTL ? 'right' : 'left' }]}
                            >
                                {lastCheckInText}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <View style={[styles.statusBadge, statusDisplay.style]}>
                                    <Text style={styles.statusEmoji}>{statusDisplay.emoji}</Text>
                                </View>
                            </View>
                            <View style={[styles.actionContainer, { flex: 1.5, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                {client.status !== 'on_track' && (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => handleSendReminder(client)}
                                        disabled={sendingReminderId === client.id}
                                    >
                                        <Text style={styles.actionText}>
                                            {sendingReminderId === client.id
                                                ? (isRTL ? 'جاري...' : 'Sending...')
                                                : t.sendReminder}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                {client.status === 'at_risk' && (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => handleViewProfile(client)}
                                    >
                                        <Text style={styles.actionTextGreen}>{t.viewProfile}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    );
                })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: verticalScale(16),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: verticalScale(12),
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: verticalScale(40),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    loadingText: {
        fontSize: ScaleFontSize(14),
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: verticalScale(40),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
    },
    emptyText: {
        fontSize: ScaleFontSize(16),
        color: colors.textSecondary,
    },
    // Table (matching analytics screen exactly)
    tableCard: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        paddingVertical: verticalScale(16),
        marginBottom: verticalScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: verticalScale(2) },
        shadowOpacity: 0.05,
        shadowRadius: horizontalScale(8),
        elevation: 2,
        overflow: 'hidden',
    },
    cardTitle: {
        fontSize: ScaleFontSize(16),
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: verticalScale(20),
        paddingHorizontal: horizontalScale(16),
    },
    tableHeader: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    tableHeaderText: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tableRow: {
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        alignItems: 'center',
        minHeight: verticalScale(44),
    },
    tableText: {
        fontSize: ScaleFontSize(13),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    tableTextSecondary: {
        fontSize: ScaleFontSize(12),
        color: colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: horizontalScale(8),
        paddingVertical: verticalScale(4),
        borderRadius: horizontalScale(12),
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    statusOnTime: {
        backgroundColor: '#10B98120',
    },
    statusOverdue: {
        backgroundColor: '#F59E0B20',
    },
    statusAtRisk: {
        backgroundColor: '#EF444420',
    },
    statusEmoji: {
        fontSize: ScaleFontSize(12),
    },
    actionContainer: {
        flexWrap: 'wrap',
        gap: horizontalScale(4),
    },
    actionText: {
        fontSize: ScaleFontSize(12),
        color: '#3B82F6',
        fontWeight: '500',
        paddingVertical: verticalScale(4),
    },
    actionTextGreen: {
        fontSize: ScaleFontSize(12),
        color: '#10B981',
        fontWeight: '500',
        paddingVertical: verticalScale(4),
    },
});

export default ClientStatusTable;
