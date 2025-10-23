import { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { login, appData, theme } = useApp();
  const [email, setEmail] = useState(appData.user.email);
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef<TextInput | null>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;

  const handleSubmit = () => {
    const normalizedEmail = email.trim();
    const sanitizedPassword = password.trim();

    if (!normalizedEmail || !sanitizedPassword) {
      Alert.alert('Missing information', 'Enter both email and password to continue.');
      return;
    }

    const success = login(normalizedEmail, sanitizedPassword);
    if (success) {
      router.replace('/');
    } else {
      Alert.alert('Login failed', 'Email or password did not match. Please try again.');
    }
  };

  const handleRegisterNavigation = () => {
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Lock size={72} color={colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with the credentials you created during setup.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
            testID="login-email-input"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            testID="login-password-input"
          />
        </View>

        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={handleSubmit} testID="login-submit-button">
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} activeOpacity={0.6} onPress={handleRegisterNavigation}>
          <Text style={styles.linkText}>Need to register again?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.lg,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 18,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: '0 6px 18px rgba(74, 144, 226, 0.2)',
        },
      }),
    },
    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: '700' as const,
      color: colors.text,
    },
    subtitle: {
      fontSize: FontSizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: Spacing.md,
    },
    form: {
      width: '100%',
      gap: Spacing.md,
    },
    label: {
      fontSize: FontSizes.md,
      color: colors.text,
      fontWeight: '600' as const,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      fontSize: FontSizes.lg,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    button: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.xl,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
        },
      }),
    },
    buttonText: {
      color: colors.surface,
      fontSize: FontSizes.xl,
      fontWeight: '600' as const,
    },
    linkButton: {
      paddingVertical: Spacing.sm,
    },
    linkText: {
      color: colors.textSecondary,
      fontSize: FontSizes.md,
      fontWeight: '500' as const,
    },
  });
