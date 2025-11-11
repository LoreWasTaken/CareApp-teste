import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, useColorScheme, Alert } from 'react-native';
import type { AppData, Medication, DoseHistory, UserSettings, ScheduledDose } from '../types';
import { LightColors, DarkColors, HighContrastColors, FontSizes, FontSizesAccessible } from '../constants/colors';
import {
  loginUser,
  registerUser,
  getMedications,
  createMedication as apiCreateMedication,
  updateMedication as apiUpdateMedication,
  deleteMedication as apiDeleteMedication,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  checkHealth
} from '../app/services/api';

const STORAGE_KEY = 'careapp_data';

const defaultUserSettings: UserSettings = {
  name: '',
  email: '',
  language: 'en',
  highContrast: false,
  largeText: false,
  darkMode: false,
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
  }
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [appData, setAppData] = useState<AppData>(defaultAppData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(false);
  const systemColorScheme = useColorScheme();

  // Theme selection logic with system preference support
  const theme = useMemo(() => {
    try {
      // Determine if dark mode should be enabled
      // If user has explicitly set darkMode, use that value
      // Otherwise, follow system preference
      const shouldUseDarkMode = appData.user.darkMode || (!appData.user.darkMode && systemColorScheme === 'dark');
      
      // Get base colors
      const baseColors = shouldUseDarkMode ? DarkColors : LightColors;
      
      // Apply high contrast if enabled
      if (appData.user.highContrast) {
        return {
          ...baseColors,
          background: HighContrastColors.background,
          text: HighContrastColors.text,
          primary: HighContrastColors.primary,
          border: HighContrastColors.border,
        };
      }
      
      return baseColors;
    } catch (error) {
      console.error('[AppContext] Error selecting theme:', error);
      // Default to light mode on error
      return LightColors;
    }
  }, [appData.user.darkMode, appData.user.highContrast, systemColorScheme]);

  // Font size selection based on user preference
  const fontSize = useMemo(() => {
    try {
      if (appData.user.largeText) {
        return FontSizesAccessible.lg;
      }
      return FontSizes.lg;
    } catch (error) {
      console.error('[AppContext] Error selecting font size:', error);
      return FontSizes.lg;
    }
  }, [appData.user.largeText]);

  useEffect(() => {
    loadData();
    checkBackendAvailability();
  }, []);

  

  const checkBackendAvailability = async () => {
    try {
      await checkHealth();
      setBackendAvailable(true);
      console.log('[AppContext] Backend API is available');
    } catch (error) {
      setBackendAvailable(false);
      console.log('[AppContext] Backend API not available, using local storage');
    }
  };

  const loadData = async () => {
    try {
      console.log('[AppContext] Loading data...');
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppData>;
        const mergedUser: UserSettings = {
          ...defaultUserSettings,
          ...(parsed.user ?? {}),
        };
        const merged: AppData = {
          ...defaultAppData,
          ...parsed,
          user: mergedUser,
        };
        setAppData(merged);
        console.log('[AppContext] Data loaded from local storage');
        
        // Restore auth token from stored data
        if (merged.user?.authToken) {
          setAuthToken(merged.user.authToken);
          console.log('[AppContext] Auth token restored from local storage');
        }
      }
      
      // Try to load from backend first if available and authenticated
      if (backendAvailable && getAuthToken()) {
        try {
          const medicationsResponse = await getMedications();
          if (medicationsResponse.medications) {
            const updated: AppData = {
              ...appData,
              medications: medicationsResponse.medications,
            };
            setAppData(updated);
            console.log('[AppContext] Data loaded from backend API');
          }
        } catch (error) {
          console.log('[AppContext] Backend data load failed, using local storage');
        }
      }
    } catch (error) {
      console.error('[AppContext] Error loading data:', error);
      // Keep default data on error
    } finally {
      setIsLoading(false);
      // Set authentication based on stored token or user data
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const hasToken = parsed.user?.authToken;
          const hasUserData = parsed.user?.email; // User has started setup
          
          // User is "authenticated" if they have either a token OR have started setup
          setIsAuthenticated(!!(hasToken || hasUserData));
          
          if (hasToken) {
            console.log('[AppContext] User authenticated with stored token');
          } else if (hasUserData) {
            console.log('[AppContext] User has local data but no backend token');
          }
        } catch (error) {
          console.error('[AppContext] Error parsing authentication data:', error);
          setIsAuthenticated(false);
        }
      }
    }
  };

  const saveData = async (data: AppData) => {
    try {
      console.log('[AppContext] Saving data...');
      setAppData(data);
      
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      // Sync with backend if available and authenticated
      if (backendAvailable && getAuthToken()) {
        try {
          console.log('[AppContext] Syncing with backend API');
          // Backend sync can be implemented here for real-time data
        } catch (error) {
          console.log('[AppContext] Backend sync failed, data saved locally only');
        }
      }
    } catch (error) {
      console.error('[AppContext] Error saving data:', error);
    }
  };

  const register = useCallback(async ({ name, email, password }: { name?: string; email: string; password: string }) => {
    console.log('[AppContext] Registering user', { email, backendAvailable });
    
    // Try to register with backend first if available
    if (backendAvailable) {
      try {
        const response = await registerUser(name || '', email, password);
        if (response.user && response.token) {
          console.log('[AppContext] User registered with backend');
          const updated: AppData = {
            ...appData,
            user: { ...appData.user, name: name ?? '', email, authToken: response.token }
          };
          saveData(updated);
          setIsAuthenticated(true);
          return;
        }
      } catch (error) {
        console.log('[AppContext] Backend registration failed:', error);
        Alert.alert(
          'Registration Error',
          'Unable to register with the server. This might be due to network issues or server problems. Please check your connection and try again.'
        );
        throw error;
      }
    } else {
      // When backend is not available, inform user but allow local registration for demo
      Alert.alert(
        'Offline Mode',
        'Backend server is not available. Your data will be stored locally on this device only.',
        [
          {
            text: 'Continue Offline',
            onPress: () => {
              console.log('[AppContext] User chose to register offline');
              const updated: AppData = {
                ...appData,
                user: { ...appData.user, name: name ?? '', email }
              };
              saveData(updated);
              setIsAuthenticated(true);
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  }, [appData, backendAvailable]);

  const addMedication = useCallback(async (medication: Omit<Medication, 'id' | 'createdAt'>) => {
    console.log('[AppContext] Adding medication', { name: medication.name });
    const newMed: Medication = {
      ...medication,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    // Try to sync with backend first if available
    if (backendAvailable && getAuthToken()) {
      try {
        const backendMedication = await apiCreateMedication({
          name: medication.name,
          times: medication.times,
          durationDays: medication.durationDays,
          startDate: medication.startDate,
        });
        console.log('[AppContext] Medication synced to backend', backendMedication.medication?.id);
      } catch (error) {
        console.log('[AppContext] Backend sync failed, storing locally only');
      }
    }
    
    const updated: AppData = {
      ...appData,
      medications: [...appData.medications, newMed],
    };
    saveData(updated);
    return newMed;
  }, [appData, backendAvailable]);

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

  const deleteMedication = useCallback(async (id: string) => {
    console.log('[AppContext] Deleting medication', { id });
    
    // Try to sync with backend first if available
    if (backendAvailable && getAuthToken()) {
      try {
        await apiDeleteMedication(id);
        console.log('[AppContext] Medication deleted from backend');
      } catch (error) {
        console.log('[AppContext] Backend deletion failed, deleting locally only');
      }
    }
    
    const updated: AppData = {
      ...appData,
      medications: appData.medications.filter(med => med.id !== id),
      history: appData.history.filter(h => h.medicationId !== id),
    };
    saveData(updated);
  }, [appData, backendAvailable]);

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

  const login = useCallback(async (email: string, password: string) => {
    try {
      // First try backend API login
      const response = await loginUser(email, password);
      if (response.user && response.token) {
        console.log('[AppContext] Backend login successful');
        setIsAuthenticated(true);
        
        // Update user data with backend response
        const updated: AppData = {
          ...appData,
          user: { ...appData.user, email: response.user.email, name: response.user.name, authToken: response.token }
        };
        saveData(updated);
        return true;
      }
    } catch (error) {
      console.log('[AppContext] Backend login failed:', error);
      
      if (!backendAvailable) {
        // Backend is not available - check for local user data
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.user?.email === email) {
              console.log('[AppContext] Found local user data, enabling offline mode');
              Alert.alert(
                'Offline Mode',
                'Backend server is not available. You can continue using the app with locally stored data.',
                [
                  {
                    text: 'Continue Offline',
                    onPress: () => {
                      // Update current user data from stored data
                      const updated: AppData = {
                        ...appData,
                        user: { ...appData.user, email: parsed.user.email, name: parsed.user.name }
                      };
                      saveData(updated);
                      setIsAuthenticated(true);
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  }
                ]
              );
              return false; // Will be set to true if user chooses to continue
            }
          } catch (parseError) {
            console.error('[AppContext] Error parsing stored data:', parseError);
          }
        }
        
        Alert.alert(
          'Backend Unavailable',
          'Cannot connect to the server. Please ensure the backend is running or create a new account using the onboarding process.'
        );
        return false;
      }
      
      // Backend is available but login failed
      Alert.alert(
        'Login Failed',
        'Invalid email or password. Please check your credentials and try again.'
      );
      return false;
    }
  }, [appData.user.email, backendAvailable, appData]);

  const logout = useCallback(() => {
    console.log('[AppContext] Logging out');
    clearAuthToken();
    setIsAuthenticated(false);
  }, []);

  const clearData = useCallback(async () => {
    console.log('[AppContext] Clearing stored data');
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[AppContext] Error clearing data:', error);
    } finally {
      setAppData(defaultAppData);
      setIsAuthenticated(false);
    }
  }, []);

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
    isAuthenticated,
    theme,
    fontSize,
    register,
    addMedication,
    updateMedication,
    deleteMedication,
    markDoseTaken,
    markDoseSkipped,
    updateSettings,
    login,
    logout,
    clearData,
    updateDeviceStatus,
    getTodaySchedule,
    getNextDose,
  }), [
    appData,
    isLoading,
    isAuthenticated,
    theme,
    fontSize,
    register,
    addMedication,
    updateMedication,
    deleteMedication,
    markDoseTaken,
    markDoseSkipped,
    updateSettings,
    login,
    logout,
    clearData,
    updateDeviceStatus,
    getTodaySchedule,
    getNextDose,
  ]);
});
