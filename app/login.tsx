import { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, UserPlus, LogIn } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';
import { deleteUser } from '@/app/services/api';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { login, appData, theme, clearData, register } = useApp();
  const [email, setEmail] = useState(appData.user.email);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const passwordInputRef = useRef<TextInput | null>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    const sanitizedPassword = password.trim();

    if (!normalizedEmail || !sanitizedPassword) {
      Alert.alert('Missing information', 'Enter both email and password to continue.');
      return;
    }

    if (authMode === 'register' && !name.trim()) {
      Alert.alert('Missing information', 'Please enter your name.');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'register') {
        // Handle registration
        await register({ name: name.trim(), email: normalizedEmail, password: sanitizedPassword });
        router.replace('/');
      } else {
        // Handle login
        const success = await login(normalizedEmail, sanitizedPassword);
        if (success) {
          router.replace('/');
        } else {
          Alert.alert('Login failed', 'Email or password did not match. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert(
        authMode === 'register' ? 'Registration error' : 'Login error',
        'An error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {authMode === 'login' ? (
            <LogIn size={72} color={colors.primary} strokeWidth={1.5} />
          ) : (
            <UserPlus size={72} color={colors.primary} strokeWidth={1.5} />
          )}
        </View>
        <Text style={styles.title}>
          {authMode === 'login' ? 'Welcome back' : 'Create Account'}
        </Text>
        <Text style={styles.subtitle}>
          {authMode === 'login'
            ? 'Sign in to access your medication schedule.'
            : 'Create your CareApp account to get started.'
          }
        </Text>

        <View style={styles.form}>
          {authMode === 'register' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                testID="register-name-input"
              />
            </>
          )}

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

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isLoading}
          testID="login-submit-button"
        >
          <Text style={styles.buttonText}>
            {isLoading
              ? (authMode === 'login' ? 'Logging in...' : 'Creating account...')
              : (authMode === 'login' ? 'Log In' : 'Create Account')
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          activeOpacity={0.6}
          onPress={() => router.replace('/onboarding')}
        >
          <Text style={styles.linkText}>
            {authMode === 'login' ? "New to CareApp? Get started" : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>

        {authMode === 'register' && (
          <TouchableOpacity
            style={styles.linkButton}
            activeOpacity={0.6}
            onPress={toggleAuthMode}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        )}
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
    buttonDisabled: {
      backgroundColor: colors.disabled,
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
