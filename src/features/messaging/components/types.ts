// Message types for chat
export interface ChatMessage {
    id: string;
    type: 'text' | 'audio' | 'system' | 'image' | 'meal_plan';
    sender: 'me' | 'client';
    senderId?: string; // Convex user ID for ownership checks
    content: string;
    timestamp: string;
    status: 'sending' | 'sent' | 'read' | 'edited' | 'deleted';
    isEdited?: boolean;
    isDeleted?: boolean;
    audioUri?: string;
    audioDuration?: number; // milliseconds
    replyToId?: string; // ID of the message being replied to
    replyToContent?: string; // Content of the replied message
    replyToSenderId?: string; // Sender ID of the replied message
    replyToSenderRole?: 'doctor' | 'client'; // Role of the replied message sender
    replyTo?: {
        id: string;
        content: string;
        sender: 'me' | 'client';
    }; // Preview of replied message (legacy)
}

export interface ChatConversation {
    id: string;
    conversationId?: string; // Convex conversation ID
    clientId?: string; // Client user ID for profile navigation
    name: string;
    avatar: string;
    isOnline: boolean;
    unreadCount?: number;
    lastMessage?: string;
    lastMessageAt?: number;
    isPinned?: boolean;
    priority?: 'normal' | 'high' | 'urgent';
}

