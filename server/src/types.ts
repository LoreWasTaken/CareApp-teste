// Base types
export interface BaseEvent {
  event_type: string;
  device_id: string;
  timestamp: string;
}

// CareBox Events
export interface PillDispensedEvent extends BaseEvent {
  event_type: 'pill_dispensed';
  medication_id: string;
  scheduled_time: string;
  actual_dispense_time: string;
  tray_weight_grams: number;
}

export interface PillRetrievedEvent extends BaseEvent {
  event_type: 'pill_retrieved';
  medication_id: string;
  scheduled_time: string;
  retrieval_time: string;
  time_elapsed_seconds: number;
  tray_weight_grams: number;
}

export interface DispenseErrorEvent extends BaseEvent {
  event_type: 'dispense_error';
  medication_id: string;
  scheduled_time: string;
  error_code: string;
  error_type: string;
  error_message: string;
}

export interface LowInventoryEvent extends BaseEvent {
  event_type: 'low_inventory';
  medication_id: string;
  pills_remaining: number;
  days_remaining: number;
  refill_threshold: number;
}

export interface CartridgeInsertedEvent extends BaseEvent {
  event_type: 'cartridge_inserted';
  cartridge_slot: number;
  medication_id: string;
  initial_pill_count: number;
  calibration_weight_grams: number;
}

export interface CartridgeRemovedEvent extends BaseEvent {
  event_type: 'cartridge_removed';
  cartridge_slot: number;
  medication_id: string;
  pills_remaining: number;
}

// CareBand Events
export interface AlertSentEvent extends BaseEvent {
  event_type: 'alert_sent';
  alert_type: string;
  medication_id: string;
  scheduled_time: string;
}

export interface ButtonPressEvent extends BaseEvent {
  event_type: 'button_press';
  button_action: string;
  medication_id: string;
  scheduled_time: string;
}

export interface BandRemovedEvent extends BaseEvent {
  event_type: 'band_removed';
}

export interface BandWornEvent extends BaseEvent {
  event_type: 'band_worn';
}

// Union type for all device events
export type DeviceEvent = 
  | PillDispensedEvent 
  | PillRetrievedEvent 
  | DispenseErrorEvent 
  | LowInventoryEvent 
  | CartridgeInsertedEvent 
  | CartridgeRemovedEvent
  | AlertSentEvent 
  | ButtonPressEvent 
  | BandRemovedEvent 
  | BandWornEvent;

// Database Models
export interface Dose {
  id: string;
  medication_id: string;
  medication_name: string;
  scheduled_time: string;
  status: 'pending' | 'dispensed_waiting' | 'taken' | 'missed' | 'error' | 'skipped';
  dispense_time?: string;
  retrieval_time?: string;
  actual_time?: string;
  time_elapsed_seconds?: number;
  error_message?: string;
  reason?: string;
  timeout_time?: string;
  acknowledged?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  description?: string;
  user_id: string;
  // Frontend-compatible fields
  times?: string[];
  durationDays?: number;
  startDate?: string;
  createdAt?: string;
}

export interface Inventory {
  id: string;
  medication_id: string;
  device_id: string;
  cartridge_slot?: number;
  pills_remaining: number;
  initial_pill_count: number;
  refill_threshold: number;
  refill_needed: boolean;
  calibration_weight_grams?: number;
  last_updated: string;
}

export interface Device {
  id: string;
  type: 'carebox' | 'careband';
  auth_token: string;
  status: 'online' | 'offline' | 'error';
  last_seen: string;
  firmware_version?: string;
}

export interface EventLog {
  id: string;
  event_id: string;
  device_id: string;
  event_type: string;
  payload: any;
  processed_at: string;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  symptom_type: string;
  description?: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1-5 scale
  mood_rating?: 1 | 2 | 3 | 4 | 5; // 1-5 scale
  medications: string[]; // List of medication IDs being taken when symptom occurred
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomCorrelation {
  medication_id: string;
  medication_name: string;
  symptom_pattern: string;
  days_after_start: number;
  frequency: number;
}

export interface AlertRule {
  id: string;
  user_id: string;
  caregiver_id: string;
  rule_type: 'missed_dose' | 'low_inventory' | 'symptom_severity';
  condition: string; // JSON string with conditions
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string; // Primary user who added this caregiver
  name: string;
  email: string;
  relationship: string;
  permissions: string[]; // ['view_adherence', 'view_inventory', 'receive_alerts']
  is_authorized: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string; // Hashed API key for security
  permissions: string[]; // ['read_symptoms', 'read_reports', 'read_adherence', 'write_data']
  is_active: boolean;
  last_used: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  id: string;
  user_id: string;
  token_hash: string;
  token_type: 'access' | 'refresh';
  expires_at: string;
  created_at: string;
  last_used: string | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  received?: boolean;
  event_id?: string;
  processed_at?: string;
  data?: T;
  error?: string;
}

export interface DoseStatus {
  medication_id: string;
  medication_name: string;
  scheduled_time: string;
  status: Dose['status'];
  actual_time?: string;
  time_elapsed_seconds?: number;
  dispense_time?: string;
  error_message?: string;
  countdown_remaining_seconds?: number;
}

export interface TodayScheduleResponse {
  schedule: DoseStatus[];
}

export interface DeviceStatus {
  device_id: string;
  type: 'carebox' | 'careband';
  status: 'online' | 'offline' | 'error';
  last_seen: string;
  battery_level?: number;
}

export interface InventoryResponse {
  medication_id: string;
  medication_name: string;
  pills_remaining: number;
  days_remaining: number;
  refill_needed: boolean;
  cartridge_slot?: number;
}

// State Machine
export type DoseState = 'pending' | 'dispensed_waiting' | 'taken' | 'missed' | 'error' | 'skipped';

export interface StateTransition {
  from: DoseState;
  to: DoseState;
  trigger: string;
  action?: () => void;
}

// Constants
export const TIMEOUT_MINUTES = 30;
export const POLLING_INTERVAL_SECONDS = 15;
export const DEFAULT_REFILL_THRESHOLD = 7;