export const colors = {
    primaryDark: '#5073FE',
    primaryLight: '#02C3CD',
    dark: '#000',
    darkGray: '#666',
    gray: '#AABBC5',
    white: '#FFFFFF',
    info: '#2F80EC',
    success: '#27AE61',
    warning: '#E2B93B',
    error: '#EB5757',
    faceBookButton: '#475993',
    googleButton: '#EA4335',
    // Additional colors for home screen
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F5F7FA',
    textPrimary: '#1A1A2E',
    textSecondary: '#7A7A8C',
    border: '#E8E8EE',
    primaryLightBg: 'rgba(80, 115, 254, 0.1)',
    secondary: '#E8E8EE',
    // Glassmorphism colors
    glassWhite: 'rgba(255, 255, 255, 0.9)',
    glassBorder: 'rgba(255, 255, 255, 0.5)',
    glassOverlay: 'rgba(255, 255, 255, 0.1)',
    // Aliases for compatibility
    primary: '#5073FE',
    background: '#F5F7FA',
};

export const gradients = {
    primary: ['#5073FE', '#02C3CD'] as const,
    success: ['#22C55E', '#10B981'] as const,
    warning: ['#F59E0B', '#EAB308'] as const,
    error: ['#EF4444', '#DC2626'] as const,
    header: ['#5073FE', '#6B8BFE'] as const,
    card: ['#FFFFFF', '#F8FAFC'] as const,
    shimmer: ['#F5F7FA', '#E8E8EE', '#F5F7FA'] as const,
};

export const shadows = {
    light: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    medium: {
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    float: {
        shadowColor: '#5073FE',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
};

