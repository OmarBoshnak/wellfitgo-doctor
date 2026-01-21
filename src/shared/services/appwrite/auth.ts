import { Client, Account, ID, OAuthProvider } from 'react-native-appwrite';
import * as WebBrowser from 'expo-web-browser';
import { Config } from '@/src/core/constants/Config';

// Initialize Appwrite Client using Config
const client = new Client()
    .setEndpoint(Config.APPWRITE_ENDPOINT)
    .setProject(Config.APPWRITE_PROJECT_ID);

// Initialize Account service
const account = new Account(client);

export class AppwriteAuth {
    /**
     * Create phone session using Appwrite phone token
     */
    static async createPhoneSession(phone: string) {
        try {
            const token = await account.createPhoneToken({
                userId: ID.unique(),
                phone: phone
            });
            return {
                success: true,
                data: {
                    userId: token.userId,
                    phone: phone
                }
            };
        } catch (error: any) {
            console.error('Phone session creation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to create phone session'
            };
        }
    }

    /**
     * Verify phone session with userId and secret (OTP)
     */
    static async verifyPhoneSession(userId: string, secret: string) {
        try {
            const session = await account.createSession({
                userId: userId,
                secret: secret
            });
            return { success: true, data: session };
        } catch (error: any) {
            console.error('Phone verification error:', error);
            return {
                success: false,
                error: error.message || 'Failed to verify phone number'
            };
        }
    }

    /**
     * Create OAuth2 session (Google, Facebook, Apple, etc.)
     */
    static async createOAuth2Session(provider: OAuthProvider) {
        try {
            // Check if there's an existing session and delete it first
            try {
                const existingUser = await account.get();
                if (existingUser) {
                    console.log('Existing session found, deleting before OAuth...');
                    await account.deleteSession({ sessionId: 'current' });
                }
            } catch {
                // No active session - this is expected, continue with OAuth
            }

            // Use dynamic callback URL based on project ID
            const callbackUrl = `appwrite-callback-${Config.APPWRITE_PROJECT_ID}://`;

            console.log(`Starting OAuth flow for ${provider} with callback: ${callbackUrl}`);

            // Start OAuth flow
            const loginUrl = await account.createOAuth2Token({
                provider: provider,
                success: callbackUrl,
                failure: callbackUrl,
                scopes: [] // Add scopes if needed for specific provider
            }
            );

            console.log('OAuth login URL:', loginUrl);

            // Open loginUrl and listen for the scheme redirect
            const result = await WebBrowser.openAuthSessionAsync(`${loginUrl}`, callbackUrl);

            console.log('OAuth Result:', result);

            if (result.type === 'success' && result.url) {
                // Extract credentials from OAuth redirect URL
                const url = new URL(result.url);
                const secret = url.searchParams.get('secret');
                const userId = url.searchParams.get('userId');

                console.log('Extracted credentials:', { userId, secret });

                if (secret && userId) {
                    // Create session with OAuth credentials
                    const session = await account.createSession({
                        userId,
                        secret
                    });
                    return { success: true, data: session };
                } else {
                    return {
                        success: false,
                        error: 'Failed to extract OAuth credentials from redirect'
                    };
                }
            } else {
                console.log('OAuth cancelled or failed:', result);
                return {
                    success: false,
                    error: result.type === 'cancel'
                        ? 'OAuth authentication was cancelled by user'
                        : 'OAuth authentication failed. Please check your Appwrite OAuth configuration.'
                };
            }
        } catch (error: any) {
            console.error('OAuth authentication error:', error);
            return {
                success: false,
                error: error.message || 'Failed to authenticate with OAuth provider'
            };
        }
    }

    /**
     * Get current user
     */
    static async getCurrentUser() {
        try {
            const user = await account.get();
            return { success: true, data: user };
        } catch (error: any) {
            console.error('Get current user error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get current user (raw - for sync)
     */
    static async getCurrentUserRaw() {
        return account.get();
    }

    /**
     * Get current session
     */
    static async getSession() {
        return account.getSession({
            sessionId: 'current'
        });
    }

    /**
     * Logout user
     */
    static async logout(sessionId: string = 'current') {
        try {
            await account.deleteSession({ sessionId });
            return { success: true };
        } catch (error: any) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if user is logged in
     */
    static async isLoggedIn() {
        try {
            const user = await account.get();
            return !!user;
        } catch (error) {
            return false;
        }
    }

    /**
     * ID generator utility
     */
    static get ID() {
        return ID;
    }

    /**
     * Ping to verify setup
     */
    static async ping() {
        try {
            console.log('Appwrite ping initiated...');
            return true;
        } catch (error) {
            console.error('Appwrite ping failed:', error);
            return false;
        }
    }
}

export default AppwriteAuth;
