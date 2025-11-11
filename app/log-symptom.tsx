// app/log-symptom.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { logSymptom } from './services/api';
import { Spacing, BorderRadius, FontSizes } from '../constants/colors';
import type { ThemeColors } from '../constants/colors';

const SYMPTOM_TYPES = [
  'Headache',
  'Dizziness',
  'Nausea',
  'Fatigue',
  'Upset Stomach',
  'Muscle Pain',
  'Joint Pain',
  'Rash',
  'Difficulty Sleeping',
  'Loss of Appetite',
  'Dry Mouth',
  'Blurred Vision',
  'Other'
];

const SEVERITY_LABELS = {
  1: 'Very Mild',
  2: 'Mild',
  3: 'Moderate',
  4: 'Severe',
  5: 'Very Severe'
};

const MOOD_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Very Good'
};

interface Props {
  onClose?: () => void;
}

export default function LogSymptomScreen({ onClose }: Props) {
  const { appData, theme } = useApp();
  const [symptomType, setSymptomType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(1);
  const [moodRating, setMoodRating] = useState(3);
  const [medications, setMedications] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherSymptom, setShowOtherSymptom] = useState(false);
  const [otherSymptom, setOtherSymptom] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // If theme is still not available, provide a fallback
  const safeTheme = theme || {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    disabled: '#D1D1D6',
    border: '#E5E5EA',
    backgroundDark: '#F2F2F7'
  };

  const handleSubmit = async () => {
    if (!symptomType && !showOtherSymptom) {
      Alert.alert('Error', 'Please select or enter a symptom type');
      return;
    }

    if (showOtherSymptom && !otherSymptom.trim()) {
      Alert.alert('Error', 'Please enter the symptom name');
      return;
    }

    setIsSubmitting(true);

    try {
      const symptomData = {
        symptom_type: showOtherSymptom ? otherSymptom.trim() : symptomType,
        description: description.trim() || undefined,
        severity,
        mood_rating: moodRating,
        medications
      };

      await logSymptom(symptomData);
      
      Alert.alert('Success', 'Symptom logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setIsSuccess(true);
            // Reset form
            setSymptomType('');
            setDescription('');
            setSeverity(1);
            setMoodRating(3);
            setMedications([]);
            setShowOtherSymptom(false);
            setOtherSymptom('');
            if (onClose) onClose();
          }
        }
      ]);
    } catch (error) {
      console.error('Error logging symptom:', error);
      Alert.alert('Error', 'Failed to log symptom. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleMedication = (medicationId: string) => {
    setMedications(prev =>
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
  };
  
  const fontSize = appData.user.largeText ? FontSizes.xxxl : FontSizes.xl;
  const bodyFontSize = appData.user.largeText ? FontSizes.xl : FontSizes.lg;
  const styles = createStyles(safeTheme, fontSize, bodyFontSize);

  if (isSuccess) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>✅ Symptom Logged Successfully!</Text>
          <Text style={styles.successText}>
            Your symptom has been recorded and will help identify patterns with your medications.
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log Symptom or Side Effect</Text>
        <Text style={styles.subtitle}>
          Help identify patterns by tracking symptoms and their potential correlation with medications
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Symptom Type *</Text>
          
          {!showOtherSymptom ? (
            <View style={styles.symptomSelector}>
              {SYMPTOM_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.symptomButton,
                    symptomType === type && styles.symptomButtonSelected
                  ]}
                  onPress={() => {
                    if (type === 'Other') {
                      setShowOtherSymptom(true);
                    } else {
                      setSymptomType(type);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.symptomButtonText,
                      symptomType === type && styles.symptomButtonTextSelected
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.otherSymptomContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter symptom name"
                value={otherSymptom}
                onChangeText={setOtherSymptom}
                placeholderTextColor={safeTheme.textSecondary}
              />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowOtherSymptom(false);
                  setOtherSymptom('');
                  setSymptomType('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Severity *</Text>
          <View style={styles.severityContainer}>
            {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.severityButton,
                  severity === parseInt(value) && styles.severityButtonSelected
                ]}
                onPress={() => setSeverity(parseInt(value))}
              >
                <Text
                  style={[
                    styles.severityButtonText,
                    severity === parseInt(value) && styles.severityButtonTextSelected
                  ]}
                >
                  {value}
                </Text>
                <Text
                  style={[
                    styles.severityLabel,
                    severity === parseInt(value) && styles.severityLabelSelected
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Mood Rating</Text>
          <View style={styles.moodContainer}>
            {Object.entries(MOOD_LABELS).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.moodButton,
                  moodRating === parseInt(value) && styles.moodButtonSelected
                ]}
                onPress={() => setMoodRating(parseInt(value))}
              >
                <Text
                  style={[
                    styles.moodButtonText,
                    moodRating === parseInt(value) && styles.moodButtonTextSelected
                  ]}
                >
                  {value}
                </Text>
                <Text
                  style={[
                    styles.moodLabel,
                    moodRating === parseInt(value) && styles.moodLabelSelected
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the symptom in more detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor={safeTheme.textSecondary}
          />
        </View>

        {appData.medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Current Medications</Text>
            <Text style={styles.medicationNote}>
              Select any medications you're currently taking when this symptom occurred
            </Text>
            <View style={styles.medicationList}>
              {appData.medications.map((medication) => (
                <TouchableOpacity
                  key={medication.id}
                  style={[
                    styles.medicationItem,
                    medications.includes(medication.id) && styles.medicationItemSelected
                  ]}
                  onPress={() => toggleMedication(medication.id)}
                >
                  <Text
                    style={[
                      styles.medicationName,
                      medications.includes(medication.id) && styles.medicationNameSelected
                    ]}
                  >
                    {medication.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Logging...' : 'Log Symptom'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, fontSize: number, bodyFontSize: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      padding: Spacing.xl,
      paddingBottom: Spacing.lg,
    },
    label: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    symptomSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    symptomButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    symptomButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    symptomButtonText: {
      fontSize: bodyFontSize - 2,
      color: colors.text,
    },
    symptomButtonTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    otherSymptomContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: bodyFontSize,
      color: colors.text,
      flex: 1,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    cancelButton: {
      padding: Spacing.md,
    },
    cancelButtonText: {
      color: colors.primary,
      fontSize: bodyFontSize,
    },
    severityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    severityButton: {
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flex: 1,
    },
    severityButtonSelected: {
      borderColor: '#FF6B6B',
      backgroundColor: '#FF6B6B',
    },
    severityButtonText: {
      fontSize: bodyFontSize,
      fontWeight: 'bold',
      color: colors.text,
    },
    severityButtonTextSelected: {
      color: 'white',
    },
    severityLabel: {
      fontSize: bodyFontSize - 4,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    severityLabelSelected: {
      color: 'white',
    },
    moodContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: Spacing.xs,
    },
    moodButton: {
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flex: 1,
    },
    moodButtonSelected: {
      borderColor: '#4ECDC4',
      backgroundColor: '#4ECDC4',
    },
    moodButtonText: {
      fontSize: bodyFontSize,
      fontWeight: 'bold',
      color: colors.text,
    },
    moodButtonTextSelected: {
      color: 'white',
    },
    moodLabel: {
      fontSize: bodyFontSize - 4,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    moodLabelSelected: {
      color: 'white',
    },
    medicationNote: {
      fontSize: bodyFontSize - 2,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      fontStyle: 'italic',
    },
    medicationList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    medicationItem: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    medicationItemSelected: {
      borderColor: colors.success,
      backgroundColor: colors.success + '20',
    },
    medicationName: {
      fontSize: bodyFontSize - 2,
      color: colors.text,
    },
    medicationNameSelected: {
      color: colors.success,
      fontWeight: '600' as const,
    },
    buttonContainer: {
      padding: Spacing.xl,
      paddingTop: Spacing.lg,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    submitButtonText: {
      color: colors.surface,
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
    },
    successContainer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    successTitle: {
      fontSize: fontSize,
      fontWeight: '700' as const,
      color: colors.success,
      textAlign: 'center',
      marginBottom: Spacing.md,
    },
    successText: {
      fontSize: bodyFontSize,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
    },
  });