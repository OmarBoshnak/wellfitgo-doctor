import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { ChatMessage } from './types';
import VoiceMessageBubble from './VoiceMessageBubble';
import { isRTL } from '@/src/i18n';
import { colors } from '@/src/core/constants/Theme';

// Arabic translations
const t = {
    voiceMessage: 'رسالة صوتية',
    edited: 'تم التعديل',
    deleted: 'تم حذف هذه الرسالة',
    replyTo: 'رد على',
};

interface Props {
    message: ChatMessage;
    showAvatar: boolean;
    avatarUri?: string;
    onLongPress?: (message: ChatMessage) => void;
}

const MessageBubble = React.memo(function MessageBubble({ message, showAvatar, avatarUri, onLongPress }: Props) {
    const isMe = message.sender === 'me';
    const isSystem = message.type === 'system';
    const isAudio = message.type === 'audio';
    const isDeleted = message.isDeleted;
    const isEdited = message.isEdited && !isDeleted;

    const handleLongPress = () => {
        if (onLongPress && !isSystem) {
            onLongPress(message);
        }
    };

    // System message (centered pill)
    if (isSystem) {
        return (
            <View style={styles.systemContainer}>
                <View style={styles.systemBubble}>
                    <Text style={styles.systemText}>{message.content}</Text>
                </View>
            </View>
        );
    }

    // Audio message - use VoiceMessageBubble
    if (isAudio && message.audioUri && !isDeleted) {
        return (
            <TouchableOpacity
                onLongPress={handleLongPress}
                delayLongPress={300}
                activeOpacity={0.9}
            >
                <VoiceMessageBubble
                    id={message.id}
                    audioUri={message.audioUri}
                    duration={message.audioDuration}
                    isMine={isMe}
                    timestamp={message.timestamp}
                />
            </TouchableOpacity>
        );
    }

    // Deleted message placeholder
    if (isDeleted) {
        return (
            <TouchableOpacity
                onLongPress={handleLongPress}
                delayLongPress={300}
                activeOpacity={0.9}
            >
                <View style={[styles.container, isMe ? styles.containerMe : styles.containerClient]}>
                    <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperClient]}>
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleDeleted]}>
                            <MaterialIcons name="block" size={16} color="#9CA3AF" style={styles.deletedIcon} />
                            <Text style={[styles.textDeleted, { textAlign: isMe ? 'right' : 'left' }]}>{t.deleted}</Text>
                        </View>
                        <View style={[styles.metaRow, isMe ? styles.metaRowMe : styles.metaRowClient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <Text style={styles.timestamp}>{message.timestamp}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Reply indicator component
    const ReplyIndicator = ({ message }: { message: ChatMessage }) => {
        // Use new reply fields first, fallback to legacy replyTo
        const replyContent = message.replyToContent;
        const replySenderId = message.replyToSenderId;
        const replySenderRole = message.replyToSenderRole;
        
        if (!message.replyToId || !replyContent) return null;
        
        const getReplySenderName = () => {
            if (replySenderRole === 'doctor') return 'نفسك';
            if (replySenderRole === 'client') return 'المريض';
            // Fallback to senderId inference
            if (replySenderId === 'doctor_1') return 'نفسك';
            return 'المريض';
        };
        
        return (
            <View style={[styles.replyContainer, isMe ? styles.replyContainerMe : styles.replyContainerClient]}>
                <View style={[styles.replyBar, isMe ? styles.replyBarMe : styles.replyBarClient]} />
                <View style={styles.replyContent}>
                    <Text style={styles.replyLabel}>
                        {t.replyTo} {getReplySenderName()}
                    </Text>
                    <Text style={styles.replyText} numberOfLines={1}>
                        {replyContent}
                    </Text>
                </View>
            </View>
        );
    };

    // Regular text message bubble
    return (
        <TouchableOpacity
            onLongPress={handleLongPress}
            delayLongPress={300}
            activeOpacity={0.9}
        >
            <View style={[styles.container, isMe ? styles.containerMe : styles.containerClient]}>
                <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperMe : styles.bubbleWrapperClient]}>
                    {/* Reply Indicator */}
                    <ReplyIndicator message={message} />
                    
                    {/* Bubble */}
                    {isMe ? (
                        <LinearGradient
                            colors={['#5073FE', '#02C3CD']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.bubble, styles.bubbleMe]}
                        >
                            <Text style={styles.textMe}>{message.content}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={[styles.bubble, styles.bubbleClient]}>
                            <Text style={styles.textClient}>{message.content}</Text>
                        </View>
                    )}

                    {/* Timestamp, read status, and edited label */}
                    <View style={[styles.metaRow, isMe ? styles.metaRowMe : styles.metaRowClient, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {isMe && message.status === 'read' && (
                            <MaterialIcons name="done-all" size={16} color={colors.primaryDark} />
                        )}
                        {isEdited && (
                            <Text style={styles.editedLabel}>{t.edited}</Text>
                        )}        
                                        {isMe && message.status === 'sent' && (
                            <MaterialIcons name="done" size={16} color="#AAB8C5" />
                        )}
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

export default MessageBubble;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: horizontalScale(16),
        marginVertical: verticalScale(2),
    },
    containerMe: {
        flexDirection: 'row-reverse', // RTL for my messages
        justifyContent: 'flex-start',
    },
    containerClient: {
        flexDirection: 'row', // LTR for client messages (left alignment)
        justifyContent: 'flex-start',
    },
    bubbleWrapper: {
        maxWidth: '75%',
    },
    bubbleWrapperMe: {
        alignItems: 'flex-end', // My messages align right
    },
    bubbleWrapperClient: {
        alignItems: 'flex-start', // LTR: client messages align left
    },
    bubble: {
        padding: horizontalScale(12),
        borderRadius: horizontalScale(16),
    },
    bubbleMe: {
        borderBottomRightRadius: horizontalScale(4), // RTL: tail on left
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bubbleClient: {
        borderBottomLeftRadius: horizontalScale(4), // LTR: tail on left
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.primaryDark,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    textMe: {
        fontSize: ScaleFontSize(14),
        lineHeight: ScaleFontSize(20),
        color: '#FFFFFF',
        textAlign: 'right',
    },
    textClient: {
        fontSize: ScaleFontSize(14),
        lineHeight: ScaleFontSize(20),
        color: colors.primaryDark,
        textAlign: 'left',
    },
    metaRow: {
        alignItems: 'center',
        gap: horizontalScale(4),
        marginTop: verticalScale(4),
    },
    metaRowMe: {
        justifyContent: 'flex-end', // RTL
        marginLeft: horizontalScale(4),
    },
    metaRowClient: {
        justifyContent: 'flex-start', // LTR
        marginRight: horizontalScale(4),
    },
    timestamp: {
        fontSize: ScaleFontSize(11),
        color: '#AAB8C5',
    },
    // System message
    systemContainer: {
        alignItems: 'center',
        paddingVertical: verticalScale(8),
    },
    systemBubble: {
        backgroundColor: colors.bgSecondary,
        paddingHorizontal: horizontalScale(16),
        paddingVertical: verticalScale(6),
        borderRadius: horizontalScale(16),
        borderWidth: 1,
        borderColor: colors.border,
    },
    systemText: {
        fontSize: ScaleFontSize(12),
        fontWeight: '500',
        color: '#8093A5',
        textAlign: 'center',
    },
    // Deleted message styles
    bubbleDeleted: {
        backgroundColor: colors.bgSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: horizontalScale(6),
    },
    textDeleted: {
        fontSize: ScaleFontSize(13),
        fontStyle: 'italic',
        color: '#9CA3AF',
        textAlign: 'right',
    },
    deletedIcon: {
        marginLeft: horizontalScale(4),
    },
    // Edited label
    editedLabel: {
        fontSize: ScaleFontSize(10),
        fontStyle: 'italic',
        color: '#9CA3AF',
        marginRight: horizontalScale(4),
    },
    // Reply indicator styles
    replyContainer: {
        flexDirection: 'row-reverse',
        alignItems: 'center',
        marginBottom: verticalScale(6),
        maxWidth: '100%',
    },
    replyContainerMe: {
        justifyContent: 'flex-end',
    },
    replyContainerClient: {
        justifyContent: 'flex-start',
    },
    replyBar: {
        width: horizontalScale(2),
        height: verticalScale(20),
        borderRadius: horizontalScale(1),
        marginRight: horizontalScale(6),
        flexShrink: 0,
    },
    replyBarMe: {
        backgroundColor: colors.primaryDark,
    },
    replyBarClient: {
        backgroundColor: '#5073FE',
    },
    replyContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingVertical: verticalScale(4),
        paddingHorizontal: horizontalScale(8),
        borderRadius: horizontalScale(8),
        borderLeftWidth: 2,
        borderLeftColor: colors.border,
        flexShrink: 1,
        minWidth: 0, // Allow text to wrap properly
    },
    replyLabel: {
        fontSize: ScaleFontSize(10),
        fontWeight: '600',
        color: colors.primaryDark,
        marginBottom: verticalScale(2),
        textAlign: 'right',
    },
    replyText: {
        fontSize: ScaleFontSize(11),
        color: colors.textSecondary,
        textAlign: 'right',
        lineHeight: ScaleFontSize(14),
    },
});
