import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronLeft, RefreshCcw } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/colors';

const STORAGE_KEY = 'careapp_data';

export default function DebugStorageScreen() {
  const router = useRouter();
  const [storedText, setStoredText] = useState<string>('Loading...');
  const [errorText, setErrorText] = useState<string | null>(null);

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
            <ChevronLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Stored Data</Text>
          <TouchableOpacity
            onPress={loadData}
            style={styles.headerButton}
            activeOpacity={0.8}
            testID="debug-refresh-button"
          >
            <RefreshCcw size={22} color={Colors.textSecondary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.text,
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
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 22,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.md,
  },
});
