import { io, Socket } from 'socket.io-client';
import { Config } from '@/src/core/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;
let doctorNamespace: Socket | null = null;
let chatNamespace: Socket | null = null;

// Connection state tracking
let connectionState = {
    mainConnected: false,
    chatConnected: false,
    doctorConnected: false,
};

const connectionListeners = new Set<() => void>();

// Notify all listeners when connection state changes
const notifyConnectionListeners = () => {
    connectionListeners.forEach((listener) => listener());
};

// Check if messaging is ready (either chat or main socket connected)
const isMessagingReady = () => {
    return connectionState.chatConnected || connectionState.mainConnected;
};

export const SocketService = {
    connect: async () => {
        if (socket && doctorNamespace && chatNamespace) {
            return { socket, doctorNamespace, chatNamespace };
        }

        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        // Read the stored user to include userId & role in socket auth
        let userId: string | undefined;
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                userId = user._id || user.id;
            }
        } catch (e) {
            console.warn('[SocketService] Failed to read user from storage:', e);
        }

        const authPayload = { token, userId, role: 'doctor' as const };

        // Main Socket
        socket = io(Config.SOCKET_URL, {
            auth: authPayload,
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[SocketService] Main socket connected:', socket?.id);
            connectionState.mainConnected = true;
            notifyConnectionListeners();
            if (userId) {
                socket?.emit('join_user_room', userId);
            }
        });

        socket.on('disconnect', () => {
            console.log('[SocketService] Main socket disconnected');
            connectionState.mainConnected = false;
            notifyConnectionListeners();
        });

        // Doctor Namespace
        doctorNamespace = io(`${Config.SOCKET_URL}/doctor`, {
            auth: authPayload,
            transports: ['websocket'],
        });

        doctorNamespace.on('connect', () => {
            console.log('[SocketService] Doctor namespace connected:', doctorNamespace?.id);
            connectionState.doctorConnected = true;
            notifyConnectionListeners();
        });

        doctorNamespace.on('disconnect', () => {
            console.log('[SocketService] Doctor namespace disconnected');
            connectionState.doctorConnected = false;
            notifyConnectionListeners();
        });

        // Chat Namespace
        chatNamespace = io(`${Config.SOCKET_URL}/chat`, {
            auth: authPayload,
            transports: ['websocket'],
        });

        chatNamespace.on('connect', () => {
            console.log('[SocketService] Chat namespace connected:', chatNamespace?.id);
            connectionState.chatConnected = true;
            notifyConnectionListeners();
            if (userId) {
                chatNamespace?.emit('join_user_room', userId);
            }
        });

        chatNamespace.on('disconnect', () => {
            console.log('[SocketService] Chat namespace disconnected');
            connectionState.chatConnected = false;
            notifyConnectionListeners();
        });

        if (userId && socket?.connected) {
            socket.emit('join_user_room', userId);
        }

        if (userId && chatNamespace?.connected) {
            chatNamespace.emit('join_user_room', userId);
        }

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

    offNewMessage: (callback?: (message: any) => void) => {
        if (chatNamespace) {
            chatNamespace.off('new_message', callback);
        }
        if (socket) {
            socket.off('new_message', callback);
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

    offMessageEdited: (callback?: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.off('message_edited', callback);
        }
        if (socket) {
            socket.off('message_edited', callback);
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

    offMessageDeleted: (callback?: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.off('message_deleted', callback);
        }
        if (socket) {
            socket.off('message_deleted', callback);
        }
    },

    onMessagesRead: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('messages_read', callback);
        }
    },

    offMessagesRead: (callback?: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.off('messages_read', callback);
        }
    },

    onUserTyping: (callback: (data: any) => void) => {
        if (chatNamespace) {
            chatNamespace.on('user_typing', callback);
        }
    },

    onUserStatusUpdated: (callback: (data: any) => void) => {
        if (socket) {
            socket.on('user_status_updated', callback);
        }
    },

    offUserStatusUpdated: (callback?: (data: any) => void) => {
        if (socket) {
            socket.off('user_status_updated', callback);
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
        // Reset connection state
        connectionState.mainConnected = false;
        connectionState.chatConnected = false;
        connectionState.doctorConnected = false;
        notifyConnectionListeners();
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

    // Connection state management
    isMessagingReady,
    onConnectionChange: (callback: () => void) => {
        connectionListeners.add(callback);
        return () => connectionListeners.delete(callback);
    },
    getConnectionState: () => ({ ...connectionState }),
};
