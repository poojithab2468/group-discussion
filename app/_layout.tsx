import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionProvider } from "@/context/SessionContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { GamificationProvider } from "@/context/GamificationContext";
import Colors from "@/constants/colors";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, hasSeenOnboarding, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth' || firstSegment === 'onboarding';

    if (!hasSeenOnboarding) {
      router.replace('/onboarding' as never);
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth' as never);
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)' as never);
    }
  }, [isLoading, isAuthenticated, hasSeenOnboarding, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: Colors.light.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-session"
        options={{ headerShown: true, presentation: "modal" }}
      />
      <Stack.Screen
        name="practice/[id]"
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="badge-unlock"
        options={{ headerShown: false, presentation: "transparentModal", animation: "fade" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <GamificationProvider>
            <SessionProvider>
              <AuthGate>
                <RootLayoutNav />
              </AuthGate>
            </SessionProvider>
          </GamificationProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
