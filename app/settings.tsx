import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, User, Palette, Bell, Volume2, Vibrate, Trash2, Database } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { appData, updateSettings, clearData, theme } = useApp();
  const { user } = appData;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;
  
  const fontSize = user.largeText ? FontSizes.xl : FontSizes.lg;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.8}
            testID="back-button"
          >
            <ChevronLeft size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fontSize + 4 }]}>Settings</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Profile</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingItemContent}>
                <Text style={[styles.settingLabel, { fontSize }]}>Name</Text>
                <Text style={[styles.settingValue, { fontSize: fontSize - 2 }]}>
                  {user.name || 'Not set'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Accessibility</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>High Contrast</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  Enhance visibility with bold colors
                </Text>
              </View>
              <Switch
                style={styles.toggle}
                value={user.highContrast}
                onValueChange={(value) => updateSettings({ highContrast: value })}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="high-contrast-switch"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>Large Text</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  Increase font size for better readability
                </Text>
              </View>
              <Switch
                style={styles.toggle}
                value={user.largeText}
                onValueChange={(value) => updateSettings({ largeText: value })}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="large-text-switch"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>Dark Mode</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  Reduce glare with a darker interface
                </Text>
              </View>
              <Switch
                style={styles.toggle}
                value={user.darkMode}
                onValueChange={(value) => updateSettings({ darkMode: value })}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="dark-mode-switch"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Notifications</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingInfoRow}>
                  <Volume2 size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { fontSize }]}>Sound</Text>
                </View>
              </View>
              <Switch
                style={styles.toggle}
                value={user.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="sound-switch"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingInfoRow}>
                  <Vibrate size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { fontSize }]}>Vibration</Text>
                </View>
              </View>
              <Switch
                style={styles.toggle}
                value={user.vibrationEnabled}
                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="vibration-switch"
              />
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.8}
              onPress={() => router.push('/debug-storage')}
              testID="debug-storage-button"
            >
              <Database size={20} color={colors.primary} />
              <Text style={[styles.secondaryButtonText, { fontSize }]}>View Stored Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dangerButton}
              activeOpacity={0.8}
              testID="clear-data-button"
              onPress={() => {
                Alert.alert(
                  'Clear all data?',
                  'This will remove your account, medications, and history from this device.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear', 
                      style: 'destructive',
                      onPress: async () => {
                        await clearData();
                        router.replace('/onboarding');
                      },
                    },
                  ],
                );
              }}
            >
              <Trash2 size={20} color={colors.error} />
              <Text style={[styles.dangerButtonText, { fontSize }]}>Clear All Data</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appInfo}>
            <Text style={[styles.appInfoText, { fontSize: fontSize - 4 }]}>
              CareApp v1.0.0
            </Text>
            <Text style={[styles.appInfoText, { fontSize: fontSize - 4 }]}>
              Made with care for your health
            </Text>
          </View>
        </ScrollView>
      </View>
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
    backButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontWeight: '700' as const,
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    sectionTitle: {
      fontWeight: '700' as const,
      color: colors.text,
    },
    settingItem: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
      gap: Spacing.md,
    },
    settingItemContent: {
      flex: 1,
    },
    settingInfo: {
      flex: 1,
      alignItems: 'flex-start',
      gap: Spacing.xs,
    },
    settingInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    settingLabel: {
      color: colors.text,
      fontWeight: '600' as const,
      flexShrink: 1,
    },
    settingValue: {
      color: colors.textSecondary,
    },
    settingDescription: {
      color: colors.textSecondary,
      marginTop: Spacing.xs - 2,
      flexShrink: 1,
    },
    toggle: {
      alignSelf: 'center',
      marginLeft: Spacing.sm,
    },
    secondaryButton: {
      backgroundColor: colors.primary + '12',
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.primary + '24',
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    dangerButton: {
      backgroundColor: colors.error + '10',
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.error + '30',
    },
    dangerButtonText: {
      color: colors.error,
      fontWeight: '600' as const,
    },
    appInfo: {
      alignItems: 'center',
      marginTop: Spacing.xl,
      gap: Spacing.xs,
    },
    appInfoText: {
      color: colors.textLight,
      textAlign: 'center',
    },
  });
