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

    const inLogin = pathname === '/login';
    const inOnboarding = pathname === '/onboarding';
    const hasUserData = appData.user?.email;

    if (!isAuthenticated) {
      // If no user data exists, redirect to onboarding for first-time setup
      if (!hasUserData && !inOnboarding) {
        console.log('[RootLayout] First-time user, redirecting to onboarding');
        router.replace('/onboarding');
        return;
      }
      
      // Otherwise redirect to login
      if (!inLogin && !inOnboarding) {
        console.log('[RootLayout] Redirecting to login');
        router.replace('/login');
      }
      return;
    }

    // If authenticated, redirect away from auth screens
    if (inLogin || inOnboarding) {
      console.log('[RootLayout] Redirecting to home');
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, pathname, router, appData.user?.email]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="settings" options={modalScreenOptions} />
        <Stack.Screen name="add-medication" options={modalScreenOptions} />
        <Stack.Screen name="log-symptom" options={modalScreenOptions} />
        <Stack.Screen name="doctor-report" options={modalScreenOptions} />
        <Stack.Screen name="calendar-view" options={modalScreenOptions} />
        <Stack.Screen name="caregiver-portal" options={modalScreenOptions} />
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
