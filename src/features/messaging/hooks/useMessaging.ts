import { useCallback, useEffect, useMemo, useState } from 'react';
import { MOCK_MESSAGES, MOCK_CONVERSATIONS } from '../data/mockData';
import { ChatMessage, ChatConversation } from '../components/types';

export type InboxFilter = 'all' | 'unread' | 'favorites' | 'archived';

interface CoachInboxStats {
    totalUnread: number;
    totalActive: number;
}

// Map ChatMessage to local Message type expected by components if needed, or unify types.
// The existing components seem to expect a Message type defined locally in the old hook or imported.
// Let's align with the types defined in components/types.ts which we used for mocks.
// However, the components might be using the local Message type definition from the old file.
// Let's check if we can just use ChatMessage everywhere.

// The old local Message type had some differences. Let's adapt our hook to return what components expect.

type Message = {
    _id: string;
    conversationId: string;
    senderId: string;
    senderRole?: string;
    content: string;
    messageType?: string;
    mediaUrl?: string;
    mediaDuration?: number;
    isDeleted?: boolean;
    isEdited?: boolean;
    isReadByClient?: boolean;
    isReadByCoach?: boolean;
    createdAt: string;
    optimistic?: boolean;
};

// Helper to convert mock ChatMessage to internal Message format
const convertToInternalMessage = (msg: ChatMessage, conversationId: string): Message => ({
    _id: msg.id,
    conversationId,
    senderId: msg.senderId || (msg.sender === 'me' ? 'me' : 'client'),
    content: msg.content,
    messageType: msg.type,
    mediaUrl: msg.audioUri,
    mediaDuration: msg.audioDuration,
    isDeleted: msg.status === 'deleted',
    isEdited: msg.status === 'edited',
    createdAt: msg.timestamp,
    optimistic: msg.status === 'sending',
});

export function useMessages(conversationId?: string, currentUserId?: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);
        // Simulate API delay
        const timer = setTimeout(() => {
            const mockMsgs = MOCK_MESSAGES[conversationId] || [];
            setMessages(mockMsgs.map(m => convertToInternalMessage(m, conversationId)));
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
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
            const newMsg: Message = {
                _id: tempId,
                conversationId,
                senderId: currentUserId || 'me',
                content: data.content,
                messageType: data.messageType || 'text',
                mediaUrl: data.mediaUrl,
                mediaDuration: data.mediaDuration,
                isDeleted: false,
                isEdited: false,
                createdAt: new Date().toISOString(),
                optimistic: true,
            };
            setMessages((prev) => [...prev, newMsg]);
            return tempId;
        },
        [conversationId, currentUserId]
    );

    const replaceOptimisticMessage = useCallback((tempId: string | null, realMessage?: Message) => {
        if (!tempId || !realMessage) return;
        setMessages((prev) => prev.map((m) => (m._id === tempId ? realMessage : m)));
    }, []);

    const removeOptimisticMessage = useCallback((tempId: string | null) => {
        if (!tempId) return;
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }, []);

    const updateLocal = useCallback((id: string, partial: Partial<Message>) => {
        setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, ...partial } : m)));
    }, []);

    const markAsRead = useCallback(async () => {
        // No-op for mocks
        console.log('Marking conversation as read:', conversationId);
    }, [conversationId]);

    return {
        messages,
        isLoading,
        error,
        addOptimisticMessage,
        replaceOptimisticMessage,
        removeOptimisticMessage,
        updateLocal,
        markAsRead,
    };
}

export function useSendMessage() {
    const [isLoading, setIsLoading] = useState(false);

    const send = useCallback(
        async (data: {
            conversationId: string;
            content: string;
            messageType?: string;
            mediaUrl?: string;
            mediaDuration?: number;
        }) => {
            setIsLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const newMessage: Message = {
                _id: `msg-${Date.now()}`,
                conversationId: data.conversationId,
                senderId: 'me',
                content: data.content,
                messageType: data.messageType || 'text',
                mediaUrl: data.mediaUrl,
                mediaDuration: data.mediaDuration,
                createdAt: new Date().toISOString(),
                isDeleted: false,
                isEdited: false,
            };
            setIsLoading(false);
            return newMessage;
        },
        []
    );

    return { send, isLoading };
}

export function useChatScreen(conversationId?: string) {
    const { messages, isLoading, markAsRead, addOptimisticMessage, replaceOptimisticMessage } = useMessages(conversationId, 'me');
    const { send } = useSendMessage();

    const sendMessage = useCallback(
        async (
            content: string,
            messageType: 'text' | 'image' | 'voice' = 'text',
            mediaUrl?: string,
            mediaDuration?: number,
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
                });

                // Replace optimistic with real
                if (tempId && response) {
                    replaceOptimisticMessage(tempId, response);
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                // Ideally remove optimistic message on error, but keeping simple for now
            }
        },
        [conversationId, send, addOptimisticMessage, replaceOptimisticMessage]
    );

    return {
        messages,
        isLoading,
        sendMessage,
        markAsRead,
    };
}

export function useCoachInbox(filter: InboxFilter = 'all') {
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<CoachInboxStats>({ totalUnread: 0, totalActive: 0 });

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        const timer = setTimeout(() => {
            let filtered = [...MOCK_CONVERSATIONS];

            if (filter === 'unread') {
                filtered = filtered.filter(c => (c.unreadCount || 0) > 0);
            }

            setConversations(filtered);

            // Calculate stats
            const totalUnread = MOCK_CONVERSATIONS.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
            const totalActive = MOCK_CONVERSATIONS.length;
            setStats({ totalUnread, totalActive });

            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [filter]);

    return {
        conversations,
        isLoading,
        stats,
        totalUnread: stats.totalUnread, // Backward compatibility
    };
}
