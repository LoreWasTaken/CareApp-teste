import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { appData, isLoading, isAuthenticated } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = pathname === '/onboarding';
    const inLogin = pathname === '/login';

    if (!appData.onboardingCompleted) {
      if (!inOnboarding) {
        console.log('[RootLayout] Redirecting to onboarding');
        router.replace('/onboarding');
      }
      return;
    }

    if (!isAuthenticated) {
      if (!inLogin) {
        console.log('[RootLayout] Redirecting to login');
        router.replace('/login');
      }
      return;
    }

    if (inOnboarding || inLogin) {
      console.log('[RootLayout] Redirecting to home');
      router.replace('/');
    }
  }, [appData.onboardingCompleted, isAuthenticated, isLoading, pathname, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="add-medication" options={{ presentation: "modal" }} />
      <Stack.Screen name="debug-storage" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      /* noop */
    });
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
