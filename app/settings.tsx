import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform, Alert, Clipboard } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, User, Palette, Bell, Volume2, Vibrate, Trash2, Database, LogOut, Wifi, Monitor, Key, Copy, Eye, EyeOff } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';
import { checkHealth, generateApiKey, getApiKeys } from '@/app/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { appData, updateSettings, clearData, logout, theme, fontSize } = useApp();
  const { user } = appData;
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed' | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState<boolean>(false);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;
  
  // Load existing API key on component mount
  useEffect(() => {
    // Don't initialize with empty string - let user generate or load existing
    console.log('🔑 Settings mounted, current apiKey state:', apiKey);
  }, [apiKey]);
  
  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      console.log('🔑 Generating API key via backend...');
      console.log('📡 Current API key before generation:', apiKey);
      
      const response = await generateApiKey();
      
      console.log('📦 Raw API response received:', JSON.stringify(response, null, 2));
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', response ? Object.keys(response) : 'No keys');
      
      if (response && response.plain_api_key && response.plain_api_key.trim() !== '') {
        console.log('✅ Setting API key to:', response.plain_api_key);
        setApiKey(response.plain_api_key);
        
        Alert.alert(
          'API Key Generated',
          'Your new API key has been generated. It will expire in 14 days. Copy this key now as it cannot be retrieved again.',
          [{ text: 'OK' }]
        );
        
        console.log('✅ API key generated and set successfully');
      } else {
        const errorMsg = response ?
          `Invalid response structure. Keys: ${Object.keys(response).join(', ')}` :
          'No response from server';
        console.error('❌ Response structure issue:', errorMsg);
        console.error('❌ Full response:', JSON.stringify(response, null, 2));
        throw new Error(`API key generation failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Error generating API key:', error);
      Alert.alert('Error', `Failed to generate API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingKey(false);
    }
  };
  
  // Load existing API keys on component mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const response = await getApiKeys();
        if (response && response.api_keys && response.api_keys.length > 0) {
          // Show the most recent API key info (without the actual key for security)
          console.log(`📊 Found ${response.api_keys.length} API keys`);
        }
      } catch (error) {
        console.error('❌ Error loading API keys:', error);
        // Don't show error to user for this
      }
    };
    
    loadApiKeys();
  }, []);
  
  const copyApiKey = async () => {
    try {
      await Clipboard.setString(apiKey);
      Alert.alert('Copied', 'API key copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy API key');
    }
  };
  
  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  // Determine system preference indication
  // When darkMode is false, it could mean system preference is being followed
  // We show "System" indicator when user hasn't explicitly overridden the setting
  const isFollowingSystemTheme = !user.darkMode; // Simple logic: if darkMode is false, show system indicator
  
  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      await checkHealth();
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('failed');
    }
  };

  const handleDarkModeToggle = (value: boolean) => {
    updateSettings({ darkMode: value });
  };

  const getDarkModeDescription = () => {
    if (user.darkMode) {
      return 'Dark theme is enabled';
    }
    return 'Following system preference (tap to override)';
  };

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
              <Text style={[styles.sectionTitle, { fontSize }]}>Accessibility & Appearance</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingInfoRow}>
                  <Monitor size={20} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { fontSize }]}>Dark Mode</Text>
                  {isFollowingSystemTheme && (
                    <View style={styles.systemPreferenceBadge}>
                      <Text style={[styles.systemPreferenceText, { fontSize: fontSize - 6 }]}>System</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  {getDarkModeDescription()}
                </Text>
              </View>
              <Switch
                style={styles.toggle}
                value={user.darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: colors.disabled, true: colors.primary }}
                thumbColor={colors.surface}
                testID="dark-mode-switch"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>High Contrast</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  Enhanced visibility with bold colors for better accessibility
                </Text>
              </View>
              <Switch
                style={styles.toggle}
                value={user.highContrast}
                onValueChange={(value) => {
                  updateSettings({ highContrast: value });
                  // If high contrast is enabled, ensure dark mode is also considered
                  if (value && !user.darkMode) {
                    console.log('[Settings] High contrast enabled - consider dark mode for best experience');
                  }
                }}
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

            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert(
                  'Log Out',
                  'Are you sure you want to log out?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Log Out',
                      style: 'destructive',
                      onPress: () => {
                        logout();
                        router.replace('/login');
                      },
                    },
                  ],
                );
              }}
              testID="logout-button"
            >
              <LogOut size={20} color={colors.error} />
              <Text style={[styles.logoutButtonText, { fontSize }]}>Log Out</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Wifi size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Network Status</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>Backend Connection</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  {connectionStatus === 'testing' && 'Testing connection...'}
                  {connectionStatus === 'connected' && '✅ Connected to backend server'}
                  {connectionStatus === 'failed' && '❌ Cannot reach backend server'}
                  {!connectionStatus && 'Test connection to server'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.testButton, connectionStatus === 'testing' && styles.testButtonDisabled]}
                onPress={testConnection}
                disabled={connectionStatus === 'testing'}
                testID="test-connection-button"
              >
                <Text style={[styles.testButtonText, { fontSize: fontSize - 2 }]}>
                  {connectionStatus === 'testing' ? 'Testing...' : 'Test'}
                </Text>
              </TouchableOpacity>
            </View>

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
            <View style={styles.sectionHeader}>
              <Key size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize }]}>Developer Tools</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { fontSize }]}>API Key</Text>
                <Text style={[styles.settingDescription, { fontSize: fontSize - 4 }]}>
                  Use this key for third-party integrations and API access
                </Text>
                <View style={styles.apiKeyContainer}>
                  <Text style={[styles.apiKeyText, { fontSize: fontSize - 2 }]}>
                    {showApiKey ? apiKey : `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`}
                  </Text>
                  <View style={styles.apiKeyActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={copyApiKey}
                      testID="copy-api-key-button"
                    >
                      <Copy size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={toggleApiKeyVisibility}
                      testID="toggle-api-key-visibility-button"
                    >
                      {showApiKey ? (
                        <EyeOff size={16} color={colors.textSecondary} />
                      ) : (
                        <Eye size={16} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isGeneratingKey && styles.primaryButtonDisabled]}
              onPress={handleGenerateApiKey}
              disabled={isGeneratingKey}
              testID="generate-api-key-button"
            >
              <Key size={20} color={isGeneratingKey ? colors.textSecondary : colors.surface} />
              <Text style={[styles.primaryButtonText, { fontSize }, isGeneratingKey && { color: colors.textSecondary }]}>
                {isGeneratingKey ? 'Generating...' : 'Generate New Key'}
              </Text>
            </TouchableOpacity>

            <View style={styles.apiInfoBox}>
              <Text style={[styles.apiInfoTitle, { fontSize: fontSize - 2 }]}>API Usage</Text>
              <Text style={[styles.apiInfoText, { fontSize: fontSize - 4 }]}>
                {`• Include your API key in the Authorization header as 'Bearer {your-api-key}'\n`}
                {`• Rate limit: 1000 requests per hour\n`}
                {`• Base URL: https://api.careapp.com/v1\n`}
                • Access your health data, symptoms, and medications
              </Text>
            </View>
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
      paddingBottom: Platform.select({
        ios: Spacing.xxl,
        android: Spacing.xl,
        default: Spacing.xl,
      }),
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
    systemPreferenceBadge: {
      backgroundColor: colors.primary + '20',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      marginLeft: Spacing.xs,
    },
    systemPreferenceText: {
      color: colors.primary,
      fontWeight: '500' as const,
    },
    toggle: {
      alignSelf: 'center',
      marginLeft: Spacing.sm,
    },
    testButton: {
      backgroundColor: colors.primary + '20',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minWidth: 60,
      alignItems: 'center',
    },
    testButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    testButtonText: {
      color: colors.primary,
      fontWeight: '600' as const,
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
    logoutButton: {
      backgroundColor: colors.error + '08',
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.error + '20',
      marginTop: Spacing.md,
    },
    logoutButtonText: {
      color: colors.error,
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
    apiKeyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    apiKeyText: {
      color: colors.text,
      fontFamily: 'monospace',
      flex: 1,
      marginRight: Spacing.sm,
    },
    apiKeyActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    primaryButtonText: {
      color: colors.surface,
      fontWeight: '600' as const,
    },
    apiInfoBox: {
      backgroundColor: colors.primary + '08',
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    apiInfoTitle: {
      color: colors.primary,
      fontWeight: '600' as const,
      marginBottom: Spacing.sm,
    },
    apiInfoText: {
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });
