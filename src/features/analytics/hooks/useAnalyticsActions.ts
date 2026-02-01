/**
 * useAnalyticsActions Hook
 * @description Hook for handling analytics-related actions like sending reminders
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { analyticsService } from '@/src/features/analytics/services/analytics.service';
import { isRTL } from '@/src/core/constants/translation';

interface UseAnalyticsActionsReturn {
    sendReminder: (clientId: string, clientName: string) => Promise<void>;
    exportReport: (timeRange: string) => Promise<void>;
    sendingReminderId: string | null;
    isExporting: boolean;
}

// Translations
const t = {
    sent: isRTL ? 'تم الإرسال' : 'Sent',
    reminderSent: isRTL ? 'تم إرسال التذكير إلى' : 'Reminder sent to',
    error: isRTL ? 'خطأ' : 'Error',
    failedToSend: isRTL ? 'فشل إرسال التذكير' : 'Failed to send reminder',
    ok: isRTL ? 'حسناً' : 'OK',
    exporting: isRTL ? 'جاري التصدير...' : 'Exporting...',
    exportSuccess: isRTL ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully',
    exportFailed: isRTL ? 'فشل تصدير التقرير' : 'Failed to export report',
};

export const useAnalyticsActions = (): UseAnalyticsActionsReturn => {
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const sendReminder = useCallback(async (clientId: string, clientName: string) => {
        setSendingReminderId(clientId);
        
        try {
            const response = await analyticsService.sendReminder(clientId);
            
            Alert.alert(
                t.sent,
                `${t.reminderSent} ${clientName}`,
                [{ text: t.ok }]
            );
        } catch (error) {
            console.error('Send reminder error:', error);
            Alert.alert(
                t.error,
                t.failedToSend,
                [{ text: t.ok }]
            );
        } finally {
            setSendingReminderId(null);
        }
    }, []);

    const exportReport = useCallback(async (timeRange: string) => {
        setIsExporting(true);
        
        try {
            const response = await analyticsService.exportReport(timeRange as any);
            
            if (response.success && response.data?.url) {
                // In a real app, this would handle file download
                Alert.alert(
                    t.exportSuccess,
                    `Report ready: ${response.data.filename}`,
                    [{ text: t.ok }]
                );
            }
        } catch (error) {
            console.error('Export report error:', error);
            Alert.alert(
                t.error,
                t.exportFailed,
                [{ text: t.ok }]
            );
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        sendReminder,
        exportReport,
        sendingReminderId,
        isExporting,
    };
};

export default useAnalyticsActions;
