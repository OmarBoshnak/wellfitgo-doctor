import { Stack } from 'expo-router';

export default function SplashLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
            }}
        />
    );
}
