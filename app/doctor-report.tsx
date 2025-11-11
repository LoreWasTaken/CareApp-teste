// app/doctor-report.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share
} from 'react-native';
import { Calendar, Download, FileText, TrendingUp, Activity, Pill, Send } from 'lucide-react-native';
import { useApp } from '../contexts/AppContext';
import { getDoctorReport, getAdherenceStats, getSymptoms } from './services/api';
import { Spacing, BorderRadius, FontSizes } from '../constants/colors';
import type { ThemeColors } from '../constants/colors';

interface DoctorReportData {
  report_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  adherence_summary: {
    total_doses: number;
    taken_doses: number;
    missed_doses: number;
    adherence_rate: number;
  };
  current_medications: Array<{
    name: string;
    dosage: string;
    times: string[];
    start_date: string;
  }>;
  symptom_summary: any;
  symptom_correlations: Array<{
    medication_id: string;
    medication_name: string;
    symptom_pattern: string;
    days_after_start: number;
    frequency: number;
  }>;
}

interface Props {
  onClose: () => void;
}

export default function DoctorReportScreen({ onClose }: Props) {
  const { appData, theme } = useApp();
  const [reportData, setReportData] = useState<DoctorReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'30days' | '60days' | '90days'>('90days');

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

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [reportResponse, adherenceResponse, symptomsResponse] = await Promise.all([
        getDoctorReport(selectedRange),
        getAdherenceStats(parseInt(selectedRange)),
        getSymptoms(parseInt(selectedRange))
      ]);

      if (reportResponse.report) {
        setReportData(reportResponse.report);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      Alert.alert('Error', 'Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedRange]);

  const handleShareReport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'No report data to share');
      return;
    }

    try {
      const reportText = generateReportText(reportData);
      await Share.share({
        message: reportText,
        title: 'CareApp Doctor Visit Report'
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report');
    }
  };

  const generateReportText = (data: DoctorReportData): string => {
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    let report = `CARAPP DOCTOR VISIT REPORT\n`;
    report += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    report += `REPORT PERIOD\n`;
    report += `From: ${formatDate(data.report_period.start_date)}\n`;
    report += `To: ${formatDate(data.report_period.end_date)}\n\n`;

    report += `ADHERENCE SUMMARY\n`;
    report += `Total Doses Scheduled: ${data.adherence_summary.total_doses}\n`;
    report += `Doses Taken: ${data.adherence_summary.taken_doses}\n`;
    report += `Doses Missed: ${data.adherence_summary.missed_doses}\n`;
    report += `Adherence Rate: ${data.adherence_summary.adherence_rate}%\n\n`;

    report += `CURRENT MEDICATIONS\n`;
    data.current_medications.forEach(med => {
      report += `• ${med.name} ${med.dosage} - Times: ${med.times.join(', ')}\n`;
    });
    report += '\n';

    if (data.symptom_correlations.length > 0) {
      report += `SYMPTOM CORRELATIONS\n`;
      data.symptom_correlations.forEach(correlation => {
        report += `• ${correlation.medication_name}: ${correlation.symptom_pattern} (${correlation.frequency} times, ${correlation.days_after_start} days after start)\n`;
      });
    }

    return report;
  };

  const fontSize = appData.user.largeText ? FontSizes.xxxl : FontSizes.xl;
  const bodyFontSize = appData.user.largeText ? FontSizes.xl : FontSizes.lg;
  const smallFontSize = appData.user.largeText ? FontSizes.lg : FontSizes.md;
  const styles = createStyles(safeTheme, fontSize, bodyFontSize, smallFontSize);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={48} color={safeTheme.primary} />
          <Text style={styles.loadingText}>Generating Report...</Text>
        </View>
      </View>
    );
  }

  if (!reportData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <FileText size={48} color={safeTheme.textSecondary} />
          <Text style={styles.errorText}>Failed to load report data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prepare for Doctor Visit</Text>
        <Text style={styles.subtitle}>
          Generate a comprehensive report with your medication adherence and health data
        </Text>
      </View>

      <View style={styles.rangeSelector}>
        <Text style={styles.rangeLabel}>Report Period:</Text>
        <View style={styles.rangeButtons}>
          {(['30days', '60days', '90days'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.rangeButtonSelected
              ]}
              onPress={() => setSelectedRange(range)}
            >
              <Text
                style={[
                  styles.rangeButtonText,
                  selectedRange === range && styles.rangeButtonTextSelected
                ]}
              >
                {range.replace('days', ' Days')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Report Period */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color={safeTheme.primary} />
            <Text style={styles.sectionTitle}>Report Period</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>From:</Text>
            <Text style={styles.infoValue}>{formatDate(reportData.report_period.start_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>To:</Text>
            <Text style={styles.infoValue}>{formatDate(reportData.report_period.end_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{reportData.report_period.days} days</Text>
          </View>
        </View>

        {/* Adherence Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color={safeTheme.primary} />
            <Text style={styles.sectionTitle}>Medication Adherence</Text>
          </View>
          <View style={styles.adherenceCard}>
            <View style={styles.adherenceOverview}>
              <View style={styles.adherenceItem}>
                <Text style={styles.adherenceNumber}>{reportData.adherence_summary.total_doses}</Text>
                <Text style={styles.adherenceLabel}>Total Doses</Text>
              </View>
              <View style={styles.adherenceItem}>
                <Text style={[
                  styles.adherenceNumber,
                  { color: safeTheme.success }
                ]}>
                  {reportData.adherence_summary.taken_doses}
                </Text>
                <Text style={styles.adherenceLabel}>Taken</Text>
              </View>
              <View style={styles.adherenceItem}>
                <Text style={[
                  styles.adherenceNumber,
                  { color: safeTheme.error }
                ]}>
                  {reportData.adherence_summary.missed_doses}
                </Text>
                <Text style={styles.adherenceLabel}>Missed</Text>
              </View>
            </View>
            <View style={styles.adherenceRateContainer}>
              <Text style={styles.adherenceRateText}>
                {reportData.adherence_summary.adherence_rate}% Adherence Rate
              </Text>
              <View style={styles.adherenceBar}>
                <View 
                  style={[
                    styles.adherenceBarFill,
                    { 
                      width: `${Math.min(reportData.adherence_summary.adherence_rate, 100)}%`,
                      backgroundColor: reportData.adherence_summary.adherence_rate >= 80 ? safeTheme.success : safeTheme.warning
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Current Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pill size={24} color={safeTheme.primary} />
            <Text style={styles.sectionTitle}>Current Medications</Text>
          </View>
          {reportData.current_medications.map((medication, index) => (
            <View key={index} style={styles.medicationCard}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              {medication.dosage && (
                <Text style={styles.medicationDosage}>{medication.dosage}</Text>
              )}
              <Text style={styles.medicationTimes}>
                Times: {medication.times.join(', ')}
              </Text>
              <Text style={styles.medicationStart}>
                Started: {formatDate(medication.start_date)}
              </Text>
            </View>
          ))}
        </View>

        {/* Symptom Correlations */}
        {reportData.symptom_correlations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={24} color={safeTheme.primary} />
              <Text style={styles.sectionTitle}>Symptom Correlations</Text>
            </View>
            <Text style={styles.correlationNote}>
              Potential correlations between medications and symptoms
            </Text>
            {reportData.symptom_correlations.map((correlation, index) => (
              <View key={index} style={styles.correlationCard}>
                <Text style={styles.correlationMedication}>{correlation.medication_name}</Text>
                <Text style={styles.correlationSymptom}>{correlation.symptom_pattern}</Text>
                <View style={styles.correlationDetails}>
                  <Text style={styles.correlationDetail}>
                    {correlation.frequency} occurrences
                  </Text>
                  <Text style={styles.correlationDetail}>
                    {correlation.days_after_start} days after starting medication
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareReport}>
            <Send size={20} color={safeTheme.surface} />
            <Text style={styles.shareButtonText}>Share Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors, fontSize: number, bodyFontSize: number, smallFontSize: number) =>
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
      fontSize: fontSize + 2,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    rangeSelector: {
      padding: Spacing.xl,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rangeLabel: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    rangeButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    rangeButton: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    rangeButtonSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    rangeButtonText: {
      fontSize: smallFontSize,
      color: colors.text,
      fontWeight: '500' as const,
    },
    rangeButtonTextSelected: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      padding: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      fontSize: bodyFontSize + 2,
      fontWeight: '700' as const,
      color: colors.text,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + '50',
    },
    infoLabel: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: bodyFontSize,
      color: colors.text,
      fontWeight: '500' as const,
    },
    adherenceCard: {
      backgroundColor: colors.backgroundDark,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    adherenceOverview: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.lg,
    },
    adherenceItem: {
      alignItems: 'center',
    },
    adherenceNumber: {
      fontSize: fontSize,
      fontWeight: '700' as const,
      color: colors.text,
    },
    adherenceLabel: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    adherenceRateContainer: {
      alignItems: 'center',
    },
    adherenceRateText: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    adherenceBar: {
      width: '100%',
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    adherenceBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    medicationCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    medicationName: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    medicationDosage: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    medicationTimes: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    medicationStart: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    correlationNote: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
      fontStyle: 'italic',
    },
    correlationCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    correlationMedication: {
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    correlationSymptom: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    correlationDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    correlationDetail: {
      fontSize: smallFontSize,
      color: colors.textSecondary,
    },
    buttonContainer: {
      padding: Spacing.xl,
    },
    shareButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    shareButtonText: {
      color: colors.surface,
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
    },
    loadingText: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.lg,
      padding: Spacing.xl,
    },
    errorText: {
      fontSize: bodyFontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
    },
    retryButtonText: {
      color: colors.surface,
      fontSize: bodyFontSize,
      fontWeight: '600' as const,
    },
  });