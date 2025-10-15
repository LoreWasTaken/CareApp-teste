import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, Clock, Plus, Settings, Wifi, Bluetooth } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, FontSizes } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { appData, getTodaySchedule, getNextDose, markDoseTaken, updateDeviceStatus } = useApp();
  const [settingsLongPress, setSettingsLongPress] = useState<boolean>(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const todaySchedule = getTodaySchedule();
  const nextDose = getNextDose();
  const { user, deviceStatus } = appData;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
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

  const handleSettingsPressIn = () => {
    console.log('[Dashboard] Settings press started');
    longPressTimer.current = setTimeout(() => {
      console.log('[Dashboard] Settings long press detected');
      setSettingsLongPress(true);
      router.push('/settings');
    }, 3000);
  };

  const handleSettingsPressOut = () => {
    console.log('[Dashboard] Settings press ended');
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setSettingsLongPress(false);
  };

  const handleTakeDose = () => {
    if (!nextDose) return;
    console.log('[Dashboard] Taking dose', { medicationId: nextDose.medication.id, time: nextDose.time });
    markDoseTaken(nextDose.medication.id, nextDose.time);
  };

  const greeting = user.name ? `Hello, ${user.name}` : 'Welcome to CareApp';
  const fontSize = user.largeText ? FontSizes.xxxl : FontSizes.xxl;
  const bodyFontSize = user.largeText ? FontSizes.xl : FontSizes.lg;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <View>
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
          onPressIn={handleSettingsPressIn}
          onPressOut={handleSettingsPressOut}
          style={[styles.settingsButton, settingsLongPress && styles.settingsButtonActive]}
          activeOpacity={0.8}
          testID="settings-button"
        >
          <Settings size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {nextDose ? (
          <Animated.View style={[styles.nextDoseCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.nextDoseHeader}>
              <Clock size={28} color={Colors.surface} />
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
              <Check size={24} color={Colors.surface} strokeWidth={3} />
              <Text style={[styles.takeDoseButtonText, { fontSize: bodyFontSize }]}>
                Mark as Taken
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
            <Text style={[styles.sectionTitle, { fontSize: bodyFontSize + 2 }]}>Today&apos;s Schedule</Text>
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
                      <Check size={20} color={Colors.success} strokeWidth={2.5} />
                    ) : isSkipped ? (
                      <Text style={styles.scheduleStatusText}>⏭</Text>
                    ) : (
                      <Clock size={20} color={Colors.textLight} />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: bodyFontSize + 2 }]}>Device Status</Text>
          
          <View style={styles.deviceCard}>
            <View style={styles.deviceRow}>
              <View style={styles.deviceInfo}>
                <View style={styles.deviceIconContainer}>
                  <Wifi size={20} color={deviceStatus.careBoxConnected ? Colors.primary : Colors.disabled} />
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
                  <Bluetooth size={20} color={deviceStatus.careBandConnected ? Colors.primary : Colors.disabled} />
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
          <Plus size={28} color={Colors.surface} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  greeting: {
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  settingsButtonActive: {
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  nextDoseCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
    color: Colors.surface,
    fontWeight: '600' as const,
    opacity: 0.9,
  },
  nextDoseTime: {
    color: Colors.surface,
    fontWeight: '700' as const,
    marginBottom: Spacing.xs,
  },
  nextDoseMedication: {
    color: Colors.surface,
    fontWeight: '500' as const,
    opacity: 0.95,
    marginBottom: Spacing.lg,
  },
  takeDoseButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  takeDoseButtonText: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  noMedicationsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  noMedicationsText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  scheduleItem: {
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    fontWeight: '600' as const,
  },
  scheduleMedication: {
    flex: 1,
  },
  scheduleMedicationName: {
    color: Colors.text,
  },
  scheduleStatus: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundDark,
  },
  scheduleStatusTaken: {
    backgroundColor: Colors.success + '20',
  },
  scheduleStatusSkipped: {
    backgroundColor: Colors.warning + '20',
  },
  scheduleStatusText: {
    fontSize: 18,
  },
  deviceCard: {
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.backgroundDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs - 2,
  },
  deviceDetail: {
    color: Colors.textSecondary,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.disabled,
  },
  statusDotConnected: {
    backgroundColor: Colors.success,
  },
  deviceDivider: {
    height: 1,
    backgroundColor: Colors.border,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
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
