import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatMessage, ChatConversation } from '../components/types';
import { messagingService, Message, Conversation } from '@/src/shared/services/messaging.service';
import { SocketService } from '@/src/shared/services/socket/socket.service';

// Transformation function to convert backend Message to ChatMessage
// Format timestamp to Arabic locale time string
const formatTimestamp = (dateString: string): string => {
    try {
        return new Date(dateString).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
};

const transformMessage = (backendMessage: Message, currentUserId?: string): ChatMessage => {
    const isMe = backendMessage.senderId === currentUserId || backendMessage.senderRole === 'doctor';
    
    // Create replyTo object for legacy compatibility
    const replyTo = backendMessage.replyToId && backendMessage.replyToContent ? {
        id: backendMessage.replyToId,
        content: backendMessage.replyToContent,
        sender: (backendMessage.replyToSenderRole === 'doctor' ? 'me' : 'client') as 'me' | 'client',
    } : undefined;

    return {
        id: backendMessage._id,
        type: backendMessage.messageType === 'voice' ? 'audio' : 
              backendMessage.messageType === 'text' ? 'text' : 
              backendMessage.messageType as any,
        sender: isMe ? 'me' : 'client',
        senderId: backendMessage.senderId,
        content: backendMessage.content,
        timestamp: formatTimestamp(backendMessage.createdAt),
        status: backendMessage.isDeleted ? 'deleted' : 
                backendMessage.isEdited ? 'edited' :
                (backendMessage as any).isReadByClient ? 'read' :
                'sent',
        isEdited: backendMessage.isEdited,
        isDeleted: backendMessage.isDeleted,
        audioUri: backendMessage.mediaUrl,
        audioDuration: backendMessage.mediaDuration,
        replyToId: backendMessage.replyToId,
        replyToContent: backendMessage.replyToContent,
        replyToSenderId: backendMessage.replyToSenderId,
        replyToSenderRole: backendMessage.replyToSenderRole,
        replyTo,
    };
};

export type InboxFilter = 'all' | 'unread' | 'favorites' | 'archived';

interface CoachInboxStats {
    totalUnread: number;
    totalActive: number;
}

export function useMessages(conversationId?: string, currentUserId?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination state
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Fetch messages from backend
    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Initial load: fetch only last 15 messages
                const response = await messagingService.getMessages(conversationId, undefined, 15);
                const transformedMessages = response.messages.map(msg => transformMessage(msg, currentUserId));
                setMessages(transformedMessages);
                setNextCursor(response.nextCursor);
                setHasMoreMessages(response.nextCursor !== null);
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Failed to load messages');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to real-time updates
        SocketService.joinConversation(conversationId);

        const handleNewMessage = (message: Message) => {
            if (message.conversationId === conversationId) {
                const transformedMessage = transformMessage(message, currentUserId);
                setMessages((prev) => {
                    // Check if message already exists (avoid duplicates)
                    const exists = prev.some((m) => m.id === transformedMessage.id);
                    if (exists) return prev;

                    // Replace optimistic message if clientTempId matches
                    if (message.clientTempId) {
                        const optimisticIndex = prev.findIndex((m) => m.id === message.clientTempId);
                        if (optimisticIndex !== -1) {
                            const next = [...prev];
                            next[optimisticIndex] = transformedMessage;
                            return next;
                        }
                    }

                    return [...prev, transformedMessage];
                });
            }
        };

        const handleMessageEdited = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === data.messageId
                            ? { ...m, content: data.content, isEdited: true }
                            : m
                    )
                );
            }
        };

        const handleMessageDeleted = (data: any) => {
            if (data.conversationId === conversationId) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === data.messageId
                            ? { ...m, isDeleted: true, content: 'تم حذف هذه الرسالة' }
                            : m
                    )
                );
            }
        };

        SocketService.onNewMessage(handleNewMessage);
        SocketService.onMessageEdited(handleMessageEdited);
        SocketService.onMessageDeleted(handleMessageDeleted);

        return () => {
            SocketService.leaveConversation(conversationId);
            SocketService.offNewMessage();
            SocketService.offMessageEdited();
            SocketService.offMessageDeleted();
        };
    }, [conversationId]);

    const addOptimisticMessage = useCallback(
        (data: {
            content: string;
            messageType?: string;
            mediaUrl?: string;
            mediaDuration?: number;
        }) => {
            if (!conversationId) return null;
            const tempId = `temp-${Date.now()}`;
            const newMsg: ChatMessage = {
                id: tempId,
                type: (data.messageType === 'voice' ? 'audio' : data.messageType || 'text') as any,
                sender: 'me',
                senderId: currentUserId || 'me',
                content: data.content,
                timestamp: new Date().toISOString(),
                status: 'sending',
                isEdited: false,
                isDeleted: false,
                audioUri: data.mediaUrl,
                audioDuration: data.mediaDuration,
            };
            setMessages((prev) => [...prev, newMsg]);
            return tempId;
        },
        [conversationId, currentUserId]
    );

    const replaceOptimisticMessage = useCallback((tempId: string | null, realMessage?: Message) => {
        if (!tempId || !realMessage) return;
        const transformedRealMessage = transformMessage(realMessage, currentUserId);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? transformedRealMessage : m)));
    }, [currentUserId]);

    const removeOptimisticMessage = useCallback((tempId: string | null) => {
        if (!tempId) return;
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }, []);

    const updateLocal = useCallback((id: string, partial: Partial<ChatMessage>) => {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...partial } : m)));
    }, []);

    const markAsRead = useCallback(async () => {
        if (!conversationId) return;
        try {
            await messagingService.markAsRead(conversationId);
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    }, [conversationId]);

    // Load more (older) messages
    const loadMoreMessages = useCallback(async () => {
        if (!conversationId || !hasMoreMessages || isLoadingMore || !nextCursor) return;

        setIsLoadingMore(true);
        try {
            const response = await messagingService.getMessages(conversationId, nextCursor, 15);
            const transformedMessages = response.messages.map(msg => transformMessage(msg, currentUserId));
            // Prepend older messages to existing array
            setMessages((prev) => [...transformedMessages, ...prev]);
            setNextCursor(response.nextCursor);
            setHasMoreMessages(response.nextCursor !== null);
        } catch (err) {
            console.error('Error loading more messages:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [conversationId, hasMoreMessages, isLoadingMore, nextCursor, currentUserId]);

    return {
        messages,
        isLoading,
        error,
        addOptimisticMessage,
        replaceOptimisticMessage,
        removeOptimisticMessage,
        updateLocal,
        markAsRead,
        // Pagination
        hasMoreMessages,
        isLoadingMore,
        loadMoreMessages,
    };
}

export function useSendMessage() {
    const [isLoading, setIsLoading] = useState(false);

    const send = useCallback(
        async (data: {
            conversationId: string;
            content: string;
            messageType?: 'text' | 'image' | 'voice' | 'document';
            mediaUrl?: string;
            mediaDuration?: number;
            replyToId?: string;
            clientTempId?: string;
        }) => {
            setIsLoading(true);
            try {
                const message = await messagingService.sendMessage(data.conversationId, {
                    content: data.content,
                    messageType: data.messageType as any || 'text',
                    mediaUrl: data.mediaUrl,
                    mediaDuration: data.mediaDuration,
                    replyToId: data.replyToId,
                    clientTempId: data.clientTempId,
                });
                setIsLoading(false);
                return message;
            } catch (error) {
                console.error('Error sending message:', error);
                setIsLoading(false);
                throw error;
            }
        },
        []
    );

    return { send, isLoading };
}

export function useChatScreen(conversationId?: string) {
    const { messages, isLoading, markAsRead, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage, updateLocal, hasMoreMessages, isLoadingMore, loadMoreMessages } = useMessages(conversationId, 'me');
    const { send } = useSendMessage();

    // Mark as read when entering conversation
    useEffect(() => {
        if (conversationId) {
            markAsRead();
        }
    }, [conversationId, markAsRead]);

    const sendMessage = useCallback(
        async (
            content: string,
            messageType: 'text' | 'image' | 'voice' | 'document' = 'text',
            mediaUrl?: string,
            mediaDuration?: number,
            replyToId?: string,
        ) => {
            if (!conversationId) return;

            // Add optimistic message first
            const tempId = addOptimisticMessage({
                content,
                messageType,
                mediaUrl,
                mediaDuration
            });

            try {
                const response = await send({
                    conversationId,
                    content,
                    messageType,
                    mediaUrl,
                    mediaDuration,
                    replyToId,
                    clientTempId: tempId || undefined,
                });

                // Replace optimistic with real
                if (tempId && response) {
                    replaceOptimisticMessage(tempId, response as any);
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                // Remove optimistic message on error
                removeOptimisticMessage(tempId);
            }
        },
        [conversationId, send, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage]
    );

    const sendVoiceMessage = useCallback(
        async (
            content: string,
            uri: string,
            duration?: number,
        ) => {
            if (!conversationId) return;

            const tempId = addOptimisticMessage({
                content,
                messageType: 'voice',
                mediaUrl: uri,
                mediaDuration: duration,
            });

            try {
                const uploadResult = await messagingService.uploadVoiceMessage(uri, duration);
                const response = await send({
                    conversationId,
                    content,
                    messageType: 'voice',
                    mediaUrl: uploadResult.url,
                    mediaDuration: duration,
                    clientTempId: tempId || undefined,
                });

                if (tempId && response) {
                    replaceOptimisticMessage(tempId, response as any);
                }
            } catch (error) {
                console.error('Failed to send voice message:', error);
                removeOptimisticMessage(tempId);
            }
        },
        [conversationId, addOptimisticMessage, replaceOptimisticMessage, removeOptimisticMessage, send]
    );

    return {
        messages,
        isLoading,
        sendMessage,
        sendVoiceMessage,
        markAsRead,
        updateLocal,
        // Pagination
        hasMoreMessages,
        isLoadingMore,
        loadMoreMessages,
    };
}

export function useUnreadCount() {
    const { totalUnread } = useCoachInbox('all');
    return totalUnread;
}

export function useCoachInbox(filter: InboxFilter = 'all') {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<CoachInboxStats>({ totalUnread: 0, totalActive: 0 });

    // Fetch conversations from backend
    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                const backendFilter = filter === 'unread' ? 'unread' : 'all';
                const data = await messagingService.getConversations(backendFilter);

                // Transform to ChatConversation format
                const transformed: ChatConversation[] = data.map((conv) => ({
                    id: conv.id,
                    clientId: conv.clientId,
                    name: conv.name,
                    avatar: conv.avatar || '',
                    isOnline: conv.isOnline,
                    lastMessage: conv.lastMessage,
                    lastMessageAt: conv.lastMessageAt,
                    unreadCount: conv.unreadCount,
                    priority: conv.unreadCount > 0 ? 'high' : 'normal',
                }));

                setConversations(transformed);

                // Calculate stats
                const totalUnread = data.reduce((acc, curr) => acc + curr.unreadCount, 0);
                const totalActive = data.length;
                setStats({ totalUnread, totalActive });
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();

        // Listen for new messages to update conversation list
        const handleNewMessage = (message: any) => {
            setConversations((prev) => {
                const updated = prev.map((conv) => {
                    if (conv.id === message.conversationId) {
                        return {
                            ...conv,
                            lastMessage: message.content,
                            lastMessageAt: new Date(message.createdAt).getTime(),
                            unreadCount: message.senderRole === 'client'
                                ? (conv.unreadCount || 0) + 1
                                : conv.unreadCount,
                        };
                    }
                    return conv;
                });
                // Sort by lastMessageAt
                return updated.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
            });

            // Update stats
            setStats((prev) => ({
                ...prev,
                totalUnread: prev.totalUnread + 1,
            }));
        };

        SocketService.onNewMessage(handleNewMessage);

        return () => {
            SocketService.offNewMessage();
        };
    }, [filter]);

    return {
        conversations,
        isLoading,
        stats,
        totalUnread: stats.totalUnread,
    };
}
