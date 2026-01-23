/**
 * Messaging Service
 * @description Service for chat/messaging functionality with backend API
 */

import api from './api/client';

// Types
export interface Conversation {
    id: string;
    clientId: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
    lastMessage: string;
    lastMessageAt: number;
    unreadCount: number;
    isActive: boolean;
}

export interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    senderRole: 'doctor' | 'client';
    content: string;
    messageType: 'text' | 'voice' | 'image' | 'document';
    mediaUrl?: string;
    mediaDuration?: number;
    replyToId?: string;
    isDeleted: boolean;
    isEdited: boolean;
    isReadByDoctor: boolean;
    isReadByClient: boolean;
    createdAt: string;
}

export interface SendMessageData {
    content: string;
    messageType?: 'text' | 'voice' | 'image' | 'document';
    mediaUrl?: string;
    mediaDuration?: number;
    replyToId?: string;
}

// API functions
export const messagingService = {
    /**
     * Get all conversations for the doctor
     */
    async getConversations(filter: 'all' | 'unread' = 'all'): Promise<Conversation[]> {
        try {
            const response = await api.get(`/chat/conversations?filter=${filter}`);

            if (response.data.success) {
                return response.data.data.map((conv: any) => ({
                    ...conv,
                    lastMessageAt: new Date(conv.lastMessageAt).getTime(),
                }));
            }
            throw new Error(response.data.message || 'Failed to fetch conversations');
        } catch (error) {
            console.error('[MessagingService] Error fetching conversations:', error);
            throw error;
        }
    },

    /**
     * Get or create a conversation with a client
     */
    async getOrCreateConversation(clientId: string): Promise<Conversation> {
        try {
            const response = await api.post('/chat/conversations', { clientId });

            if (response.data.success) {
                const conv = response.data.data;
                return {
                    ...conv,
                    lastMessageAt: new Date(conv.lastMessageAt).getTime(),
                };
            }
            throw new Error(response.data.message || 'Failed to get/create conversation');
        } catch (error) {
            console.error('[MessagingService] Error getting/creating conversation:', error);
            throw error;
        }
    },

    /**
     * Get messages for a conversation (paginated)
     */
    async getMessages(
        conversationId: string,
        cursor?: string,
        limit: number = 50
    ): Promise<{ messages: Message[]; nextCursor: string | null }> {
        try {
            const params = new URLSearchParams({ limit: limit.toString() });
            if (cursor) params.append('cursor', cursor);

            const response = await api.get(
                `/chat/conversations/${conversationId}/messages?${params.toString()}`
            );

            if (response.data.success) {
                return {
                    messages: response.data.data,
                    nextCursor: response.data.nextCursor,
                };
            }
            throw new Error(response.data.message || 'Failed to fetch messages');
        } catch (error) {
            console.error('[MessagingService] Error fetching messages:', error);
            throw error;
        }
    },

    /**
     * Send a message
     */
    async sendMessage(
        conversationId: string,
        data: SendMessageData
    ): Promise<Message> {
        try {
            const response = await api.post(
                `/chat/conversations/${conversationId}/messages`,
                data
            );

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to send message');
        } catch (error) {
            console.error('[MessagingService] Error sending message:', error);
            throw error;
        }
    },

    /**
     * Mark messages as read
     */
    async markAsRead(conversationId: string): Promise<void> {
        try {
            const response = await api.put(`/chat/conversations/${conversationId}/read`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to mark as read');
            }
        } catch (error) {
            console.error('[MessagingService] Error marking as read:', error);
            throw error;
        }
    },

    /**
     * Edit a message
     */
    async editMessage(messageId: string, content: string): Promise<Message> {
        try {
            const response = await api.put(`/chat/messages/${messageId}`, { content });

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Failed to edit message');
        } catch (error) {
            console.error('[MessagingService] Error editing message:', error);
            throw error;
        }
    },

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            const response = await api.delete(`/chat/messages/${messageId}`);

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete message');
            }
        } catch (error) {
            console.error('[MessagingService] Error deleting message:', error);
            throw error;
        }
    },
};

export default messagingService;
