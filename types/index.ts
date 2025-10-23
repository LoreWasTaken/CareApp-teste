export interface Medication {
  id: string;
  name: string;
  times: string[];
  durationDays: number;
  startDate: string;
  createdAt: string;
}

export interface DoseHistory {
  id: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string;
  takenTime: string | null;
  taken: boolean;
  skipped: boolean;
  postponed: boolean;
  date: string;
}

export interface UserSettings {
  name: string;
  email: string;
  password: string;
  language: 'en' | 'pt';
  highContrast: boolean;
  largeText: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface DeviceStatus {
  careBoxConnected: boolean;
  careBoxConnectionType: 'bluetooth' | 'wifi' | 'none';
  careBoxBattery: number;
  careBandConnected: boolean;
  careBandBattery: number;
  lastSync: string | null;
}

export interface AppData {
  user: UserSettings;
  medications: Medication[];
  history: DoseHistory[];
  deviceStatus: DeviceStatus;
  onboardingCompleted: boolean;
}

export type ScheduledDose = {
  medication: Medication;
  time: string;
  isPast: boolean;
  isToday: boolean;
  historyEntry?: DoseHistory;
};
