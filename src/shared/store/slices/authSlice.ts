import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, User } from '../../services/auth/auth.service';
import { AppwriteAuth } from '../../services/appwrite/auth';

// Auth State Interface
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;
}

// Initial State
const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,
};

// Async Thunks

// Initialize auth state from storage
export const initializeAuth = createAsyncThunk(
    'auth/initialize',
    async (_, { rejectWithValue }) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                // Verify session is still valid with Appwrite
                const isValid = await AppwriteAuth.isLoggedIn();
                if (isValid) {
                    return {
                        user: JSON.parse(userStr) as User,
                        token,
                    };
                }
            }

            // Clear stale data
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            return null;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Logout
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await AuthService.logout();
            return true;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Auth Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Set user after successful login
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.error = null;
        },
        // Clear error
        clearError: (state) => {
            state.error = null;
        },
        // Reset auth state
        resetAuth: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Initialize Auth
        builder.addCase(initializeAuth.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(initializeAuth.fulfilled, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            if (action.payload) {
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            }
        });
        builder.addCase(initializeAuth.rejected, (state, action) => {
            state.isLoading = false;
            state.isInitialized = true;
            state.error = action.payload as string;
        });

        // Logout
        builder.addCase(logout.pending, (state) => {
            state.isLoading = true;
        });
        builder.addCase(logout.fulfilled, (state) => {
            state.isLoading = false;
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        });
        builder.addCase(logout.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.payload as string;
            // Still clear auth even if API fails
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        });
    },
});

export const { setCredentials, clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
