import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { appData, isLoading, isAuthenticated } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (!appData.onboardingCompleted && !inOnboarding) {
      console.log('[RootLayout] Redirecting to onboarding');
      router.replace('/onboarding');
      return;
    }

    if (appData.onboardingCompleted && !isAuthenticated && !inLogin) {
      console.log('[RootLayout] Redirecting to login');
      router.replace('/login');
      return;
    }

    if (isAuthenticated && (inOnboarding || inLogin)) {
      console.log('[RootLayout] Redirecting to home');
      router.replace('/');
    }
  }, [appData.onboardingCompleted, isAuthenticated, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-medication" options={{ presentation: "modal" }} />
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
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
