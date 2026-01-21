import { AppwriteAuth } from "@/src/shared/services/appwrite/auth";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { Provider } from "react-redux";
import { store, useAppDispatch, useAppSelector } from "@/src/shared/store";
import { initializeAuth } from "@/src/shared/store/slices/authSlice";

// Keep the splash screen visible
SplashScreen.preventAutoHideAsync();

// Auth state listener component
function AuthStateListener({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isInitialized, isLoading, user } = useAppSelector(
    (state) => state.auth
  );

  // Initialize auth on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isOnApprovalScreen = segments.join('/').includes('ApprovalPendingScreen');

    if (isAuthenticated && inAuthGroup) {
      // Check if user is pending approval - they should stay on approval screen
      if (user?.status === 'pending' || !user?.status) {
        // If user is pending but NOT on approval screen, redirect them there
        if (!isOnApprovalScreen) {
          router.replace("/(auth)/ApprovalPendingScreen");
        }
        // Otherwise, let them stay on the approval screen
      } else if (user?.status === 'active') {
        // Only redirect active users to doctor home
        router.replace("/doctor");
      }
      // For rejected status, they'll be handled by the login screen
    } else if (!isAuthenticated && !inAuthGroup && segments[0] !== undefined) {
      // User is not signed in but trying to access protected route
      router.replace("/(auth)/LoginScreen");
    }
  }, [isAuthenticated, isInitialized, isLoading, segments, router, user]);

  // Hide splash screen when initialized
  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => {
    // Verify Appwrite Setup
    AppwriteAuth.ping();
  }, []);

  return (
    <Provider store={store}>
      <AuthStateListener>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="SplashScreen"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="doctor" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
      </AuthStateListener>
    </Provider>
  );
}
