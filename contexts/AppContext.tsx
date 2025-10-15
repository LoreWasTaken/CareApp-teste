import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AppData, Medication, DoseHistory, UserSettings, ScheduledDose } from '@/types';

const STORAGE_KEY = 'careapp_data';

const defaultUserSettings: UserSettings = {
  name: '',
  language: 'en',
  highContrast: false,
  largeText: false,
  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  emergencyContacts: [],
};

const defaultAppData: AppData = {
  user: defaultUserSettings,
  medications: [],
  history: [],
  deviceStatus: {
    careBoxConnected: false,
    careBoxConnectionType: 'none',
    careBoxBattery: 0,
    careBandConnected: false,
    careBandBattery: 0,
    lastSync: null,
  },
  onboardingCompleted: false,
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [appData, setAppData] = useState<AppData>(defaultAppData);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('[AppContext] Loading data from AsyncStorage');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppData;
        console.log('[AppContext] Data loaded successfully', { 
          medicationsCount: parsed.medications.length,
          historyCount: parsed.history.length,
          onboardingCompleted: parsed.onboardingCompleted 
        });
        setAppData(parsed);
      } else {
        console.log('[AppContext] No stored data found, using defaults');
      }
    } catch (error) {
      console.error('[AppContext] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (data: AppData) => {
    try {
      console.log('[AppContext] Saving data to AsyncStorage');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setAppData(data);
      console.log('[AppContext] Data saved successfully');
    } catch (error) {
      console.error('[AppContext] Error saving data:', error);
    }
  };

  const completeOnboarding = useCallback((userName: string) => {
    console.log('[AppContext] Completing onboarding', { userName });
    const updated: AppData = {
      ...appData,
      user: { ...appData.user, name: userName },
      onboardingCompleted: true,
    };
    saveData(updated);
  }, [appData]);

  const addMedication = useCallback((medication: Omit<Medication, 'id' | 'createdAt'>) => {
    console.log('[AppContext] Adding medication', { name: medication.name });
    const newMed: Medication = {
      ...medication,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated: AppData = {
      ...appData,
      medications: [...appData.medications, newMed],
    };
    saveData(updated);
    return newMed;
  }, [appData]);

  const updateMedication = useCallback((id: string, updates: Partial<Medication>) => {
    console.log('[AppContext] Updating medication', { id });
    const updated: AppData = {
      ...appData,
      medications: appData.medications.map(med => 
        med.id === id ? { ...med, ...updates } : med
      ),
    };
    saveData(updated);
  }, [appData]);

  const deleteMedication = useCallback((id: string) => {
    console.log('[AppContext] Deleting medication', { id });
    const updated: AppData = {
      ...appData,
      medications: appData.medications.filter(med => med.id !== id),
      history: appData.history.filter(h => h.medicationId !== id),
    };
    saveData(updated);
  }, [appData]);

  const markDoseTaken = useCallback((medicationId: string, scheduledTime: string) => {
    console.log('[AppContext] Marking dose as taken', { medicationId, scheduledTime });
    const medication = appData.medications.find(m => m.id === medicationId);
    if (!medication) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const existingEntry = appData.history.find(
      h => h.medicationId === medicationId && 
           h.scheduledTime === scheduledTime && 
           h.date === today
    );

    let updatedHistory: DoseHistory[];
    
    if (existingEntry) {
      updatedHistory = appData.history.map(h =>
        h.id === existingEntry.id
          ? { ...h, taken: true, takenTime: now, skipped: false, postponed: false }
          : h
      );
    } else {
      const newEntry: DoseHistory = {
        id: Date.now().toString(),
        medicationId,
        medicationName: medication.name,
        scheduledTime,
        takenTime: now,
        taken: true,
        skipped: false,
        postponed: false,
        date: today,
      };
      updatedHistory = [...appData.history, newEntry];
    }

    const updated: AppData = {
      ...appData,
      history: updatedHistory,
    };
    saveData(updated);
  }, [appData]);

  const markDoseSkipped = useCallback((medicationId: string, scheduledTime: string) => {
    console.log('[AppContext] Marking dose as skipped', { medicationId, scheduledTime });
    const medication = appData.medications.find(m => m.id === medicationId);
    if (!medication) return;

    const today = new Date().toISOString().split('T')[0];

    const newEntry: DoseHistory = {
      id: Date.now().toString(),
      medicationId,
      medicationName: medication.name,
      scheduledTime,
      takenTime: null,
      taken: false,
      skipped: true,
      postponed: false,
      date: today,
    };

    const updated: AppData = {
      ...appData,
      history: [...appData.history, newEntry],
    };
    saveData(updated);
  }, [appData]);

  const updateSettings = useCallback((settings: Partial<UserSettings>) => {
    console.log('[AppContext] Updating user settings', settings);
    const updated: AppData = {
      ...appData,
      user: { ...appData.user, ...settings },
    };
    saveData(updated);
  }, [appData]);

  const updateDeviceStatus = useCallback((status: Partial<AppData['deviceStatus']>) => {
    console.log('[AppContext] Updating device status', status);
    const updated: AppData = {
      ...appData,
      deviceStatus: { ...appData.deviceStatus, ...status },
    };
    saveData(updated);
  }, [appData]);

  const getTodaySchedule = useCallback((): ScheduledDose[] => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const scheduled: ScheduledDose[] = [];

    appData.medications.forEach(medication => {
      const startDate = new Date(medication.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + medication.durationDays);

      const todayDate = new Date(today);
      if (todayDate >= startDate && todayDate < endDate) {
        medication.times.forEach(time => {
          const historyEntry = appData.history.find(
            h => h.medicationId === medication.id && 
                 h.scheduledTime === time && 
                 h.date === today
          );

          scheduled.push({
            medication,
            time,
            isPast: time < currentTimeStr,
            isToday: true,
            historyEntry,
          });
        });
      }
    });

    return scheduled.sort((a, b) => a.time.localeCompare(b.time));
  }, [appData]);

  const getNextDose = useCallback((): ScheduledDose | null => {
    const schedule = getTodaySchedule();
    const pending = schedule.filter(s => !s.historyEntry?.taken && !s.isPast);
    return pending.length > 0 ? pending[0] : null;
  }, [getTodaySchedule]);

  return useMemo(() => ({
    appData,
    isLoading,
    completeOnboarding,
    addMedication,
    updateMedication,
    deleteMedication,
    markDoseTaken,
    markDoseSkipped,
    updateSettings,
    updateDeviceStatus,
    getTodaySchedule,
    getNextDose,
  }), [
    appData,
    isLoading,
    completeOnboarding,
    addMedication,
    updateMedication,
    deleteMedication,
    markDoseTaken,
    markDoseSkipped,
    updateSettings,
    updateDeviceStatus,
    getTodaySchedule,
    getNextDose,
  ]);
});
