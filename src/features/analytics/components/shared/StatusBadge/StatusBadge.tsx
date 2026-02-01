/**
 * StatusBadge Component
 * @description Badge component for displaying client status with emoji and styling
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/core/constants/Theme';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { StatusBadgeProps, ClientStatus } from '@/src/features/analytics/types/analytics.types';

const getStatusConfig = (status: ClientStatus) => {
    switch (status) {
        case 'on_track':
            return {
                emoji: '✅',
                backgroundColor: '#DCFCE7',
                textColor: '#16A34A',
                borderColor: '#16A34A',
            };
        case 'needs_support':
            return {
                emoji: '⚠️',
                backgroundColor: '#FEF3C7',
                textColor: '#D97706',
                borderColor: '#D97706',
            };
        case 'at_risk':
            return {
                emoji: '🔴',
                backgroundColor: '#FEE2E2',
                textColor: '#DC2626',
                borderColor: '#DC2626',
            };
        default:
            return {
                emoji: '❓',
                backgroundColor: colors.border,
                textColor: colors.textSecondary,
                borderColor: colors.border,
            };
    }
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
        case 'small':
            return {
                paddingVertical: verticalScale(2),
                paddingHorizontal: horizontalScale(6),
                fontSize: ScaleFontSize(10),
                emojiSize: horizontalScale(10),
            };
        case 'medium':
            return {
                paddingVertical: verticalScale(4),
                paddingHorizontal: horizontalScale(8),
                fontSize: ScaleFontSize(12),
                emojiSize: horizontalScale(12),
            };
        case 'large':
            return {
                paddingVertical: verticalScale(6),
                paddingHorizontal: horizontalScale(12),
                fontSize: ScaleFontSize(14),
                emojiSize: horizontalScale(14),
            };
        default:
            return {
                paddingVertical: verticalScale(4),
                paddingHorizontal: horizontalScale(8),
                fontSize: ScaleFontSize(12),
                emojiSize: horizontalScale(12),
            };
    }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    size = 'medium',
}) => {
    const config = getStatusConfig(status);
    const sizeStyles = getSizeStyles(size);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor,
                    paddingVertical: sizeStyles.paddingVertical,
                    paddingHorizontal: sizeStyles.paddingHorizontal,
                },
            ]}
        >
            <Text style={[styles.emoji, { fontSize: sizeStyles.emojiSize }]}>
                {config.emoji}
            </Text>
            <Text
                style={[
                    styles.text,
                    {
                        color: config.textColor,
                        fontSize: sizeStyles.fontSize,
                    },
                ]}
            >
                {status.replace('_', ' ').toUpperCase()}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: horizontalScale(12),
        borderWidth: 1,
        gap: horizontalScale(4),
        alignSelf: 'flex-start',
    },
    emoji: {
        lineHeight: horizontalScale(16),
    },
    text: {
        fontWeight: '600',
    },
});

export default StatusBadge;
