import api from '../api/client';
import { AppwriteAuth } from '../appwrite/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'doctor' | 'admin';
    status?: 'active' | 'pending' | 'rejected'; // Added status field
    avatarUrl?: string;
    onboardingCompleted: boolean;
    coachProfileCompleted?: boolean;
}

interface ThreadResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
        routing: {
            destination: string;
            reason: string;
        };
    };
}

export const AuthService = {
    // Stage 1: Request OTP via Appwrite
    requestOtp: async (phone: string) => {
        return AppwriteAuth.createPhoneSession(phone);
    },

    // Stage 2: Verify OTP via Appwrite and Sync with Backend
    verifyOtp: async (userId: string, secret: string) => {
        const result = await AppwriteAuth.verifyPhoneSession(userId, secret);
        if (!result.success) {
            throw new Error(result.error);
        }
        return AuthService.syncWithBackend(result.data);
    },

    // OAuth Login
    loginWithOAuth: async (provider: any) => {
        const result = await AppwriteAuth.createOAuth2Session(provider);
        if (!result.success) {
            throw new Error(result.error);
        }
        return AuthService.syncWithBackend(result.data);
    },

    // Shared Sync Logic
    syncWithBackend: async (session: any) => {
        // Get Appwrite User Details
        const appwriteUser = await AppwriteAuth.getCurrentUserRaw();

        // Sync with Backend (Enhanced Sync)
        const response = await api.post<ThreadResponse>('/auth/enhanced-sync', {
            appwriteId: appwriteUser.$id,
            firstName: appwriteUser.name?.split(' ')[0] || 'Doctor',
            lastName: appwriteUser.name?.split(' ').slice(1).join(' ') || '',
            email: appwriteUser.email,
            phone: appwriteUser.phone,
            provider: 'oauth',
            role: 'doctor', // Force role to doctor
        });

        const { token, user, routing } = response.data.data;

        // Ensure user has a status, default to pending if missing
        if (!user.status) {
            user.status = 'pending';
        }

        // Store Token & User
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return { user, token, routing };
    },

    // Logout
    logout: async () => {
        try {
            await AppwriteAuth.logout();
        } catch (e) {
            console.log('Appwrite logout failed', e);
        }
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    },

    // Check Auth State
    checkAuth: async () => {
        const token = await AsyncStorage.getItem('token');
        const userStr = await AsyncStorage.getItem('user');

        if (!token || !userStr) return null;

        try {
            // Optional: Verify token with backend
            const response = await api.get('/auth/me');
            return response.data;
        } catch (e) {
            return JSON.parse(userStr);
        }
    }
};
