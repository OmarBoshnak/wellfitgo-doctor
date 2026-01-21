import { io, Socket } from 'socket.io-client';
import { Config } from '@/src/core/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

let socket: Socket | null = null;
let doctorNamespace: Socket | null = null;

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

        return { socket, doctorNamespace };
    },

    joinDoctorRoom: (doctorId: string) => {
        if (doctorNamespace) {
            doctorNamespace.emit('join_doctor_room', doctorId);
        }
    },

    disconnect: () => {
        if (socket) socket.disconnect();
        if (doctorNamespace) doctorNamespace.disconnect();
        socket = null;
        doctorNamespace = null;
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
    }
};
