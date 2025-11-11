import express from 'express';
import { Request, Response } from 'express';
import { db } from './database';
import { userAuth } from './auth';
import {
  TodayScheduleResponse,
  DoseStatus,
  DeviceStatus,
  InventoryResponse,
  ApiResponse,
  SymptomLog,
  AlertRule,
  Caregiver
} from './types';
import { addMinutes, differenceInSeconds, format, subDays, startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

// Helper function to calculate countdown remaining seconds
function calculateCountdownRemaining(dose: any): number {
  if (!dose.dispense_time || dose.status !== 'dispensed_waiting') {
    return 0;
  }
  
  const dispenseTime = new Date(dose.dispense_time);
  const timeoutTime = addMinutes(dispenseTime, 30);
  const now = new Date();
  
  const remaining = differenceInSeconds(timeoutTime, now);
  return Math.max(0, remaining);
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(403).json({ error: 'User already exists' });
    }
    
    const newUser = await db.createUser({ name, email, password });
    const token = `demo-token-for-${newUser.id}`;
    
    res.status(201).json({ user: newUser, token });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await db.findUserForLogin(email, password);
    if (user) {
      const token = `demo-token-for-${user.id}`;
      
      res.status(200).json({
        user: { id: user.id, name: user.name, email: user.email },
        token
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user endpoint for re-registration
router.delete('/users/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const deleted = await db.deleteUserByEmail(email);
    
    if (deleted) {
      res.status(200).json({ message: 'User deleted successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Medication management endpoints
router.get('/medications', async (req: Request, res: Response) => {
  try {
    const medications = db.getAllMedications();
    
    // Convert backend medication format to frontend format
    const frontendMedications = medications.map(med => ({
      id: med.id,
      name: med.name,
      times: med.times || [], // Add times array (would need to be added to backend)
      durationDays: med.durationDays || 30,
      startDate: med.startDate || new Date().toISOString(),
      createdAt: med.createdAt || new Date().toISOString()
    }));

    res.json({ medications: frontendMedications });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/medications', async (req: Request, res: Response) => {
  try {
    const { name, times, durationDays, startDate } = req.body;

    if (!name || !times || !Array.isArray(times) || times.length === 0) {
      return res.status(400).json({
        error: 'Medication name and times array are required'
      });
    }
    
    const newMedication = db.createMedication({
      name,
      times,
      durationDays: durationDays || 30,
      startDate: startDate || new Date().toISOString()
    });

    res.status(201).json({ medication: newMedication });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/medications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedMedication = db.updateMedication(id, updates);
    
    if (!updatedMedication) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.json({ medication: updatedMedication });
  } catch (error) {
    console.error('Error updating medication:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/medications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = db.deleteMedication(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// API KEY MANAGEMENT ENDPOINTS

// POST /api/keys/generate - Generate a new API key with 2-week expiration
router.post('/keys/generate', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    const timestamp = new Date().toISOString();
    
    console.log(`🔑 [${timestamp}] === API KEY GENERATION START ===`);
    console.log(`📊 Generating API key for user: ${userId}`);
    console.log(`🔍 Request body:`, JSON.stringify(req.body, null, 2));
    
    // Generate secure API key
    const plainApiKey = `careapp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 16)}`;
    
    // Hash the API key for secure storage
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(plainApiKey).digest('hex');
    
    console.log(`🔑 Plain API key: ${plainApiKey}`);
    console.log(`🔐 Key hash: ${keyHash}`);
    
    // Set expiration to 2 weeks from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 2 weeks
    
    console.log(`⏰ Expires at: ${expiresAt.toISOString()}`);
    
    // Prepare the API key data
    const apiKeyData = {
      user_id: userId,
      key_hash: keyHash,
      name: `API Key ${new Date().toLocaleDateString()}`,
      permissions: ['read_health_data', 'write_health_data'],
      expires_at: expiresAt.toISOString(),
      is_active: true,
      last_used: null
    };
    
    console.log(`📋 API key data:`, JSON.stringify(apiKeyData, null, 2));
    console.log(`🔄 Calling db.createApiKey...`);
    
    const newApiKey = db.createApiKey(apiKeyData);
    
    console.log(`✅ API key created:`, JSON.stringify(newApiKey, null, 2));
    console.log(`🔑 [${timestamp}] === API KEY GENERATION COMPLETE ===`);
    
    const response = {
      api_key: newApiKey,
      plain_api_key: plainApiKey, // Only return the plain key once during creation
      message: 'API key generated successfully. It will expire in 14 days. Copy this key now as it cannot be retrieved again.'
    };
    
    console.log(`📦 Final response:`, JSON.stringify(response, null, 2));
    
    res.status(201).json(response);
  } catch (error) {
    console.error('❌ Error generating API key:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/keys - Get all API keys for the user
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    
    const apiKeys = db.getApiKeysByUser(userId);
    
    // Remove the key_hash for security, only show status and metadata
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      user_id: key.user_id,
      name: key.name,
      permissions: key.permissions,
      is_active: key.is_active,
      last_used: key.last_used,
      expires_at: key.expires_at,
      created_at: key.created_at,
      updated_at: key.updated_at,
      // Don't expose key_hash for security
    }));
    
    res.json({ api_keys: sanitizedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/keys/:id - Revoke an API key
router.delete('/keys/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    
    // First check if the key belongs to this user
    const apiKey = db.getApiKey(id);
    if (!apiKey || apiKey.user_id !== userId) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    const deleted = db.deleteApiKey(id);
    
    if (deleted) {
      console.log(`🔑 API key revoked: ${id}`);
      res.status(200).json({ message: 'API key revoked successfully' });
    } else {
      res.status(404).json({ error: 'API key not found' });
    }
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Apply authentication middleware for all subsequent routes
router.use(userAuth);

// GET /api/doses/today - Get today's medication schedule
router.get('/doses/today', async (req: Request, res: Response) => {
  try {
    const todayDoses = db.getTodayDoses();
    
    const schedule: DoseStatus[] = todayDoses.map(dose => ({
      medication_id: dose.medication_id,
      medication_name: dose.medication_name,
      scheduled_time: dose.scheduled_time,
      status: dose.status,
      actual_time: dose.actual_time,
      time_elapsed_seconds: dose.time_elapsed_seconds,
      dispense_time: dose.dispense_time,
      error_message: dose.error_message,
      countdown_remaining_seconds: calculateCountdownRemaining(dose)
    }));

    const response: TodayScheduleResponse = {
      schedule
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching today doses:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/doses/upcoming?hours=4 - Get upcoming doses
router.get('/doses/upcoming', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 4;
    const now = new Date();
    const cutoffTime = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    const allDoses = db.getAllDoses();
    const upcomingDoses = allDoses.filter(dose => {
      const scheduledTime = new Date(dose.scheduled_time);
      return scheduledTime > now && scheduledTime <= cutoffTime && dose.status === 'pending';
    });

    const schedule: DoseStatus[] = upcomingDoses.map(dose => ({
      medication_id: dose.medication_id,
      medication_name: dose.medication_name,
      scheduled_time: dose.scheduled_time,
      status: dose.status,
      countdown_remaining_seconds: 0 // Not applicable for upcoming doses
    }));

    res.json({ schedule });
  } catch (error) {
    console.error('Error fetching upcoming doses:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/stats/adherence?days=7 - Get adherence statistics
router.get('/stats/adherence', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const now = new Date();
    const startDate = subDays(now, days);
    
    const allDoses = db.getAllDoses();
    const periodDoses = allDoses.filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= startDate && doseDate <= now;
    });

    const totalDoses = periodDoses.length;
    const takenDoses = periodDoses.filter(dose => dose.status === 'taken').length;
    const missedDoses = periodDoses.filter(dose => dose.status === 'missed').length;
    const errorDoses = periodDoses.filter(dose => dose.status === 'error').length;
    
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    res.json({
      period_days: days,
      total_doses: totalDoses,
      taken_doses: takenDoses,
      missed_doses: missedDoses,
      error_doses: errorDoses,
      adherence_rate: Math.round(adherenceRate * 100) / 100
    });
  } catch (error) {
    console.error('Error fetching adherence stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/stats/weekly - Get weekly adherence summary
router.get('/stats/weekly', async (req: Request, res: Response) => {
  try {
    const weeklyData: any[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const allDoses = db.getAllDoses();
      const dayDoses = allDoses.filter(dose => {
        const doseDate = new Date(dose.scheduled_time);
        return doseDate >= dayStart && doseDate <= dayEnd;
      });

      const total = dayDoses.length;
      const taken = dayDoses.filter(dose => dose.status === 'taken').length;
      const adherence = total > 0 ? (taken / total) * 100 : 100;

      weeklyData.push({
        date: format(date, 'yyyy-MM-dd'),
        day_name: format(date, 'EEEE'),
        total_doses: total,
        taken_doses: taken,
        adherence_rate: Math.round(adherence * 100) / 100
      });
    }

    res.json({ weekly_data: weeklyData });
  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/devices/status - Get all device status
router.get('/devices/status', async (req: Request, res: Response) => {
  try {
    const devices = db.getAllDevices();
    
    const deviceStatus: DeviceStatus[] = devices.map(device => ({
      device_id: device.id,
      type: device.type,
      status: device.status,
      last_seen: device.last_seen,
      battery_level: device.type === 'careband' ? 85 : undefined // Mock battery level
    }));

    res.json({ devices: deviceStatus });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/devices/inventory - Get medication inventory
router.get('/devices/inventory', async (req: Request, res: Response) => {
  try {
    const inventory = db.getAllInventory();
    
    const inventoryResponse: InventoryResponse[] = inventory.map(inv => {
      const medication = db.getMedication(inv.medication_id);
      const dailyDoses = 2; // Mock: 2 doses per day
      const daysRemaining = Math.floor(inv.pills_remaining / dailyDoses);
      
      return {
        medication_id: inv.medication_id,
        medication_name: medication?.name || 'Unknown Medication',
        pills_remaining: inv.pills_remaining,
        days_remaining: daysRemaining,
        refill_needed: inv.refill_needed,
        cartridge_slot: inv.cartridge_slot
      };
    });

    res.json({ inventory: inventoryResponse });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/history/doses?days=30&status=missed - Get dose history
router.get('/history/doses', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const statusFilter = req.query.status as string;
    
    const now = new Date();
    const startDate = subDays(now, days);
    
    const allDoses = db.getAllDoses();
    let historyDoses = allDoses.filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= startDate && doseDate <= now;
    });

    if (statusFilter) {
      historyDoses = historyDoses.filter(dose => dose.status === statusFilter);
    }

    // Sort by scheduled time descending
    historyDoses.sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime());

    const history = historyDoses.map(dose => ({
      id: dose.id,
      medication_id: dose.medication_id,
      medication_name: dose.medication_name,
      scheduled_time: dose.scheduled_time,
      status: dose.status,
      actual_time: dose.actual_time,
      time_elapsed_seconds: dose.time_elapsed_seconds,
      error_message: dose.error_message,
      reason: dose.reason
    }));

    res.json({
      history,
      total_records: history.length,
      filter_days: days,
      status_filter: statusFilter || 'all'
    });
  } catch (error) {
    console.error('Error fetching dose history:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SYMPTOM LOGGING ENDPOINTS

// POST /api/health/log-symptom - Log a new symptom
router.post('/health/log-symptom', async (req: Request, res: Response) => {
  try {
    const { symptom_type, description, severity, mood_rating, medications } = req.body;
    const userId = (req as any).user?.id || 'user_123'; // Default for demo

    console.log('📝 Symptom logging request received:', {
      userId,
      symptom_type,
      severity,
      hasDescription: !!description,
      medications
    });

    if (!symptom_type || !severity) {
      console.log('❌ Missing required fields:', { symptom_type, severity });
      return res.status(400).json({
        error: 'Symptom type and severity are required'
      });
    }

    // Validate and convert severity (must be 1-5)
    const severityNum = parseInt(severity);
    if (isNaN(severityNum) || severityNum < 1 || severityNum > 5) {
      console.log('❌ Invalid severity:', severity);
      return res.status(400).json({
        error: 'Severity must be a number between 1 and 5'
      });
    }

    // Validate and convert mood_rating (optional, must be 1-5)
    let moodRatingNum: number | undefined = undefined;
    if (mood_rating) {
      moodRatingNum = parseInt(mood_rating);
      if (isNaN(moodRatingNum) || moodRatingNum < 1 || moodRatingNum > 5) {
        console.log('❌ Invalid mood rating:', mood_rating);
        return res.status(400).json({
          error: 'Mood rating must be a number between 1 and 5'
        });
      }
    }

    console.log('🔄 Creating symptom log in database...');
    const newSymptomLog = db.createSymptomLog({
      user_id: userId,
      symptom_type,
      description,
      severity: severityNum as 1 | 2 | 3 | 4 | 5,
      mood_rating: moodRatingNum as 1 | 2 | 3 | 4 | 5 | undefined,
      medications: medications || [],
      timestamp: new Date().toISOString()
    });

    console.log('✅ Symptom log created successfully:', newSymptomLog.id);
    res.status(201).json({ symptom_log: newSymptomLog });
  } catch (error) {
    console.error('❌ Error logging symptom:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/health/symptoms - Get symptom logs
router.get('/health/symptoms', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    const days = parseInt(req.query.days as string) || 30;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const symptomLogs = db.getSymptomLogsByDateRange(userId, startDate, endDate);

    res.json({
      symptoms: symptomLogs,
      total_records: symptomLogs.length,
      date_range_days: days
    });
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/health/symptom-correlations - Get symptom correlations with medications
router.get('/health/symptom-correlations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    
    const correlations = db.analyzeSymptomCorrelations(userId);

    res.json({ correlations });
  } catch (error) {
    console.error('Error fetching symptom correlations:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DOCTOR'S REPORT ENDPOINTS

// GET /api/reports/doctor-visit - Generate doctor's report
router.get('/reports/doctor-visit', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    const range = req.query.range as string || '90days';
    const days = range === '30days' ? 30 : range === '60days' ? 60 : 90;
    
    const report = db.generateDoctorReport(userId, days);

    res.json({ report });
  } catch (error) {
    console.error('Error generating doctor report:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CALENDAR ADHERENCE ENDPOINTS

// GET /api/stats/calendar - Get calendar adherence data
router.get('/stats/calendar', async (req: Request, res: Response) => {
  try {
    const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }
    
    const calendarData = db.getCalendarAdherence(month, year);

    res.json({
      calendar: calendarData,
      month,
      year
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CAREGIVER PORTAL ENDPOINTS

// POST /api/caregivers/add - Add a new caregiver
router.post('/caregivers/add', async (req: Request, res: Response) => {
  try {
    const { name, email, relationship, permissions } = req.body;
    const userId = (req as any).user?.id || 'user_123'; // Default for demo

    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    const caregiver = db.createCaregiver({
      user_id: userId,
      name,
      email,
      relationship: relationship || 'family',
      permissions: permissions || ['view_adherence', 'view_inventory'],
      is_authorized: false
    });

    res.status(201).json({ caregiver });
  } catch (error) {
    console.error('Error adding caregiver:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caregivers/dashboard - Get caregiver dashboard data
router.get('/caregivers/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    
    const caregivers = db.getCaregiversByUser(userId);
    const recentDoses = Array.from(db.getAllDoses()).slice(0, 10);
    const inventory = db.getAllInventory();

    res.json({
      caregivers,
      recent_doses: recentDoses,
      inventory_status: inventory,
      last_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching caregiver dashboard:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// SMART ALERTS ENDPOINTS

// POST /api/caregivers/alert-rules - Create alert rule for caregivers
router.post('/caregivers/alert-rules', async (req: Request, res: Response) => {
  try {
    const { caregiver_id, rule_type, condition, is_active } = req.body;
    const userId = (req as any).user?.id || 'user_123'; // Default for demo

    if (!caregiver_id || !rule_type || !condition) {
      return res.status(400).json({
        error: 'Caregiver ID, rule type, and condition are required'
      });
    }

    const alertRule = db.createAlertRule({
      user_id: userId,
      caregiver_id,
      rule_type,
      condition: JSON.stringify(condition),
      is_active: is_active !== false // Default to true
    });

    res.status(201).json({ alert_rule: alertRule });
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/caregivers/alert-rules - Get alert rules for user's caregivers
router.get('/caregivers/alert-rules', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_123'; // Default for demo
    
    const alertRules = db.getAlertRulesByUser(userId);

    res.json({ alert_rules: alertRules });
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;