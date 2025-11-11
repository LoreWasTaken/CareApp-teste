import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, RefreshCcw } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import type { ThemeColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const STORAGE_KEY = 'careapp_data';

export default function DebugStorageScreen() {
  const router = useRouter();
  const { theme } = useApp();
  const [storedText, setStoredText] = useState<string>('Loading...');
  const [errorText, setErrorText] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setStoredText('No data stored yet.');
      } else {
        try {
          const parsed = JSON.parse(stored);
          setStoredText(JSON.stringify(parsed, null, 2));
        } catch {
          setStoredText(stored);
        }
      }
      setErrorText(null);
    } catch (error) {
      console.error('[DebugStorage] Error reading storage', error);
      setErrorText(String(error));
      setStoredText('');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          activeOpacity={0.8}
          testID="debug-back-button"
        >
          <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stored Data</Text>
          <TouchableOpacity
          onPress={loadData}
          style={styles.headerButton}
          activeOpacity={0.8}
          testID="debug-refresh-button"
        >
          <RefreshCcw size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {errorText ? (
            <Text style={styles.errorText}>{errorText}</Text>
          ) : (
            <Text style={styles.codeBlock}>{storedText}</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
      paddingBottom: Spacing.lg,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: FontSizes.xl,
      fontWeight: '600' as const,
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.xl,
    },
    codeBlock: {
      fontFamily: Platform.select({
        ios: 'Menlo',
        android: 'monospace',
        default: 'monospace',
      }),
      fontSize: FontSizes.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      lineHeight: 22,
    },
    errorText: {
      color: colors.error,
      fontSize: FontSizes.md,
    },
  });
