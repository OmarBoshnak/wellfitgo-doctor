import { ChatMessage, ChatConversation } from '../components/types';

export const MOCK_CONVERSATIONS: ChatConversation[] = [
    {
        id: '1',
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?u=1',
        isOnline: true,
        unreadCount: 2,
        lastMessage: 'Hi, I have a question about my diet.',
        lastMessageAt: Date.now() - 1000 * 60 * 5, // 5 mins ago
        priority: 'high',
    },
    {
        id: '2',
        name: 'Jane Smith',
        avatar: 'https://i.pravatar.cc/150?u=2',
        isOnline: false,
        lastMessage: 'Thanks for the workout plan!',
        lastMessageAt: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        priority: 'normal',
    },
    {
        id: '3',
        name: 'Mike Johnson',
        avatar: 'https://i.pravatar.cc/150?u=3',
        isOnline: true,
        lastMessage: 'When is our next session?',
        lastMessageAt: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    },
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
    '1': [
        {
            id: 'm1',
            type: 'text',
            sender: 'client',
            senderId: 'client_1',
            content: 'Hi, I have a question about my diet.',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            status: 'read',
        },
        {
            id: 'm2',
            type: 'text',
            sender: 'client',
            senderId: 'client_1',
            content: 'Can I eat bananas?',
            timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
            status: 'read',
        },
    ],
    '2': [
        {
            id: 'm3',
            type: 'text',
            sender: 'me',
            senderId: 'doctor_1',
            content: 'Here is your new workout plan.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            status: 'read',
        },
        {
            id: 'm4',
            type: 'text',
            sender: 'client',
            senderId: 'client_2',
            content: 'Thanks for the workout plan!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'read',
        },
    ],
    '3': [
        {
            id: 'm5',
            type: 'text',
            sender: 'client',
            senderId: 'client_3',
            content: 'When is our next session?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            status: 'read',
        },
    ],
};
