import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Plus, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function AddMedicationScreen() {
  const router = useRouter();
  const { appData, addMedication } = useApp();
  const { user } = appData;
  
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

  const handleUpdateTime = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
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
            <ChevronLeft size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontSize: fontSize + 4 }]}>Add Medication</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={[styles.label, { fontSize }]}>Medication Name *</Text>
            <TextInput
              style={[styles.input, { fontSize }]}
              placeholder="e.g., Paracetamol 500mg"
              placeholderTextColor={Colors.textLight}
              value={medicationName}
              onChangeText={setMedicationName}
              testID="medication-name-input"
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
                <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
                <Text style={[styles.addTimeText, { fontSize: fontSize - 2 }]}>Add Time</Text>
              </TouchableOpacity>
            </View>

            {times.map((time, index) => (
              <View key={index} style={styles.timeRow}>
                <TextInput
                  style={[styles.timeInput, { fontSize }]}
                  placeholder="HH:MM"
                  placeholderTextColor={Colors.textLight}
                  value={time}
                  onChangeText={(value) => handleUpdateTime(index, value)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  testID={`time-input-${index}`}
                />
                {times.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeTimeButton}
                    onPress={() => handleRemoveTime(index)}
                    activeOpacity={0.8}
                    testID={`remove-time-button-${index}`}
                  >
                    <X size={20} color={Colors.error} />
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
              placeholderTextColor={Colors.textLight}
              value={durationDays}
              onChangeText={setDurationDays}
              keyboardType="number-pad"
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
    paddingBottom: 120,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  helperText: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
  },
  addTimeText: {
    color: Colors.primary,
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
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  removeTimeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
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
  saveButtonText: {
    color: Colors.surface,
    fontWeight: '600' as const,
  },
});
