// app/services/api.ts

import { Medication } from '../../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.230:3001';

// Auth token storage
let authToken: string | null = null;

/**
 * Set the authentication token
 */
export function setAuthToken(token: string) {
  authToken = token;
}

/**
 * Get the current authentication token
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Clear the authentication token
 */
export function clearAuthToken() {
  authToken = null;
}

/**
 * A wrapper for fetch to handle API calls, authentication, and error handling.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // Properly handle headers with type conversion
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      console.error(`API Error: ${response.status} ${endpoint}`, errorData);
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }
    
    // Handle responses with no content
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('API Fetch failed:', error);
    throw error;
  }
}

/**
 * API Methods for Backend Integration
 */

// Authentication
export async function loginUser(email: string, password: string) {
  const response = await apiFetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

export async function registerUser(name: string, email: string, password: string) {
  const response = await apiFetch('/api/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

// User management for re-registration
export async function deleteUser(email: string) {
  return apiFetch(`/api/users/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}

// Dose Management
export async function getTodaySchedule() {
  return apiFetch('/api/doses/today');
}

export async function getUpcomingDoses(hours: number = 4) {
  return apiFetch(`/api/doses/upcoming?hours=${hours}`);
}

export async function markDoseAsTaken(doseId: string) {
  return apiFetch(`/api/doses/${doseId}/take`, {
    method: 'POST',
  });
}

// Statistics
export async function getAdherenceStats(days: number = 7) {
  return apiFetch(`/api/stats/adherence?days=${days}`);
}

export async function getWeeklyStats() {
  return apiFetch('/api/stats/weekly');
}

export async function getDoseHistory(days: number = 30, status?: string) {
  const params = new URLSearchParams({ days: days.toString() });
  if (status) {
    params.append('status', status);
  }
  return apiFetch(`/api/history/doses?${params.toString()}`) as Promise<import('../../types').DoseHistory[]>;
}

// Device Management
export async function getDeviceStatus() {
  return apiFetch('/api/devices/status');
}

export async function getInventory() {
  return apiFetch('/api/devices/inventory');
}

// Medication Management
export async function getMedications() {
  return apiFetch('/api/medications');
}

export async function createMedication(medication: {
  name: string;
  times: string[];
  durationDays?: number;
  startDate?: string;
}) {
  return apiFetch('/api/medications', {
    method: 'POST',
    body: JSON.stringify(medication),
  });
}

export async function updateMedication(id: string, updates: Partial<{
  name: string;
  times: string[];
  durationDays?: number;
  startDate?: string;
}>) {
  return apiFetch(`/api/medications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMedication(id: string) {
  return apiFetch(`/api/medications/${id}`, {
    method: 'DELETE',
  });
}

// Health Check
export async function checkHealth() {
  return apiFetch('/health');
}

// Symptom Logging
export async function logSymptom(symptomData: {
  symptom_type: string;
  description?: string;
  severity: number;
  mood_rating?: number;
  medications?: string[];
}) {
  return apiFetch('/api/health/log-symptom', {
    method: 'POST',
    body: JSON.stringify(symptomData),
  });
}

export async function getSymptoms(days: number = 30) {
  return apiFetch(`/api/health/symptoms?days=${days}`);
}

export async function getSymptomCorrelations() {
  return apiFetch('/api/health/symptom-correlations');
}

// Doctor's Report
export async function getDoctorReport(range: '30days' | '60days' | '90days' = '90days') {
  return apiFetch(`/api/reports/doctor-visit?range=${range}`);
}

// Calendar Adherence
export async function getCalendarAdherence(month: number, year: number) {
  return apiFetch(`/api/stats/calendar?month=${month}&year=${year}`);
}

// Caregiver Portal
export async function addCaregiver(caregiverData: {
  name: string;
  email: string;
  relationship?: string;
  permissions?: string[];
}) {
  return apiFetch('/api/caregivers/add', {
    method: 'POST',
    body: JSON.stringify(caregiverData),
  });
}

export async function getCaregiverDashboard() {
  return apiFetch('/api/caregivers/dashboard');
}

// Smart Alerts
export async function createAlertRule(alertData: {
  caregiver_id: string;
  rule_type: 'missed_dose' | 'low_inventory' | 'symptom_severity';
  condition: any;
  is_active?: boolean;
}) {
  return apiFetch('/api/caregivers/alert-rules', {
    method: 'POST',
    body: JSON.stringify(alertData),
  });
}

export async function getAlertRules() {
  return apiFetch('/api/caregivers/alert-rules');
}

// API Key Management
export async function generateApiKey(): Promise<{
  api_key: any;
  plain_api_key: string;
  message: string;
}> {
  return apiFetch('/api/keys/generate', {
    method: 'POST',
  });
}

export async function getApiKeys(): Promise<{ api_keys: any[] }> {
  return apiFetch('/api/keys');
}

export async function revokeApiKey(id: string): Promise<{ message: string }> {
  return apiFetch(`/api/keys/${id}`, {
    method: 'DELETE',
  });
}

export default apiFetch;
