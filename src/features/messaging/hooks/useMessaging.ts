import { useCallback, useEffect, useState } from 'react';
import { ChatMessage, ChatConversation } from '../components/types';
import { messagingService, Message } from '@/src/shared/services/messaging.service';
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
        createdAt: backendMessage.createdAt,
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

interface InboxStoreState {
    conversations: ChatConversation[];
    isLoading: boolean;
    stats: CoachInboxStats;
    initialized: boolean;
    listenersAttached: boolean;
}

const inboxStore: InboxStoreState = {
    conversations: [],
    isLoading: false,
    stats: { totalUnread: 0, totalActive: 0 },
    initialized: false,
    listenersAttached: false,
};

const inboxSubscribers = new Set<() => void>();
let inboxFetchPromise: Promise<void> | null = null;
const processedMessageIds = new Set<string>();
const processedMessageQueue: string[] = [];
const MAX_PROCESSED_MESSAGES = 300;

const notifyInboxSubscribers = () => {
    inboxSubscribers.forEach((subscriber) => subscriber());
};

const subscribeToInboxStore = (subscriber: () => void) => {
    inboxSubscribers.add(subscriber);
    return () => {
        inboxSubscribers.delete(subscriber);
    };
};

const computeInboxStats = (conversations: ChatConversation[]): CoachInboxStats => ({
    totalUnread: conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0),
    totalActive: conversations.length,
});

const applyInboxConversations = (conversations: ChatConversation[]) => {
    const sortedConversations = [...conversations].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    inboxStore.conversations = sortedConversations;
    inboxStore.stats = computeInboxStats(sortedConversations);
    notifyInboxSubscribers();
};

const markConversationReadInStore = (conversationId: string) => {
    const updated = inboxStore.conversations.map((conversation) =>
        conversation.id === conversationId
            ? { ...conversation, unreadCount: 0, priority: 'normal' as const }
            : conversation
    );
    applyInboxConversations(updated);
};

const rememberProcessedMessage = (messageId: string) => {
    processedMessageIds.add(messageId);
    processedMessageQueue.push(messageId);

    if (processedMessageQueue.length > MAX_PROCESSED_MESSAGES) {
        const oldest = processedMessageQueue.shift();
        if (oldest) {
            processedMessageIds.delete(oldest);
        }
    }
};

const transformConversation = (conv: any): ChatConversation => ({
    id: conv.id,
    clientId: conv.clientId,
    name: conv.name,
    avatar: conv.avatar || '',
    isOnline: conv.isOnline,
    lastMessage: conv.lastMessage,
    lastMessageAt: conv.lastMessageAt,
    unreadCount: conv.unreadCount,
    priority: conv.unreadCount > 0 ? 'high' : 'normal',
});

const fetchInboxConversations = async () => {
    if (inboxFetchPromise) {
        return inboxFetchPromise;
    }

    inboxStore.isLoading = true;
    notifyInboxSubscribers();

    inboxFetchPromise = (async () => {
        try {
            const data = await messagingService.getConversations('all');
            const transformed = data.map(transformConversation);
            inboxStore.initialized = true;
            inboxStore.isLoading = false;
            applyInboxConversations(transformed);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            inboxStore.isLoading = false;
            notifyInboxSubscribers();
        } finally {
            inboxFetchPromise = null;
        }
    })();

    return inboxFetchPromise;
};

// Track cleanup function for socket listeners
let currentListenerCleanup: (() => void) | null = null;

const attachInboxSocketListeners = () => {
    // If already attached, return existing cleanup
    if (inboxStore.listenersAttached && currentListenerCleanup) {
        return currentListenerCleanup;
    }

    // Check if sockets are ready
    if (!SocketService.isMessagingReady()) {
        console.warn('[useCoachInbox] Attempted to attach listeners but sockets not ready');
        return () => {}; // Return no-op cleanup
    }

    const handleNewMessage = (message: any) => {
        const messageId = message?._id || message?.id;
        if (messageId && processedMessageIds.has(messageId)) {
            return;
        }
        if (messageId) {
            rememberProcessedMessage(messageId);
        }

        const createdAt = message?.createdAt ? new Date(message.createdAt).getTime() : Date.now();
        const isClientMessage = message?.senderRole === 'client';

        const existingIndex = inboxStore.conversations.findIndex((conv) => conv.id === message?.conversationId);
        if (existingIndex >= 0) {
            const updated = [...inboxStore.conversations];
            const current = updated[existingIndex];
            updated[existingIndex] = {
                ...current,
                lastMessage: message?.content || current.lastMessage,
                lastMessageAt: createdAt,
                unreadCount: isClientMessage ? (current.unreadCount || 0) + 1 : current.unreadCount,
                priority: isClientMessage ? 'high' : current.priority,
            };
            applyInboxConversations(updated);
            return;
        }

        if (message?.conversationId) {
            const newConversation: ChatConversation = {
                id: message.conversationId,
                clientId: message.clientId,
                name: message.clientName || 'عميل',
                avatar: message.clientAvatar || '',
                isOnline: false,
                lastMessage: message.content || '',
                lastMessageAt: createdAt,
                unreadCount: isClientMessage ? 1 : 0,
                priority: isClientMessage ? 'high' : 'normal',
            };
            applyInboxConversations([newConversation, ...inboxStore.conversations]);
        }
    };

    const handleMessagesRead = (data: any) => {
        if (!data?.conversationId) return;
        if (data?.readBy && data.readBy !== 'doctor') return;
        markConversationReadInStore(data.conversationId);
    };

    const handleUserStatusUpdated = (data: any) => {
        if (!data?.userId) return;
        const isOnline = data.status === 'online';
        let updated = false;

        const nextConversations = inboxStore.conversations.map((conversation) => {
            if (conversation.clientId === data.userId) {
                updated = true;
                return { ...conversation, isOnline };
            }
            return conversation;
        });

        if (updated) {
            inboxStore.conversations = nextConversations;
            notifyInboxSubscribers();
        }
    };

    // Attach listeners
    SocketService.onNewMessage(handleNewMessage);
    SocketService.onMessagesRead(handleMessagesRead);
    SocketService.onUserStatusUpdated(handleUserStatusUpdated);

    console.log('[useCoachInbox] Socket listeners attached');
    inboxStore.listenersAttached = true;

    // Create cleanup function
    const cleanup = () => {
        console.log('[useCoachInbox] Cleaning up socket listeners');
        SocketService.offNewMessage(handleNewMessage);
        SocketService.offMessagesRead(handleMessagesRead);
        SocketService.offUserStatusUpdated(handleUserStatusUpdated);
        inboxStore.listenersAttached = false;
        currentListenerCleanup = null;
    };

    currentListenerCleanup = cleanup;
    return cleanup;
};

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
            SocketService.offNewMessage(handleNewMessage);
            SocketService.offMessageEdited(handleMessageEdited);
            SocketService.offMessageDeleted(handleMessageDeleted);
        };
    }, [conversationId, currentUserId]);

    const addOptimisticMessage = useCallback(
        (data: {
            content: string;
            messageType?: string;
            mediaUrl?: string;
            mediaDuration?: number;
        }) => {
            if (!conversationId) return null;
            const tempId = `temp-${Date.now()}`;
            const createdAt = new Date().toISOString();
            const newMsg: ChatMessage = {
                id: tempId,
                type: (data.messageType === 'voice' ? 'audio' : data.messageType || 'text') as any,
                sender: 'me',
                senderId: currentUserId || 'me',
                content: data.content,
                createdAt,
                timestamp: formatTimestamp(createdAt),
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
        markConversationReadInStore(conversationId);
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
    const [, forceUpdate] = useState(0);
    const [isSocketReady, setIsSocketReady] = useState(SocketService.isMessagingReady());

    // Subscribe to inbox store changes
    useEffect(() => subscribeToInboxStore(() => forceUpdate((value) => value + 1)), []);

    // Subscribe to socket connection state changes
    useEffect(() => {
        return SocketService.onConnectionChange(() => {
            const ready = SocketService.isMessagingReady();
            setIsSocketReady(ready);
            console.log('[useCoachInbox] Socket connection state changed, ready:', ready);
        });
    }, []);

    // Fetch initial data
    useEffect(() => {
        if (!inboxStore.initialized && !inboxStore.isLoading) {
            fetchInboxConversations();
        }
    }, []);

    // Attach socket listeners when socket is ready
    useEffect(() => {
        if (!isSocketReady) {
            console.log('[useCoachInbox] Waiting for socket connection...');
            return;
        }

        console.log('[useCoachInbox] Socket ready, attaching listeners');
        const cleanup = attachInboxSocketListeners();

        return () => {
            cleanup();
        };
    }, [isSocketReady]);

    const markConversationAsRead = useCallback((conversationId: string) => {
        markConversationReadInStore(conversationId);
        messagingService.markAsRead(conversationId).catch((error) => {
            console.error('Error marking conversation as read:', error);
        });
    }, []);

    const refetch = useCallback(() => fetchInboxConversations(), []);

    const conversations = filter === 'unread'
        ? inboxStore.conversations.filter((conversation) => (conversation.unreadCount || 0) > 0)
        : inboxStore.conversations;

    return {
        conversations,
        isLoading: inboxStore.isLoading,
        stats: inboxStore.stats,
        totalUnread: inboxStore.stats.totalUnread,
        markConversationAsRead,
        refetch,
        initialized: inboxStore.initialized,
    };
}
