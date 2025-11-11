import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Clock, Plus, Settings, Wifi, Bluetooth, Activity, FileText, Calendar, Users } from 'lucide-react-native';
import { Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import type { ThemeColors } from '@/constants/colors';

export default function DashboardScreen() {
  const router = useRouter();
  const { appData, getTodaySchedule, getNextDose, markDoseTaken, updateDeviceStatus, theme } = useApp();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colors = theme;

  const todaySchedule = getTodaySchedule();
  const nextDose = getNextDose();
  const { user, deviceStatus } = appData;

  useEffect(() => {
    // Device status simulation
    const timer = setInterval(() => {
      const connected = Math.random() > 0.3;
      updateDeviceStatus({
        careBoxConnected: connected,
        careBoxConnectionType: connected ? (Math.random() > 0.5 ? 'wifi' : 'bluetooth') : 'none',
        careBoxBattery: Math.floor(Math.random() * 40) + 60,
        careBandConnected: Math.random() > 0.4,
        careBandBattery: Math.floor(Math.random() * 30) + 70,
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [updateDeviceStatus]);

  const handleSettingsPress = () => {
    console.log('[Dashboard] Settings pressed');
    router.push('/settings');
  };

  const handleTakeDose = () => {
    if (!nextDose) return;
    console.log('[Dashboard] Taking dose', { medicationId: nextDose.medication.id, time: nextDose.time });
    markDoseTaken(nextDose.medication.id, nextDose.time);
  };

  const handleLogSymptom = () => {
    console.log('[Dashboard] Log symptom pressed');
    router.push('/log-symptom');
  };

  const handleDoctorReport = () => {
    console.log('[Dashboard] Doctor report pressed');
    router.push('/doctor-report');
  };

  const handleCalendarView = () => {
    console.log('[Dashboard] Calendar view pressed');
    router.push('/calendar-view');
  };

  const handleCaregiverPortal = () => {
    console.log('[Dashboard] Caregiver portal pressed');
    router.push('/caregiver-portal');
  };

  const greeting = user.name ? `Hello, ${user.name}` : 'Welcome to CareApp';
  const fontSize = user.largeText ? FontSizes.xxxl : FontSizes.xxl;
  const bodyFontSize = user.largeText ? FontSizes.xl : FontSizes.lg;

  return (
    <View style={styles.container}>
      <StatusBar style={user.darkMode ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.greeting, { fontSize }]}>{greeting}</Text>
          <Text style={[styles.subtitle, { fontSize: bodyFontSize - 2 }]}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.settingsButton}
          activeOpacity={0.8}
          testID="settings-button"
        >
          <Settings
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {nextDose ? (
          <View style={styles.nextDoseCard}>
            <View style={styles.nextDoseHeader}>
              <Clock size={28} color={colors.surface} />
              <Text style={[styles.nextDoseLabel, { fontSize: bodyFontSize }]}>Next Dose</Text>
            </View>
            <Text style={[styles.nextDoseTime, { fontSize: fontSize + 8 }]}>{nextDose.time}</Text>
            <Text style={[styles.nextDoseMedication, { fontSize: fontSize }]}>
              {nextDose.medication.name}
            </Text>
            
            <TouchableOpacity
              style={styles.takeDoseButton}
              onPress={handleTakeDose}
              activeOpacity={0.8}
              testID="take-dose-button"
            >
              <Check size={24} color={colors.surface} strokeWidth={3} />
              <Text style={[styles.takeDoseButtonText, { fontSize: bodyFontSize }]}>
                Mark as Taken
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noMedicationsCard}>
            <Text style={[styles.noMedicationsText, { fontSize: bodyFontSize }]}>
              {appData.medications.length === 0 
                ? 'No medications scheduled. Add your first medication to get started.' 
                : "All doses completed for today! 🎉"}
            </Text>
          </View>
        )}

        {todaySchedule.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: bodyFontSize + 2 }]}>Today's Schedule</Text>
            {todaySchedule.map((dose, index) => {
              const isTaken = dose.historyEntry?.taken;
              const isSkipped = dose.historyEntry?.skipped;
              
              return (
                <View key={`${dose.medication.id}-${dose.time}-${index}`} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={[styles.scheduleTimeText, { fontSize: bodyFontSize }]}>
                      {dose.time}
                    </Text>
                  </View>
                  
                  <View style={styles.scheduleMedication}>
                    <Text style={[styles.scheduleMedicationName, { fontSize: bodyFontSize }]}>
                      {dose.medication.name}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.scheduleStatus,
                    isTaken && styles.scheduleStatusTaken,
                    isSkipped && styles.scheduleStatusSkipped,
                  ]}>
                    {isTaken ? (
                      <Check size={20} color={colors.success} strokeWidth={2.5} />
                    ) : isSkipped ? (
                      <Text style={styles.scheduleStatusText}>⏭</Text>
                    ) : (
                      <Clock size={20} color={colors.textLight} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Advanced Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: bodyFontSize + 2 }]}>Advanced Features</Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={styles.featureCard} onPress={handleLogSymptom}>
              <View style={styles.featureIconContainer}>
                <Activity size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { fontSize: bodyFontSize }]}>Log Symptoms</Text>
              <Text style={[styles.featureDescription, { fontSize: bodyFontSize - 4 }]}>
                Track side effects and health symptoms
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleDoctorReport}>
              <View style={styles.featureIconContainer}>
                <FileText size={24} color={colors.success} />
              </View>
              <Text style={[styles.featureTitle, { fontSize: bodyFontSize }]}>Doctor Report</Text>
              <Text style={[styles.featureDescription, { fontSize: bodyFontSize - 4 }]}>
                Generate comprehensive health reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleCalendarView}>
              <View style={styles.featureIconContainer}>
                <Calendar size={24} color={colors.warning} />
              </View>
              <Text style={[styles.featureTitle, { fontSize: bodyFontSize }]}>Adherence Calendar</Text>
              <Text style={[styles.featureDescription, { fontSize: bodyFontSize - 4 }]}>
                View monthly adherence patterns
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.featureCard} onPress={handleCaregiverPortal}>
              <View style={styles.featureIconContainer}>
                <Users size={24} color={colors.primary} />
              </View>
              <Text style={[styles.featureTitle, { fontSize: bodyFontSize }]}>Caregiver Portal</Text>
              <Text style={[styles.featureDescription, { fontSize: bodyFontSize - 4 }]}>
                Manage family support & smart alerts
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: bodyFontSize + 2 }]}>Device Status</Text>
          
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <Wifi size={20} color={deviceStatus.careBoxConnected ? colors.primary : colors.disabled} />
                </View>
                <View>
                  <Text style={[styles.deviceName, { fontSize: bodyFontSize }]}>CareBox</Text>
                  <Text style={[styles.deviceDetail, { fontSize: bodyFontSize - 4 }]}>
                    {deviceStatus.careBoxConnected 
                      ? `${deviceStatus.careBoxConnectionType} • ${deviceStatus.careBoxBattery}%`
                      : 'Not connected'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusDot,
                deviceStatus.careBoxConnected && styles.statusDotConnected,
              ]} />
            </View>

            <View style={styles.deviceDivider} />

            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <Bluetooth size={20} color={deviceStatus.careBandConnected ? colors.primary : colors.disabled} />
                </View>
                <View>
                  <Text style={[styles.deviceName, { fontSize: bodyFontSize }]}>CareBand</Text>
                  <Text style={[styles.deviceDetail, { fontSize: bodyFontSize - 4 }]}>
                    {deviceStatus.careBandConnected 
                      ? `${deviceStatus.careBandBattery}% battery`
                      : 'Not connected'}
                  </Text>
                </View>
              </View>
              <View style={[
                styles.statusDot,
                deviceStatus.careBandConnected && styles.statusDotConnected,
              ]} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.fab}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push('/add-medication')}
          activeOpacity={0.8}
          testID="add-medication-button"
        >
          <Plus size={28} color={colors.surface} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
      paddingBottom: Spacing.lg,
      backgroundColor: colors.surface,
    },
    headerTextContainer: {
      flex: 1,
      gap: Spacing.xs / 2,
    },
    greeting: {
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    settingsButton: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundDark,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.xl,
      paddingBottom: 100,
    },
    nextDoseCard: {
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 8px 16px rgba(74, 144, 226, 0.3)',
        },
      }),
    },
    nextDoseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    nextDoseLabel: {
      color: colors.surface,
      fontWeight: '600' as const,
      opacity: 0.9,
    },
    nextDoseTime: {
      color: colors.surface,
      fontWeight: '700' as const,
      marginBottom: Spacing.xs,
    },
    nextDoseMedication: {
      color: colors.surface,
      fontWeight: '500' as const,
      opacity: 0.95,
      marginBottom: Spacing.lg,
    },
    takeDoseButton: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    takeDoseButtonText: {
      color: colors.primary,
      fontWeight: '600' as const,
    },
    noMedicationsCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xxl,
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    noMedicationsText: {
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: Spacing.md,
    },
    scheduleItem: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    scheduleTime: {
      width: 80,
    },
    scheduleTimeText: {
      color: colors.text,
      fontWeight: '600' as const,
    },
    scheduleMedication: {
      flex: 1,
    },
    scheduleMedicationName: {
      color: colors.text,
    },
    scheduleStatus: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundDark,
    },
    scheduleStatusTaken: {
      backgroundColor: colors.success + '20',
    },
    scheduleStatusSkipped: {
      backgroundColor: colors.warning + '20',
    },
    scheduleStatusText: {
      fontSize: 18,
    },
    // Advanced Features Styles
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      width: '48%',
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    featureIconContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundDark,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    featureTitle: {
      fontWeight: '600' as const,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Spacing.xs,
    },
    featureDescription: {
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    // Device Status Styles
    deviceCard: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flex: 1,
    },
    deviceIconContainer: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.backgroundDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deviceName: {
      color: colors.text,
      fontWeight: '600' as const,
      marginBottom: Spacing.xs - 2,
    },
    deviceDetail: {
      color: colors.textSecondary,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.disabled,
    },
    statusDotConnected: {
      backgroundColor: colors.success,
    },
    deviceDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.md,
    },
    fab: {
      position: 'absolute',
      right: Spacing.xl,
      bottom: Spacing.xl,
    },
    fabButton: {
      width: 64,
      height: 64,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 16px rgba(74, 144, 226, 0.4)',
        },
      }),
    },
  });
