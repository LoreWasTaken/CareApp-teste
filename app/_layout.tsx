import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NavigationHandler() {
  const { appData, isLoading } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!appData.onboardingCompleted && !inOnboarding) {
      console.log('[NavigationHandler] Redirecting to onboarding');
      router.replace('/onboarding');
    } else if (appData.onboardingCompleted && inOnboarding) {
      console.log('[NavigationHandler] Redirecting to home');
      router.replace('/');
    }

    SplashScreen.hideAsync();
  }, [appData.onboardingCompleted, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <NavigationHandler />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}