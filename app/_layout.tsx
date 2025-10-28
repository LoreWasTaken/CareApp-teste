import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider, useApp } from "@/contexts/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { appData, isLoading, isAuthenticated, theme } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: theme.background },
    }),
    [theme.background]
  );
  const modalScreenOptions = useMemo(
    () => ({
      presentation: "modal" as const,
      contentStyle: { backgroundColor: theme.background },
    }),
    [theme.background]
  );

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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="settings" options={modalScreenOptions} />
        <Stack.Screen name="add-medication" options={modalScreenOptions} />
        <Stack.Screen name="debug-storage" options={modalScreenOptions} />
      </Stack>
    </View>
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
