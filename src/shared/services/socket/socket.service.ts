import { io, Socket } from 'socket.io-client';
import { Config } from '@/src/core/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;
let doctorNamespace: Socket | null = null;
let chatNamespace: Socket | null = null;

export const SocketService = {
    connect: async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Main Socket
        socket = io(Config.SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('Socket Connected:', socket?.id);
        });

        // Doctor Namespace
        doctorNamespace = io(`${Config.SOCKET_URL}/doctor`, {
            auth: { token },
            transports: ['websocket'],
        });

        doctorNamespace.on('connect', () => {
            console.log('Doctor Namespace Connected:', doctorNamespace?.id);
        });

        // Chat Namespace
        chatNamespace = io(`${Config.SOCKET_URL}/chat`, {
            auth: { token },
            transports: ['websocket'],
        });

        chatNamespace.on('connect', () => {
            console.log('Chat Namespace Connected:', chatNamespace?.id);
        });

        return { socket, doctorNamespace, chatNamespace };
    },

    joinDoctorRoom: (doctorId: string) => {
        if (doctorNamespace) {
            doctorNamespace.emit('join_doctor_room', doctorId);
        }
    },

    // Chat-specific methods
    joinConversation: (conversationId: string) => {
        if (chatNamespace) {
            chatNamespace.emit('join_conversation', conversationId);
        }
        // Also join on main socket for fallback
        if (socket) {
            socket.emit('join_conversation', conversationId);
        }
    },

    leaveConversation: (conversationId: string) => {
        if (chatNamespace) {
            chatNamespace.emit('leave_conversation', conversationId);
        }
        if (socket) {
            socket.emit('leave_conversation', conversationId);
        }
    },

    emitTyping: (conversationId: string, userId: string, isTyping: boolean) => {
        if (chatNamespace) {
            chatNamespace.emit(isTyping ? 'typing_start' : 'typing_stop', {
                conversationId,
                userId,
            });
        }
    },

    onNewMessage: (callback: (message: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('new_message', callback);
        }
        if (socket) {
            socket.on('new_message', callback);
        }
    },

    offNewMessage: () => {
        if (chatNamespace) {
            chatNamespace.off('new_message');
        }
        if (socket) {
            socket.off('new_message');
        }
    },

    onMessageEdited: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('message_edited', callback);
        }
        if (socket) {
            socket.on('message_edited', callback);
        }
    },

    offMessageEdited: () => {
        if (chatNamespace) {
            chatNamespace.off('message_edited');
        }
        if (socket) {
            socket.off('message_edited');
        }
    },

    onMessageDeleted: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('message_deleted', callback);
        }
        if (socket) {
            socket.on('message_deleted', callback);
        }
    },

    offMessageDeleted: () => {
        if (chatNamespace) {
            chatNamespace.off('message_deleted');
        }
        if (socket) {
            socket.off('message_deleted');
        }
    },

    onMessagesRead: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('messages_read', callback);
        }
    },

    offMessagesRead: () => {
        if (chatNamespace) {
            chatNamespace.off('messages_read');
        }
    },

    onUserTyping: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('user_typing', callback);
        }
    },

    offUserTyping: () => {
        if (chatNamespace) {
            chatNamespace.off('user_typing');
        }
    },

    disconnect: () => {
        if (socket) socket.disconnect();
        if (doctorNamespace) doctorNamespace.disconnect();
        if (chatNamespace) chatNamespace.disconnect();
        socket = null;
        doctorNamespace = null;
        chatNamespace = null;
    },

    on: (event: string, callback: (data: any) => void) => {
        if (doctorNamespace) {
            doctorNamespace.on(event, callback);
        }
    },

    off: (event: string) => {
        if (doctorNamespace) {
            doctorNamespace.off(event);
        }
    },

    // Get socket instances for direct access if needed
    getSocket: () => socket,
    getDoctorNamespace: () => doctorNamespace,
    getChatNamespace: () => chatNamespace,
};
