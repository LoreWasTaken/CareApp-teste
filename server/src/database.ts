import { v4 as uuidv4 } from 'uuid';
import {
  Dose,
  Medication,
  Inventory,
  Device,
  EventLog,
  DoseState,
  TIMEOUT_MINUTES,
  SymptomLog,
  AlertRule,
  Caregiver,
  SymptomCorrelation,
  ApiKey,
  AuthToken
} from './types';
import { addMinutes, isAfter, format } from 'date-fns';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export class Database {
  private doses: Map<string, Dose> = new Map();
  private medications: Map<string, Medication> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private devices: Map<string, Device> = new Map();
  private eventLogs: Map<string, EventLog> = new Map();
  private symptomLogs: Map<string, SymptomLog> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private caregivers: Map<string, Caregiver> = new Map();
  private apiKeys: Map<string, ApiKey> = new Map();
  private authTokens: Map<string, AuthToken> = new Map();

  private usersFilePath = path.join(__dirname, '../data/users.json');
  private symptomLogsFilePath = path.join(__dirname, '../data/symptom-logs.json');
  private caregiversFilePath = path.join(__dirname, '../data/caregivers.json');
  private alertRulesFilePath = path.join(__dirname, '../data/alert-rules.json');
  private apiKeysFilePath = path.join(__dirname, '../data/api-keys.json');

  // Encryption key for user data privacy (in production, this should come from environment)
  private readonly encryptionKey = crypto.scryptSync('careapp-secret-key-2024', 'salt', 32);
  private readonly iv = crypto.randomBytes(16);

  private ensureDataDirectory(): void {
    const dataDir = path.dirname(this.usersFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.usersFilePath)) {
      this.initializeUsersFile();
    }
    
    // Initialize other data files if they don't exist
    const filesToCheck = [
      this.symptomLogsFilePath,
      this.caregiversFilePath,
      this.alertRulesFilePath,
      this.apiKeysFilePath
    ];
    
    filesToCheck.forEach(filePath => {
      if (!fs.existsSync(filePath)) {
        const fileName = path.basename(filePath).replace('.json', '');
        const emptyData = { [fileName]: [] };
        fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2));
      }
    });
  }

  // Encryption/Decryption methods for user data privacy
  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // Return as-is if encryption fails
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // Return as-is if decryption fails
    }
  }

  // Load and save persistent data with encryption
  private loadPersistentData(): void {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [${timestamp}] === DATABASE LOAD START ===`);
    
    // Load symptom logs
    try {
      console.log(`📝 Loading symptom logs from: ${this.symptomLogsFilePath}`);
      if (fs.existsSync(this.symptomLogsFilePath)) {
        const encryptedData = fs.readFileSync(this.symptomLogsFilePath, 'utf8');
        console.log(`🔍 Raw file content: ${encryptedData.substring(0, 200)}...`);
        
        const data = JSON.parse(encryptedData);
        console.log(`📊 Parsed data structure:`, JSON.stringify(data, null, 2));
        
        if (data.symptom_logs && Array.isArray(data.symptom_logs)) {
          console.log(`📊 Found ${data.symptom_logs.length} symptom logs to load`);
          data.symptom_logs.forEach((log: any, index: number) => {
            console.log(`🔄 Loading symptom log ${index + 1}/${data.symptom_logs.length}:`, log.id);
            
            // Decrypt sensitive user data
            if (log.description) {
              try {
                log.description = this.decrypt(log.description);
                console.log(`🔓 Decrypted description for log ${log.id}`);
              } catch (decryptError) {
                console.warn(`⚠️ Failed to decrypt description for log ${log.id}, using as-is`);
              }
            }
            
            this.symptomLogs.set(log.id, log);
            console.log(`✅ Loaded symptom log ${log.id} into memory`);
          });
        } else {
          console.log(`ℹ️ No symptom_logs array found in data or it's empty`);
        }
      } else {
        console.log(`ℹ️ Symptom logs file does not exist, will be created on first save`);
      }
    } catch (error) {
      console.error('❌ Error loading symptom logs:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Load caregivers
    try {
      console.log(`👥 Loading caregivers from: ${this.caregiversFilePath}`);
      if (fs.existsSync(this.caregiversFilePath)) {
        const encryptedData = fs.readFileSync(this.caregiversFilePath, 'utf8');
        console.log(`🔍 Raw file content: ${encryptedData.substring(0, 200)}...`);
        
        const data = JSON.parse(encryptedData);
        console.log(`📊 Parsed data structure:`, JSON.stringify(data, null, 2));
        
        if (data.caregivers && Array.isArray(data.caregivers)) {
          console.log(`📊 Found ${data.caregivers.length} caregivers to load`);
          data.caregivers.forEach((caregiver: any, index: number) => {
            console.log(`🔄 Loading caregiver ${index + 1}/${data.caregivers.length}:`, caregiver.id);
            
            // Decrypt sensitive caregiver data
            if (caregiver.email) {
              try {
                caregiver.email = this.decrypt(caregiver.email);
                console.log(`🔓 Decrypted email for caregiver ${caregiver.id}`);
              } catch (decryptError) {
                console.warn(`⚠️ Failed to decrypt email for caregiver ${caregiver.id}, using as-is`);
              }
            }
            
            this.caregivers.set(caregiver.id, caregiver);
            console.log(`✅ Loaded caregiver ${caregiver.id} into memory`);
          });
        } else {
          console.log(`ℹ️ No caregivers array found in data or it's empty`);
        }
      } else {
        console.log(`ℹ️ Caregivers file does not exist, will be created on first save`);
      }
    } catch (error) {
      console.error('❌ Error loading caregivers:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Load alert rules
    try {
      console.log(`🚨 Loading alert rules from: ${this.alertRulesFilePath}`);
      if (fs.existsSync(this.alertRulesFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.alertRulesFilePath, 'utf8'));
        if (data.alert_rules && Array.isArray(data.alert_rules)) {
          console.log(`📊 Found ${data.alert_rules.length} alert rules to load`);
          data.alert_rules.forEach((rule: any) => {
            this.alertRules.set(rule.id, rule);
            console.log(`✅ Loaded alert rule ${rule.id}`);
          });
        }
      } else {
        console.log(`ℹ️ Alert rules file does not exist`);
      }
    } catch (error) {
      console.error('❌ Error loading alert rules:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Load API keys
    try {
      console.log(`🔑 Loading API keys from: ${this.apiKeysFilePath}`);
      if (fs.existsSync(this.apiKeysFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.apiKeysFilePath, 'utf8'));
        if (data.api_keys && Array.isArray(data.api_keys)) {
          console.log(`📊 Found ${data.api_keys.length} API keys to load`);
          data.api_keys.forEach((key: any) => {
            this.apiKeys.set(key.id, key);
            console.log(`✅ Loaded API key ${key.id}`);
          });
        }
      } else {
        console.log(`ℹ️ API keys file does not exist`);
      }
    } catch (error) {
      console.error('❌ Error loading API keys:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }
    
    console.log(`📊 Memory state after loading:`);
    console.log(`   - Symptom logs: ${this.symptomLogs.size}`);
    console.log(`   - Caregivers: ${this.caregivers.size}`);
    console.log(`   - Alert rules: ${this.alertRules.size}`);
    console.log(`   - API keys: ${this.apiKeys.size}`);
    console.log(`✅ [${timestamp}] === DATABASE LOAD COMPLETE ===\n`);
  }

  private savePersistentData(): void {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [${timestamp}] === DATABASE PERSISTENCE START ===`);
    
    // Save symptom logs
    try {
      console.log(`📝 Saving symptom logs to: ${this.symptomLogsFilePath}`);
      const symptomLogsArray = Array.from(this.symptomLogs.values());
      console.log(`📊 Symptom logs count: ${symptomLogsArray.length}`);
      
      if (symptomLogsArray.length > 0) {
        console.log('🔍 Symptom logs data:', JSON.stringify(symptomLogsArray, null, 2));
      }
      
      const symptomLogsData = {
        symptom_logs: symptomLogsArray.map(log => ({
          ...log,
          description: log.description ? this.encrypt(log.description) : log.description
        }))
      };
      
      console.log(`💾 Writing symptom logs to file...`);
      fs.writeFileSync(this.symptomLogsFilePath, JSON.stringify(symptomLogsData, null, 2));
      
      // Verify the file was written correctly
      const fileContent = fs.readFileSync(this.symptomLogsFilePath, 'utf8');
      console.log(`✅ Saved ${symptomLogsArray.length} symptom logs to file`);
      console.log(`🔍 File content verification:`, fileContent.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('❌ Error saving symptom logs:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Save caregivers
    try {
      console.log(`👥 Saving caregivers to: ${this.caregiversFilePath}`);
      const caregiversArray = Array.from(this.caregivers.values());
      console.log(`📊 Caregivers count: ${caregiversArray.length}`);
      
      if (caregiversArray.length > 0) {
        console.log('🔍 Caregivers data:', JSON.stringify(caregiversArray, null, 2));
      }
      
      const caregiversData = {
        caregivers: caregiversArray.map(caregiver => ({
          ...caregiver,
          email: caregiver.email ? this.encrypt(caregiver.email) : caregiver.email
        }))
      };
      
      console.log(`💾 Writing caregivers to file...`);
      fs.writeFileSync(this.caregiversFilePath, JSON.stringify(caregiversData, null, 2));
      
      // Verify the file was written correctly
      const fileContent = fs.readFileSync(this.caregiversFilePath, 'utf8');
      console.log(`✅ Saved ${caregiversArray.length} caregivers to file`);
      console.log(`🔍 File content verification:`, fileContent.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('❌ Error saving caregivers:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Save alert rules
    try {
      console.log(`🚨 Saving alert rules to: ${this.alertRulesFilePath}`);
      const alertRulesArray = Array.from(this.alertRules.values());
      console.log(`📊 Alert rules count: ${alertRulesArray.length}`);
      
      const alertRulesData = { alert_rules: alertRulesArray };
      fs.writeFileSync(this.alertRulesFilePath, JSON.stringify(alertRulesData, null, 2));
      console.log(`✅ Saved ${alertRulesArray.length} alert rules to file`);
    } catch (error) {
      console.error('❌ Error saving alert rules:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }

    // Save API keys
    try {
      console.log(`🔑 Saving API keys to: ${this.apiKeysFilePath}`);
      const apiKeysArray = Array.from(this.apiKeys.values());
      console.log(`📊 API keys count: ${apiKeysArray.length}`);
      
      const apiKeysData = { api_keys: apiKeysArray };
      fs.writeFileSync(this.apiKeysFilePath, JSON.stringify(apiKeysData, null, 2));
      console.log(`✅ Saved ${apiKeysArray.length} API keys to file`);
    } catch (error) {
      console.error('❌ Error saving API keys:', error);
      console.error('❌ Error details:', error instanceof Error ? error.stack : 'Unknown error');
    }
    
    console.log(`✅ [${timestamp}] === DATABASE PERSISTENCE COMPLETE ===\n`);
  }

  constructor() {
    this.initializeSampleData();
    this.ensureDataDirectory();
  }

  private initializeUsersFile(): void {
    const defaultUsers = {
      users: [
        {
          id: 'user_demo_123',
          name: 'Demo User',
          email: 'demo@example.com',
          password_hash: '$2b$10$rKz.K9WNMZx9L5mQ4L8rAOeJG4N7F2P6A3Q1V9H2S8C5D6E7F8G9', // password123
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        }
      ]
    };
    fs.writeFileSync(this.usersFilePath, JSON.stringify(defaultUsers, null, 2));
  }

  private readUsersFile(): any[] {
    try {
      const data = fs.readFileSync(this.usersFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.users || [];
    } catch (error) {
      console.error('Error reading users file:', error);
      return [];
    }
  }

  private writeUsersFile(users: any[]): void {
    try {
      const data = { users };
      fs.writeFileSync(this.usersFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing users file:', error);
      throw new Error('Failed to save user data');
    }
  }

  private initializeSampleData() {
    // Load persistent data from JSON files first
    this.loadPersistentData();
    
    // Note: Removed sample medication data as requested
    // App now starts clean without predefined medications
    console.log('✅ Database initialized with no sample data - starting clean');
  }

  private createSampleDoses() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const doses = [
      {
        medication_id: 'med_xyz789',
        medication_name: 'Lisinopril 10mg',
        scheduled_time: `${today}T09:00:00Z`,
        status: 'pending' as DoseState
      },
      {
        medication_id: 'med_xyz789',
        medication_name: 'Lisinopril 10mg',
        scheduled_time: `${today}T21:00:00Z`,
        status: 'pending' as DoseState
      },
      {
        medication_id: 'med_new123',
        medication_name: 'Metformin 500mg',
        scheduled_time: `${today}T08:00:00Z`,
        status: 'pending' as DoseState
      }
    ];

    doses.forEach(dose => {
      this.createDose(dose);
    });
  }

  // Dose operations
  createDose(data: {
    medication_id: string;
    medication_name: string;
    scheduled_time: string;
    status: DoseState;
    dispense_time?: string;
    retrieval_time?: string;
    actual_time?: string;
    time_elapsed_seconds?: number;
    error_message?: string;
    reason?: string;
  }): Dose {
    const dose: Dose = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.doses.set(dose.id, dose);
    return dose;
  }

  updateDose(id: string, updates: Partial<Dose>): Dose | null {
    const dose = this.doses.get(id);
    if (!dose) return null;

    const updatedDose = {
      ...dose,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.doses.set(id, updatedDose);
    return updatedDose;
  }

  getDose(id: string): Dose | null {
    return this.doses.get(id) || null;
  }

  getAllDoses(): Dose[] {
    return Array.from(this.doses.values());
  }

  getTodayDoses(): Dose[] {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.doses.values()).filter(dose => 
      dose.scheduled_time.startsWith(today)
    );
  }

  getDosesByStatus(status: DoseState): Dose[] {
    return Array.from(this.doses.values()).filter(dose => dose.status === status);
  }

  getPendingDoses(): Dose[] {
    return this.getDosesByStatus('pending');
  }

  getDispensedWaitingDoses(): Dose[] {
    return this.getDosesByStatus('dispensed_waiting');
  }

  // Check for timeout doses
  getTimeoutDoses(): Dose[] {
    const timeoutDoses: Dose[] = [];
    const now = new Date();

    this.getDispensedWaitingDoses().forEach(dose => {
      if (dose.dispense_time) {
        const dispenseTime = new Date(dose.dispense_time);
        const timeoutTime = addMinutes(dispenseTime, TIMEOUT_MINUTES);
        
        if (isAfter(now, timeoutTime)) {
          timeoutDoses.push(dose);
        }
      }
    });

    return timeoutDoses;
  }

  // Medication operations
  getMedication(id: string): Medication | null {
    return this.medications.get(id) || null;
  }

  getAllMedications(): Medication[] {
    return Array.from(this.medications.values());
  }

  // Inventory operations
  getInventory(id: string): Inventory | null {
    return this.inventory.get(id) || null;
  }

  getInventoryByMedication(medication_id: string): Inventory | null {
    return Array.from(this.inventory.values()).find(inv => inv.medication_id === medication_id) || null;
  }

  updateInventory(id: string, updates: Partial<Inventory>): Inventory | null {
    const inventory = this.inventory.get(id);
    if (!inventory) return null;

    const updatedInventory = {
      ...inventory,
      ...updates,
      last_updated: new Date().toISOString()
    };

    this.inventory.set(id, updatedInventory);
    return updatedInventory;
  }

  getAllInventory(): Inventory[] {
    return Array.from(this.inventory.values());
  }

  // Device operations
  getDevice(id: string): Device | null {
    return this.devices.get(id) || null;
  }

  updateDevice(id: string, updates: Partial<Device>): Device | null {
    const device = this.devices.get(id);
    if (!device) return null;

    const updatedDevice = {
      ...device,
      ...updates,
      last_seen: new Date().toISOString()
    };

    this.devices.set(id, updatedDevice);
    return updatedDevice;
  }

  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  // Event logging
  logEvent(event_id: string, device_id: string, event_type: string, payload: any): EventLog {
    const eventLog: EventLog = {
      id: uuidv4(),
      event_id,
      device_id,
      event_type,
      payload,
      processed_at: new Date().toISOString()
    };

    this.eventLogs.set(eventLog.id, eventLog);
    return eventLog;
  }

  getEventLogs(): EventLog[] {
    return Array.from(this.eventLogs.values());
  }

  async createUser(data: { name?: string; email: string; password: string }): Promise<any> {
    const users = this.readUsersFile();
    
    // Check if user already exists
    if (users.find(u => u.email === data.email)) {
      throw new Error('User already exists');
    }

    const id = uuidv4();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);
    
    const newUser = {
      id,
      name: data.name || '',
      email: data.email,
      password_hash: passwordHash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true
    };

    users.push(newUser);
    this.writeUsersFile(users);
    
    console.log(`New user created: ${id} && ${data.email}`);
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      created_at: newUser.created_at
    };
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const users = this.readUsersFile();
    const user = users.find(u => u.email === email && u.is_active);
    if (!user) return null;
    
    // Return user without password hash
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      is_active: user.is_active
    };
  }

  async findUserForLogin(email: string, password: string): Promise<any | null> {
    const users = this.readUsersFile();
    const user = users.find(u => u.email === email && u.is_active);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }

  async deleteUserByEmail(email: string): Promise<boolean> {
    try {
      const users = this.readUsersFile();
      const userIndex = users.findIndex(u => u.email === email);
      
      if (userIndex === -1) {
        return false;
      }
      
      // Remove user from array
      users.splice(userIndex, 1);
      this.writeUsersFile(users);
      
      console.log(`User deleted: ${email}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Medication management methods
  createMedication(data: {
    name: string;
    times: string[];
    durationDays?: number;
    startDate?: string;
    dosage?: string;
    description?: string;
  }): Medication {
    const medication: Medication = {
      id: uuidv4(),
      name: data.name,
      dosage: data.dosage || '',
      description: data.description,
      user_id: 'user_123', // Default user for demo
      times: data.times,
      durationDays: data.durationDays || 30,
      startDate: data.startDate || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    this.medications.set(medication.id, medication);
    // Note: Medications are not persisted to file in this demo, but this would be where you'd save them
    console.log(`✅ Created new medication: ${medication.id} - ${medication.name}`);
    return medication;
  }

  updateMedication(id: string, updates: Partial<Medication>): Medication | null {
    const medication = this.medications.get(id);
    if (!medication) return null;

    const updatedMedication = {
      ...medication,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.medications.set(id, updatedMedication);
    // Note: Medications are not persisted to file in this demo, but this would be where you'd save them
    return updatedMedication;
  }

  deleteMedication(id: string): boolean {
    return this.medications.delete(id);
  }

  // Symptom logging methods
  createSymptomLog(data: Omit<SymptomLog, 'id' | 'created_at' | 'updated_at'>): SymptomLog {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [${timestamp}] === CREATE SYMPTOM LOG START ===`);
    console.log(`📊 Input data:`, JSON.stringify(data, null, 2));
    
    const symptomLog: SymptomLog = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`🆔 Generated ID: ${symptomLog.id}`);
    console.log(`💾 Storing symptom log in memory map...`);
    this.symptomLogs.set(symptomLog.id, symptomLog);
    console.log(`✅ Symptom log stored in memory. Current count: ${this.symptomLogs.size}`);
    
    console.log(`💾 Triggering immediate save to persistent storage...`);
    this.savePersistentData();
    
    console.log(`📊 Memory state after creation:`);
    console.log(`   - Total symptom logs in memory: ${this.symptomLogs.size}`);
    console.log(`✅ [${timestamp}] === CREATE SYMPTOM LOG COMPLETE ===\n`);
    return symptomLog;
  }

  getSymptomLog(id: string): SymptomLog | null {
    return this.symptomLogs.get(id) || null;
  }

  getAllSymptomLogs(): SymptomLog[] {
    return Array.from(this.symptomLogs.values());
  }

  getSymptomLogsByUser(userId: string): SymptomLog[] {
    return Array.from(this.symptomLogs.values()).filter(log => log.user_id === userId);
  }

  getSymptomLogsByDateRange(userId: string, startDate: Date, endDate: Date): SymptomLog[] {
    return this.getSymptomLogsByUser(userId).filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  updateSymptomLog(id: string, updates: Partial<SymptomLog>): SymptomLog | null {
    const symptomLog = this.symptomLogs.get(id);
    if (!symptomLog) return null;

    const updatedSymptomLog = {
      ...symptomLog,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.symptomLogs.set(id, updatedSymptomLog);
    // Save immediately when updating symptom log
    this.savePersistentData();
    return updatedSymptomLog;
  }

  deleteSymptomLog(id: string): boolean {
    const deleted = this.symptomLogs.delete(id);
    // Save immediately when deleting symptom log
    if (deleted) {
      this.savePersistentData();
    }
    return deleted;
  }

  // Symptom correlation analysis
  analyzeSymptomCorrelations(userId: string): SymptomCorrelation[] {
    const userSymptoms = this.getSymptomLogsByUser(userId);
    const medications = this.getAllMedications().filter(med => med.user_id === userId);
    const correlations: SymptomCorrelation[] = [];

    medications.forEach(medication => {
      const medStartDate = new Date(medication.startDate || medication.createdAt || new Date().toISOString());
      const symptomCounts: { [key: string]: { total: number; daysAfterStart: number[] } } = {};

      userSymptoms.forEach(symptom => {
        if (symptom.medications.includes(medication.id)) {
          const symptomDate = new Date(symptom.timestamp);
          const daysAfterStart = Math.floor((symptomDate.getTime() - medStartDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (!symptomCounts[symptom.symptom_type]) {
            symptomCounts[symptom.symptom_type] = { total: 0, daysAfterStart: [] };
          }
          
          symptomCounts[symptom.symptom_type].total++;
          symptomCounts[symptom.symptom_type].daysAfterStart.push(daysAfterStart);
        }
      });

      Object.entries(symptomCounts).forEach(([symptomType, data]) => {
        const avgDaysAfterStart = data.daysAfterStart.reduce((a, b) => a + b, 0) / data.daysAfterStart.length;
        correlations.push({
          medication_id: medication.id,
          medication_name: medication.name,
          symptom_pattern: symptomType,
          days_after_start: Math.round(avgDaysAfterStart),
          frequency: data.total
        });
      });
    });

    return correlations;
  }

  // Caregiver management methods
  createCaregiver(data: Omit<Caregiver, 'id' | 'created_at' | 'updated_at'>): Caregiver {
    const timestamp = new Date().toISOString();
    console.log(`\n🔄 [${timestamp}] === CREATE CAREGIVER START ===`);
    console.log(`📊 Input data:`, JSON.stringify(data, null, 2));
    
    const caregiver: Caregiver = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`🆔 Generated ID: ${caregiver.id}`);
    console.log(`💾 Storing caregiver in memory map...`);
    this.caregivers.set(caregiver.id, caregiver);
    console.log(`✅ Caregiver stored in memory. Current count: ${this.caregivers.size}`);
    
    console.log(`💾 Triggering immediate save to persistent storage...`);
    this.savePersistentData();
    
    console.log(`📊 Memory state after creation:`);
    console.log(`   - Total caregivers in memory: ${this.caregivers.size}`);
    console.log(`✅ [${timestamp}] === CREATE CAREGIVER COMPLETE ===\n`);
    return caregiver;
  }

  getCaregiver(id: string): Caregiver | null {
    return this.caregivers.get(id) || null;
  }

  getCaregiversByUser(userId: string): Caregiver[] {
    return Array.from(this.caregivers.values()).filter(caregiver => caregiver.user_id === userId);
  }

  updateCaregiver(id: string, updates: Partial<Caregiver>): Caregiver | null {
    const caregiver = this.caregivers.get(id);
    if (!caregiver) return null;

    const updatedCaregiver = {
      ...caregiver,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.caregivers.set(id, updatedCaregiver);
    // Save immediately when updating caregiver
    this.savePersistentData();
    return updatedCaregiver;
  }

  deleteCaregiver(id: string): boolean {
    const deleted = this.caregivers.delete(id);
    // Save immediately when deleting caregiver
    if (deleted) {
      this.savePersistentData();
    }
    return deleted;
  }

  // Alert rules management
  createAlertRule(data: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): AlertRule {
    const alertRule: AlertRule = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.alertRules.set(alertRule.id, alertRule);
    // Save immediately when creating new alert rule
    this.savePersistentData();
    console.log(`✅ Created new alert rule: ${alertRule.id}`);
    return alertRule;
  }

  getAlertRule(id: string): AlertRule | null {
    return this.alertRules.get(id) || null;
  }

  getAlertRulesByUser(userId: string): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(rule => rule.user_id === userId);
  }

  getAlertRulesByCaregiver(caregiverId: string): AlertRule[] {
    return Array.from(this.alertRules.values()).filter(rule => rule.caregiver_id === caregiverId);
  }

  updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
    const alertRule = this.alertRules.get(id);
    if (!alertRule) return null;

    const updatedAlertRule = {
      ...alertRule,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.alertRules.set(id, updatedAlertRule);
    // Save immediately when updating alert rule
    this.savePersistentData();
    return updatedAlertRule;
  }

  deleteAlertRule(id: string): boolean {
    const deleted = this.alertRules.delete(id);
    // Save immediately when deleting alert rule
    if (deleted) {
      this.savePersistentData();
    }
    return deleted;
  }

  // Calendar adherence statistics
  getCalendarAdherence(month: number, year: number): any[] {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const calendarData: any[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayDoses = Array.from(this.doses.values()).filter(dose =>
        dose.scheduled_time.startsWith(dateStr)
      );
      
      const totalDoses = dayDoses.length;
      const takenDoses = dayDoses.filter(dose => dose.status === 'taken').length;
      const missedDoses = dayDoses.filter(dose => dose.status === 'missed').length;
      
      let status = 'green'; // perfect adherence
      if (totalDoses === 0) {
        status = 'gray'; // no doses scheduled
      } else if (missedDoses === totalDoses) {
        status = 'red'; // completely missed
      } else if (takenDoses < totalDoses) {
        status = 'yellow'; // partial adherence
      }
      
      calendarData.push({
        date: dateStr,
        day: currentDate.getDate(),
        status,
        total_doses: totalDoses,
        taken_doses: takenDoses,
        missed_doses: missedDoses,
        adherence_rate: totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendarData;
  }

  // Generate doctor's report data
  generateDoctorReport(userId: string, days: number = 90): any {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const medications = this.getAllMedications().filter(med => med.user_id === userId);
    const symptoms = this.getSymptomLogsByDateRange(userId, startDate, endDate);
    const doses = Array.from(this.doses.values()).filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= startDate && doseDate <= endDate;
    });
    
    const totalDoses = doses.length;
    const takenDoses = doses.filter(dose => dose.status === 'taken').length;
    const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
    
    // Group symptoms by type
    const symptomSummary = symptoms.reduce((acc, symptom) => {
      if (!acc[symptom.symptom_type]) {
        acc[symptom.symptom_type] = {
          count: 0,
          severity_sum: 0,
          severity_avg: 0,
          recent_entries: []
        };
      }
      
      acc[symptom.symptom_type].count++;
      acc[symptom.symptom_type].severity_sum += symptom.severity;
      acc[symptom.symptom_type].recent_entries.push({
        date: symptom.timestamp,
        severity: symptom.severity,
        description: symptom.description
      });
      
      return acc;
    }, {} as any);
    
    // Calculate average severity
    Object.values(symptomSummary).forEach((summary: any) => {
      summary.severity_avg = Math.round((summary.severity_sum / summary.count) * 10) / 10;
    });
    
    return {
      report_period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days
      },
      adherence_summary: {
        total_doses: totalDoses,
        taken_doses: takenDoses,
        missed_doses: doses.filter(dose => dose.status === 'missed').length,
        adherence_rate: adherenceRate
      },
      current_medications: medications.map(med => ({
        name: med.name,
        dosage: med.dosage,
        times: med.times || [],
        start_date: med.startDate || med.createdAt
      })),
      symptom_summary: symptomSummary,
      symptom_correlations: this.analyzeSymptomCorrelations(userId)
    };
  }

  // API Key management methods
  createApiKey(data: Omit<ApiKey, 'id' | 'created_at' | 'updated_at'>): ApiKey {
    const timestamp = new Date().toISOString();
    console.log(`\n🔑 [${timestamp}] === CREATE API KEY START ===`);
    console.log(`📊 Input data:`, JSON.stringify(data, null, 2));
    
    try {
      const apiKey: ApiKey = {
        id: uuidv4(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`🆔 Generated ID: ${apiKey.id}`);
      console.log(`🔍 API Key structure:`, JSON.stringify(apiKey, null, 2));
      console.log(`� Storing API key in memory map...`);
      
      this.apiKeys.set(apiKey.id, apiKey);
      console.log(`✅ API key stored in memory. Current count: ${this.apiKeys.size}`);
      
      // Verify it's stored
      const storedKey = this.apiKeys.get(apiKey.id);
      console.log(`🔍 Verification - Retrieved from memory:`, JSON.stringify(storedKey, null, 2));
      
      console.log(` Triggering immediate save to persistent storage...`);
      this.savePersistentData();
      
      console.log(`📊 Memory state after creation:`);
      console.log(`   - Total API keys in memory: ${this.apiKeys.size}`);
      console.log(`✅ [${timestamp}] === CREATE API KEY COMPLETE ===\n`);
      
      return apiKey;
    } catch (error) {
      console.error(`❌ [${timestamp}] === CREATE API KEY ERROR ===`);
      console.error(`❌ Error creating API key:`, error);
      console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'Unknown error');
      throw error;
    }
  }

  getApiKey(id: string): ApiKey | null {
    return this.apiKeys.get(id) || null;
  }

  getApiKeyByHash(keyHash: string): ApiKey | null {
    return Array.from(this.apiKeys.values()).find(apiKey => apiKey.key_hash === keyHash) || null;
  }

  getApiKeysByUser(userId: string): ApiKey[] {
    return Array.from(this.apiKeys.values()).filter(key => key.user_id === userId);
  }

  updateApiKey(id: string, updates: Partial<ApiKey>): ApiKey | null {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey) return null;

    const updatedApiKey = {
      ...apiKey,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.apiKeys.set(id, updatedApiKey);
    // Save immediately when updating API key
    this.savePersistentData();
    return updatedApiKey;
  }

  deleteApiKey(id: string): boolean {
    const deleted = this.apiKeys.delete(id);
    // Save immediately when deleting API key
    if (deleted) {
      this.savePersistentData();
    }
    return deleted;
  }

  // Cleanup expired API keys
  cleanupExpiredApiKeys(): number {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [id, apiKey] of this.apiKeys.entries()) {
      if (apiKey.expires_at && new Date(apiKey.expires_at) < now) {
        this.apiKeys.delete(id);
        cleanedCount++;
        console.log(`🧹 Cleaned up expired API key: ${id}`);
      }
    }
    
    if (cleanedCount > 0) {
      this.savePersistentData();
    }
    
    return cleanedCount;
  }

  // Check if API key is valid and not expired
  isApiKeyValid(key: string): boolean {
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    const apiKey = this.getApiKeyByHash(keyHash);
    if (!apiKey || !apiKey.is_active) {
      return false;
    }
    
    // Check expiration
    if (apiKey.expires_at) {
      const now = new Date();
      const expiresAt = new Date(apiKey.expires_at);
      if (expiresAt < now) {
        console.log(`🔑 API key expired: ${key}`);
        return false;
      }
    }
    
    return true;
  }
}

export const db = new Database();
