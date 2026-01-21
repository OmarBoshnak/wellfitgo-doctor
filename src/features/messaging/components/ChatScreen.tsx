import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Text, Alert, TextInput, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChatMessage, ChatConversation } from './types';
import { MealPlan } from './MealPlanSelectorSheet';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import MessageActionsSheet from './MessageActionsSheet';
import { useChatScreen } from '../hooks/useMessaging';
import { horizontalScale, verticalScale, ScaleFontSize } from '@/src/core/utils/scaling';
import { colors } from '@/src/core/constants/Theme';

// Arabic translations
const t = {
    voiceMessage: 'رسالة صوتية',
    image: 'صورة',
    document: 'مستند',
    mealPlanAttached: 'تم إرفاق الخطة الغذائية',
    loading: 'جاري التحميل...',
    noMessages: 'لا توجد رسائل بعد',
    uploadError: 'فشل رفع الملف',
    editMessage: 'تعديل الرسالة',
    save: 'حفظ',
    cancel: 'إلغاء',
    editError: 'فشل تعديل الرسالة',
    deleteError: 'فشل حذف الرسالة',
};

interface Props {
    conversation: ChatConversation;
    conversationId?: string; // Conversation ID
    onBack: () => void;
}

export default function ChatScreen({ conversation, conversationId, onBack }: Props) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);

    // Message actions state
    const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editText, setEditText] = useState('');
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

    // Local state for current user
    const [currentUser, setCurrentUser] = useState<{ _id: string } | null>(null);

    // Fetch current user on mount
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // const { api } = await import('@/src/lib/api');
                // const response = await api.getMe();
                // if (response.data) {
                //     setCurrentUser(response.data as { _id: string });
                // }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        fetchUser();
    }, []);

    // Use hook for real-time messages
    const { messages: convexMessages, isLoading, sendMessage } = useChatScreen(conversationId);

    // Helper function to upload file to backend storage
    const uploadFile = useCallback(async (uri: string, mimeType: string = 'audio/m4a'): Promise<string | null> => {
        try {
            setIsUploading(true);

            // For now, return the URI directly - file upload endpoint can be added later
            console.log('Preparing file for upload:', { uri, mimeType });

            // Return the URI for now
            return uri;
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('خطأ', t.uploadError);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    // Transform messages to our ChatMessage format
    const messages: ChatMessage[] = useMemo(() => {
        if (!convexMessages || convexMessages.length === 0) {
            return [];
        }

        return convexMessages.map((msg: any) => ({
            id: msg._id,
            type: msg.messageType === 'voice' ? 'audio' : msg.messageType || 'text',
            sender: msg.senderRole === 'coach' ? 'me' : 'client',
            senderId: msg.senderId,
            content: msg.content,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            status: msg.isDeleted ? 'deleted' : msg.isEdited ? 'edited' : msg.isReadByClient ? 'read' : 'sent',
            isEdited: msg.isEdited,
            isDeleted: msg.isDeleted,
            audioUri: msg.mediaUrl,
            audioDuration: msg.mediaDuration,
        }));
    }, [convexMessages]);

    // Message action handlers
    const handleMessageLongPress = useCallback((message: ChatMessage) => {
        setSelectedMessage(message);
        setShowActionSheet(true);
    }, []);

    const handleReply = useCallback((message: ChatMessage) => {
        setReplyingTo(message);
        // Focus input and show reply indicator in the UI
        console.log('Reply to:', message.content);
    }, []);

    const handleEdit = useCallback((message: ChatMessage) => {
        setSelectedMessage(message);
        setEditText(message.content);
        setShowEditModal(true);
    }, []);

    const handleEditSubmit = useCallback(async () => {
        if (!selectedMessage || !editText.trim()) return;

        try {
            // Edit message using API - endpoint can be added
            console.log('Editing message:', selectedMessage.id, editText);
            setShowEditModal(false);
            setSelectedMessage(null);
            setEditText('');
        } catch (error) {
            console.error('Edit error:', error);
            Alert.alert('خطأ', t.editError);
        }
    }, [selectedMessage, editText]);

    const handleDelete = useCallback(async (message: ChatMessage) => {
        try {
            // Delete message using API - endpoint can be added
            console.log('Deleting message:', message.id);
        } catch (error) {
            console.error('Delete error:', error);
            Alert.alert('خطأ', t.deleteError);
        }
    }, []);

    const handleOptions = useCallback(() => {
        console.log('Options menu pressed');
    }, []);

    const handleProfilePress = useCallback(() => {
        if (conversation.clientId) {
            // router.push(`/(app)/doctor/client-profile?id=${conversation.clientId}`);
        }
    }, [conversation.clientId, router]);

    const handleSendText = useCallback(async (text: string) => {
        if (conversationId) {
            // TODO: Include replyingTo.id in the message for reply threading
            await sendMessage(text, 'text');
            setReplyingTo(null);
        }
    }, [conversationId, sendMessage]);

    const handleSendAudio = useCallback(async (uri: string) => {
        if (!conversationId) return;

        // Upload audio file to Convex storage first
        const storageId = await uploadFile(uri, 'audio/m4a');
        if (storageId) {
            await sendMessage(t.voiceMessage, 'voice', storageId);
        }
    }, [conversationId, sendMessage, uploadFile]);

    const handleSendImage = useCallback(async (uri: string, name: string) => {
        if (!conversationId) return;

        // Upload image to Convex storage first
        const storageId = await uploadFile(uri, 'image/jpeg');
        if (storageId) {
            await sendMessage(`${t.image}: ${name}`, 'image', storageId);
        }
    }, [conversationId, sendMessage, uploadFile]);

    const handleSendDocument = useCallback(async (uri: string, name: string) => {
        if (conversationId) {
            await sendMessage(`${t.document}: ${name}`, 'text');
        }
    }, [conversationId, sendMessage]);

    const handleSendMealPlan = useCallback(async (plan: MealPlan) => {
        if (conversationId) {
            await sendMessage(`${t.mealPlanAttached}: ${plan.nameAr}`, 'text');
        }
    }, [conversationId, sendMessage]);

    // Check if current user owns the selected message
    const isMessageOwner = selectedMessage?.senderId === currentUser?._id;

    // Show loading state
    if (isLoading && conversationId) {
        return (
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                <ChatHeader
                    conversation={conversation}
                    onBack={onBack}
                    onOptions={handleOptions}
                    onProfilePress={handleProfilePress}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primaryDark} />
                    <Text style={styles.loadingText}>{t.loading}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                {/* Header */}
                <ChatHeader
                    conversation={conversation}
                    onBack={onBack}
                    onOptions={handleOptions}
                    onProfilePress={handleProfilePress}
                />

                {/* Message List */}
                <MessageList
                    messages={messages}
                    avatarUri={conversation.avatar}
                    onMessageLongPress={handleMessageLongPress}
                />

                {/* Input */}
                <ChatInput
                    onSendText={handleSendText}
                    onSendAudio={handleSendAudio}
                    onSendImage={handleSendImage}
                    onSendDocument={handleSendDocument}
                    onSendMealPlan={handleSendMealPlan}
                    replyingTo={replyingTo ? { id: replyingTo.id, content: replyingTo.content, sender: replyingTo.sender } : null}
                    onCancelReply={() => setReplyingTo(null)}
                />
            </KeyboardAvoidingView>

            {/* Message Actions Sheet */}
            <MessageActionsSheet
                visible={showActionSheet}
                message={selectedMessage}
                isOwner={isMessageOwner}
                onClose={() => {
                    setShowActionSheet(false);
                    setSelectedMessage(null);
                }}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Edit Message Modal */}
            <Modal
                visible={showEditModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.editModal}>
                        <Text style={styles.editModalTitle}>{t.editMessage}</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                            textAlign="right"
                        />
                        <View style={styles.editModalButtons}>
                            <TouchableOpacity
                                style={styles.editModalButton}
                                onPress={() => {
                                    setShowEditModal(false);
                                    setEditText('');
                                }}
                            >
                                <Text style={styles.editModalButtonText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.editModalButton, styles.editModalButtonPrimary]}
                                onPress={handleEditSubmit}
                            >
                                <Text style={[styles.editModalButtonText, styles.editModalButtonTextPrimary]}>{t.save}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    // Edit Modal styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: horizontalScale(20),
    },
    editModal: {
        backgroundColor: colors.bgPrimary,
        borderRadius: horizontalScale(16),
        padding: horizontalScale(20),
        width: '100%',
        maxWidth: horizontalScale(400),
    },
    editModalTitle: {
        fontSize: ScaleFontSize(18),
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'right',
        marginBottom: verticalScale(16),
    },
    editInput: {
        backgroundColor: colors.bgSecondary,
        borderRadius: horizontalScale(12),
        padding: horizontalScale(12),
        fontSize: ScaleFontSize(15),
        color: colors.textPrimary,
        minHeight: verticalScale(100),
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: colors.border,
    },
    editModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: horizontalScale(12),
        marginTop: verticalScale(16),
    },
    editModalButton: {
        flex: 1,
        paddingVertical: verticalScale(12),
        borderRadius: horizontalScale(10),
        alignItems: 'center',
        backgroundColor: colors.bgSecondary,
    },
    editModalButtonPrimary: {
        backgroundColor: colors.primaryDark,
    },
    editModalButtonText: {
        fontSize: ScaleFontSize(15),
        fontWeight: '600',
        color: colors.textPrimary,
    },
    editModalButtonTextPrimary: {
        color: '#FFFFFF',
    },
});
