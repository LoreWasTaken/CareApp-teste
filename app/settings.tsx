import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, User, Palette, Bell, Volume2, Vibrate, Trash2, Database } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { appData, updateSettings, clearData } = useApp();
  const { user } = appData;
  
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
            <ChevronLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fontSize + 4 }]}>Settings</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User size={20} color={Colors.textSecondary} />
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
              <Palette size={20} color={Colors.textSecondary} />
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
                trackColor={{ false: Colors.disabled, true: Colors.primary }}
                thumbColor={Colors.surface}
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
                trackColor={{ false: Colors.disabled, true: Colors.primary }}
                thumbColor={Colors.surface}
                testID="large-text-switch"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color={Colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Notifications</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingInfoRow}>
                  <Volume2 size={20} color={Colors.textSecondary} />
                  <Text style={[styles.settingLabel, { fontSize }]}>Sound</Text>
                </View>
              </View>
              <Switch
                style={styles.toggle}
                value={user.soundEnabled}
                onValueChange={(value) => updateSettings({ soundEnabled: value })}
                trackColor={{ false: Colors.disabled, true: Colors.primary }}
                thumbColor={Colors.surface}
                testID="sound-switch"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingInfoRow}>
                  <Vibrate size={20} color={Colors.textSecondary} />
                  <Text style={[styles.settingLabel, { fontSize }]}>Vibration</Text>
                </View>
              </View>
              <Switch
                style={styles.toggle}
                value={user.vibrationEnabled}
                onValueChange={(value) => updateSettings({ vibrationEnabled: value })}
                trackColor={{ false: Colors.disabled, true: Colors.primary }}
                thumbColor={Colors.surface}
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
              <Database size={20} color={Colors.primary} />
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
              <Trash2 size={20} color={Colors.error} />
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
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700' as const,
    color: Colors.text,
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
    color: Colors.text,
  },
  settingItem: {
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    fontWeight: '600' as const,
    flexShrink: 1,
  },
  settingValue: {
    color: Colors.textSecondary,
  },
  settingDescription: {
    color: Colors.textSecondary,
    marginTop: Spacing.xs - 2,
    flexShrink: 1,
  },
  toggle: {
    alignSelf: 'center',
    marginLeft: Spacing.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.primary + '12',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '24',
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  dangerButton: {
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerButtonText: {
    color: Colors.error,
    fontWeight: '600' as const,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  appInfoText: {
    color: Colors.textLight,
    textAlign: 'center',
  },
});
