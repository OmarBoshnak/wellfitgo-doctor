export const Config = {
    API_URL: (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000') + '/api',
    SOCKET_URL: process.env.EXPO_PUBLIC_WS_URL || 'http://localhost:5000',
    APPWRITE_ENDPOINT: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
    APPWRITE_PROJECT_ID: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
};
