import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pill, Bluetooth, Bell } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

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
  const { completeOnboarding } = useApp();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
    console.log('[Onboarding] Completing with name:', userName);
    const name = userName.trim() || 'User';
    completeOnboarding(name);
    router.replace('/');
  };

  const currentStepData = STEPS[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <Icon size={80} color={Colors.primary} strokeWidth={1.5} />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </Animated.View>

        {isLastStep && (
          <Animated.View style={[styles.inputContainer, { opacity: fadeAnim }]}>
            <Text style={styles.inputLabel}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name (optional)"
              placeholderTextColor={Colors.textLight}
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
              returnKeyType="done"
              testID="onboarding-name-input"
            />
          </Animated.View>
        )}

        <View style={styles.progressContainer}>
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
            <Text style={styles.buttonText}>Get Started</Text>
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

        {!isLastStep && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleComplete}
            activeOpacity={0.6}
            testID="onboarding-skip-button"
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.md,
  },
  inputContainer: {
    width: '100%',
    marginTop: Spacing.xxl,
  },
  inputLabel: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: FontSizes.lg,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
    color: Colors.surface,
    fontSize: FontSizes.xl,
    fontWeight: '600' as const,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontWeight: '500' as const,
  },
});
