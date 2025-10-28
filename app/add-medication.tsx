import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { useMemo, useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';

export default function AddMedicationScreen() {
  const router = useRouter();
  const { appData, addMedication, theme } = useApp();
  const { user } = appData;
  const styles = useMemo(() => createStyles(theme, user.largeText), [theme, user.largeText]);
  const colors = theme;
  
  const [medicationName, setMedicationName] = useState<string>('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [durationDays, setDurationDays] = useState<string>('7');
  
  const fontSize = user.largeText ? FontSizes.xl : FontSizes.lg;

  const handleAddTime = () => {
    console.log('[AddMedication] Adding new time slot');
    setTimes([...times, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    console.log('[AddMedication] Removing time slot', { index });
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const formatTimeValue = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  };

  const handleUpdateTime = (index: number, value: string) => {
    const formatted = formatTimeValue(value);
    setTimes(prev => {
      const next = [...prev];
      next[index] = formatted;
      return next;
    });
  };

  const handleTimeFocus = (index: number) => {
    setTimes(prev => {
      const next = [...prev];
      next[index] = formatTimeValue(next[index]);
      return next;
    });
  };

  const handleSave = () => {
    console.log('[AddMedication] Saving medication', { medicationName, times, durationDays });
    
    if (!medicationName.trim()) {
      Alert.alert('Error', 'Please enter a medication name');
      return;
    }

    const duration = parseInt(durationDays, 10);
    if (isNaN(duration) || duration < 1) {
      Alert.alert('Error', 'Please enter a valid duration (at least 1 day)');
      return;
    }

    const formattedTimes: string[] = [];
    for (const original of times) {
      const sanitized = original.trim();
      const match = sanitized.match(/^(\d{1,2}):(\d{2})$/);
      if (!match) {
        Alert.alert(
          'Invalid time',
          `Use 24-hour format HH:MM between 00:00 and 23:59. Check "${sanitized || 'empty value'}".`
        );
        return;
      }

      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);

      if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
        Alert.alert(
          'Invalid time',
          `Use 24-hour format HH:MM between 00:00 and 23:59. Check "${sanitized}".`
        );
        return;
      }

      const normalized = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
      formattedTimes.push(normalized);
    }

    const uniqueTimes = Array.from(new Set(formattedTimes));
    if (uniqueTimes.length !== formattedTimes.length) {
      Alert.alert('Duplicate time', 'Each time entry should be unique.');
      return;
    }

    const sortedTimes = [...uniqueTimes].sort();
    
    addMedication({
      name: medicationName.trim(),
      times: sortedTimes,
      durationDays: duration,
      startDate: new Date().toISOString().split('T')[0],
    });

    Alert.alert('Success', 'Medication added successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
          <Text style={[styles.headerTitle, { fontSize: fontSize + 4 }]}>Add Medication</Text>
          <View style={{ width: 48 }} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
        >
          <View style={styles.contentWrapper}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <Text style={[styles.label, { fontSize }]}>Medication Name *</Text>
                <TextInput
                  style={[styles.input, { fontSize }]}
                  placeholder="e.g., Paracetamol 500mg"
                  placeholderTextColor={colors.textLight}
                  value={medicationName}
                  onChangeText={setMedicationName}
                  testID="medication-name-input"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.section}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { fontSize }]}>Times *</Text>
                  <TouchableOpacity
                    style={styles.addTimeButton}
                    onPress={handleAddTime}
                    activeOpacity={0.8}
                    testID="add-time-button"
                  >
                    <Plus size={18} color={colors.primary} strokeWidth={2.5} />
                    <Text style={[styles.addTimeText, { fontSize: fontSize - 2 }]}>Add Time</Text>
                  </TouchableOpacity>
                </View>

                {times.map((time, index) => (
                  <View key={index} style={styles.timeRow}>
                    <TextInput
                      style={[styles.timeInput, { fontSize }]}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textLight}
                      value={time}
                      onFocus={() => handleTimeFocus(index)}
                      onChangeText={(value) => handleUpdateTime(index, value)}
                      keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                      returnKeyType="next"
                      maxLength={5}
                      selectTextOnFocus
                      testID={`time-input-${index}`}
                    />
                    {times.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeTimeButton}
                        onPress={() => handleRemoveTime(index)}
                        activeOpacity={0.8}
                        testID={`remove-time-button-${index}`}
                      >
                        <X size={20} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <Text style={[styles.helperText, { fontSize: fontSize - 4 }]}>
                  Enter times in 24-hour format (e.g., 08:00, 14:30)
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { fontSize }]}>Duration (days) *</Text>
                <TextInput
                  style={[styles.input, { fontSize }]}
                  placeholder="e.g., 7"
                  placeholderTextColor={colors.textLight}
                  value={durationDays}
                  onChangeText={setDurationDays}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  selectTextOnFocus
                  testID="duration-input"
                />
                <Text style={[styles.helperText, { fontSize: fontSize - 4 }]}>
                  How many days should you take this medication?
                </Text>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.8}
                testID="save-button"
              >
                <Text style={[styles.saveButtonText, { fontSize }]}>Save Medication</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const createStyles = (colors: ThemeColors, isLargeText: boolean) =>
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
    flex: {
      flex: 1,
    },
    contentWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.xl,
      paddingBottom: isLargeText ? Spacing.xxl + Spacing.lg : Spacing.xxl,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    label: {
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    helperText: {
      color: colors.textSecondary,
      marginTop: Spacing.sm,
    },
    addTimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.primary + '15',
      borderRadius: BorderRadius.sm,
    },
    addTimeText: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    timeInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      color: colors.text,
      borderWidth: 2,
      borderColor: colors.border,
    },
    removeTimeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error + '10',
      borderRadius: BorderRadius.sm,
    },
    footer: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'center',
    },
    saveButton: {
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
    saveButtonText: {
      color: colors.surface,
      fontWeight: '600' as const,
    },
  });
