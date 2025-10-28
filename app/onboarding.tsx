import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Platform, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pill, Bluetooth, Bell } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';

const STEPS = [
  {
    icon: Pill,
    title: 'Welcome to CareApp',
    description: 'Your personal medication assistant for staying on track with your health',
  },
  {
    icon: Bluetooth,
    title: 'Connect Your Devices',
    description: 'Sync with CareBox and CareBand for seamless medication reminders',
  },
  {
    icon: Bell,
    title: 'Never Miss a Dose',
    description: 'Get timely notifications with sound, vibration, and visual alerts',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, theme } = useApp();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);
  const confirmPasswordInputRef = useRef<TextInput | null>(null);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
      });
    }
  };

  const handleComplete = () => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    const sanitizedConfirm = confirmPassword.trim();

    if (!normalizedEmail || !sanitizedPassword || !sanitizedConfirm) {
      Alert.alert(
        'Missing information',
        'Please fill out email, password, and password confirmation.'
      );
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (sanitizedPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    if (sanitizedPassword !== sanitizedConfirm) {
      Alert.alert('Passwords do not match', 'Please make sure both passwords match.');
      return;
    }

    console.log('[Onboarding] Completing login for email:', normalizedEmail);
    completeOnboarding({ name: trimmedName, email: normalizedEmail, password: sanitizedPassword });
    router.replace('/');
  };

  const currentStepData = STEPS[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Icon size={80} color={colors.primary} strokeWidth={1.5} />
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>
            </Animated.View>

            {isLastStep && (
              <Animated.View style={[styles.inputContainer, { opacity: fadeAnim }]}>
                <Text style={styles.inputLabel}>Create your CareApp account</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name (optional)"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  blurOnSubmit={false}
                  testID="onboarding-name-input"
                />
                <TextInput
                  ref={emailInputRef}
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  blurOnSubmit={false}
                  testID="onboarding-email-input"
                />
                <Text style={[styles.inputLabel, styles.passwordLabel]}>Password</Text>
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
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  testID="onboarding-password-input"
                />
                <Text style={[styles.inputLabel, styles.passwordLabel]}>Confirm Password</Text>
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleComplete}
                  testID="onboarding-confirm-password-input"
                />
              </Animated.View>
            )}

            <View style={[styles.progressContainer, isLastStep && styles.progressContainerLast]}>
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index === currentStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.footer}>
            {isLastStep ? (
              <TouchableOpacity
                style={styles.button}
                onPress={handleComplete}
                activeOpacity={0.8}
                testID="onboarding-complete-button"
              >
                <Text style={styles.buttonText}>Register</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={handleNext}
                activeOpacity={0.8}
                testID="onboarding-next-button"
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: Spacing.xxl,
    },
    content: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.lg,
    },
    iconContainer: {
      width: 160,
      height: 160,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xxl,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 24px rgba(74, 144, 226, 0.15)',
        },
      }),
    },
    title: {
      fontSize: FontSizes.xxxl,
      fontWeight: '700' as const,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    description: {
      fontSize: FontSizes.lg,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 26,
      paddingHorizontal: Spacing.md,
    },
    inputContainer: {
      width: '100%',
      marginTop: Spacing.xxl,
      gap: Spacing.md,
    },
    inputLabel: {
      fontSize: FontSizes.md,
      color: colors.text,
      fontWeight: '600' as const,
      marginBottom: Spacing.sm,
    },
    passwordLabel: {
      marginTop: Spacing.md,
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
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: Spacing.xxl,
      gap: Spacing.sm,
    },
    progressContainerLast: {
      marginTop: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    progressDot: {
      width: 8,
      height: 8,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.border,
    },
    progressDotActive: {
      width: 24,
      backgroundColor: colors.primary,
    },
    footer: {
      width: '100%',
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Platform.select({
        ios: Spacing.xl,
        android: Spacing.lg,
        default: Spacing.lg,
      }),
      gap: Spacing.md,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
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
  });
