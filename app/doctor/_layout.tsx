import { Stack } from 'expo-router';

export default function DoctorLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="diet-plans" options={{ headerShown: false }} />
            <Stack.Screen name="sequences-list" options={{ headerShown: false }} />
            <Stack.Screen name="sequence-editor" options={{ headerShown: false }} />
        </Stack>
    );
}
