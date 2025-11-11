import express from 'express';
import { Request, Response } from 'express';
import { db } from './database';
import { 
  PillDispensedEvent, 
  PillRetrievedEvent, 
  DispenseErrorEvent,
  LowInventoryEvent,
  AlertSentEvent,
  ButtonPressEvent
} from './types';

const router = express.Router();

// POST /api/test/simulate-dispense - Simulate pill dispensing
router.post('/simulate-dispense', async (req: Request, res: Response) => {
  try {
    const { 
      medication_id = 'med_xyz789', 
      delay_seconds = 0 
    } = req.body;

    const now = new Date();
    const scheduledTime = new Date(now.getTime() - 300000); // 5 minutes ago
    const actualDispenseTime = new Date(now.getTime() + (delay_seconds * 1000));

    const dispenseEvent: PillDispensedEvent = {
      event_type: 'pill_dispensed',
      device_id: 'carebox_abc123',
      medication_id,
      scheduled_time: scheduledTime.toISOString(),
      actual_dispense_time: actualDispenseTime.toISOString(),
      tray_weight_grams: 0.354,
      timestamp: actualDispenseTime.toISOString()
    };

    console.log(`[TEST] Simulating pill dispensing in ${delay_seconds} seconds...`);
    
    setTimeout(async () => {
      try {
        // Find and update dose
        const todayDoses = db.getTodayDoses();
        const scheduledDose = todayDoses.find(dose => 
          dose.medication_id === medication_id && 
          dose.status === 'pending'
        );

        if (scheduledDose) {
          db.updateDose(scheduledDose.id, {
            status: 'dispensed_waiting',
            dispense_time: actualDispenseTime.toISOString()
          });
          console.log(`[TEST] Dose ${scheduledDose.id} set to dispensed_waiting`);
        } else {
          const medication = db.getMedication(medication_id);
          const dose = db.createDose({
            medication_id,
            medication_name: medication?.name || 'Test Medication',
            scheduled_time: scheduledTime.toISOString(),
            status: 'dispensed_waiting',
            dispense_time: actualDispenseTime.toISOString()
          });
          console.log(`[TEST] Created new dispensed_waiting dose: ${dose.id}`);
        }
      } catch (error) {
        console.error('[TEST] Error simulating dispense:', error);
      }
    }, delay_seconds * 1000);

    res.json({
      message: `Dispense simulated with ${delay_seconds}s delay`,
      event: dispenseEvent,
      scheduled_for: actualDispenseTime.toISOString()
    });
  } catch (error) {
    console.error('Error simulating dispense:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/test/simulate-retrieval - Simulate pill retrieval
router.post('/simulate-retrieval', async (req: Request, res: Response) => {
  try {
    const { 
      medication_id = 'med_xyz789', 
      delay_seconds = 10 
    } = req.body;

    const now = new Date();
    const retrievalTime = new Date(now.getTime() + (delay_seconds * 1000));

    console.log(`[TEST] Simulating pill retrieval in ${delay_seconds} seconds...`);

    setTimeout(async () => {
      try {
        const todayDoses = db.getTodayDoses();
        const dispensedDose = todayDoses.find(dose => 
          dose.medication_id === medication_id && 
          dose.status === 'dispensed_waiting'
        );

        if (dispensedDose && dispensedDose.dispense_time) {
          const dispenseTime = new Date(dispensedDose.dispense_time);
          const timeElapsed = Math.floor((retrievalTime.getTime() - dispenseTime.getTime()) / 1000);

          db.updateDose(dispensedDose.id, {
            status: 'taken',
            actual_time: retrievalTime.toISOString(),
            retrieval_time: retrievalTime.toISOString(),
            time_elapsed_seconds: timeElapsed
          });
          
          console.log(`[TEST] Dose ${dispensedDose.id} marked as taken`);
        } else {
          console.warn(`[TEST] No dispensed_waiting dose found for retrieval: ${medication_id}`);
        }
      } catch (error) {
        console.error('[TEST] Error simulating retrieval:', error);
      }
    }, delay_seconds * 1000);

    res.json({
      message: `Retrieval simulated with ${delay_seconds}s delay`,
      scheduled_for: retrievalTime.toISOString()
    });
  } catch (error) {
    console.error('Error simulating retrieval:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/test/simulate-error - Simulate dispense error
router.post('/simulate-error', async (req: Request, res: Response) => {
  try {
    const { 
      medication_id = 'med_xyz789',
      error_code = 'E102',
      error_type = 'iris_gate_jam',
      error_message = 'Iris aperture failed to open - cartridge may be jammed'
    } = req.body;

    const now = new Date();
    const scheduledTime = new Date(now.getTime() - 300000); // 5 minutes ago

    const errorEvent: DispenseErrorEvent = {
      event_type: 'dispense_error',
      device_id: 'carebox_abc123',
      medication_id,
      scheduled_time: scheduledTime.toISOString(),
      error_code,
      error_type,
      error_message,
      timestamp: now.toISOString()
    };

    // Find and update dose
    const todayDoses = db.getTodayDoses();
    const scheduledDose = todayDoses.find(dose => 
      dose.medication_id === medication_id && 
      dose.status === 'pending'
    );

    if (scheduledDose) {
      db.updateDose(scheduledDose.id, {
        status: 'error',
        error_message
      });
      console.log(`[TEST] Dose ${scheduledDose.id} marked as error: ${error_message}`);
    } else {
      const medication = db.getMedication(medication_id);
      db.createDose({
        medication_id,
        medication_name: medication?.name || 'Test Medication',
        scheduled_time: scheduledTime.toISOString(),
        status: 'error',
        error_message
      });
      console.log(`[TEST] Created new error dose record`);
    }

    res.json({
      message: 'Dispense error simulated',
      event: errorEvent
    });
  } catch (error) {
    console.error('Error simulating error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/test/simulate-timeout - Simulate timeout scenario
router.post('/simulate-timeout', async (req: Request, res: Response) => {
  try {
    const { medication_id = 'med_xyz789' } = req.body;

    const now = new Date();
    const dispenseTime = new Date(now.getTime() - (35 * 60 * 1000)); // 35 minutes ago
    const scheduledTime = new Date(dispenseTime.getTime() - 300000); // 30 minutes before dispense

    // Find and update dose to dispensed_waiting with old timestamp
    const todayDoses = db.getTodayDoses();
    let targetDose = todayDoses.find(dose => 
      dose.medication_id === medication_id && 
      ['pending', 'dispensed_waiting'].includes(dose.status)
    );

    if (targetDose) {
      db.updateDose(targetDose.id, {
        status: 'dispensed_waiting',
        dispense_time: dispenseTime.toISOString()
      });
      console.log(`[TEST] Dose ${targetDose.id} set to dispensed_waiting with old timestamp`);
    } else {
      const medication = db.getMedication(medication_id);
      targetDose = db.createDose({
        medication_id,
        medication_name: medication?.name || 'Test Medication',
        scheduled_time: scheduledTime.toISOString(),
        status: 'dispensed_waiting',
        dispense_time: dispenseTime.toISOString()
      });
      console.log(`[TEST] Created new dose for timeout simulation: ${targetDose.id}`);
    }

    res.json({
      message: 'Timeout scenario simulated - dose should be marked as missed on next check',
      dose_id: targetDose?.id,
      dispense_time: dispenseTime.toISOString(),
      timeout_at: new Date(dispenseTime.getTime() + (30 * 60 * 1000)).toISOString()
    });
  } catch (error) {
    console.error('Error simulating timeout:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/test/simulate-band-alert - Simulate CareBand alert
router.post('/simulate-band-alert', async (req: Request, res: Response) => {
  try {
    const { 
      medication_id = 'med_xyz789',
      alert_type = 'vibration_pattern_1'
    } = req.body;

    const now = new Date();
    const scheduledTime = new Date(now.getTime() - 600000); // 10 minutes ago

    const alertEvent: AlertSentEvent = {
      event_type: 'alert_sent',
      device_id: 'careband_xyz456',
      alert_type,
      medication_id,
      scheduled_time: scheduledTime.toISOString(),
      timestamp: now.toISOString()
    };

    console.log(`[TEST] CareBand alert simulated for ${medication_id}`);

    res.json({
      message: 'CareBand alert simulated',
      event: alertEvent
    });
  } catch (error) {
    console.error('Error simulating band alert:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/test/simulate-band-button - Simulate CareBand button press
router.post('/simulate-band-button', async (req: Request, res: Response) => {
  try {
    const { 
      medication_id = 'med_xyz789',
      button_action = 'acknowledge_dose'
    } = req.body;

    const now = new Date();

    const buttonEvent: ButtonPressEvent = {
      event_type: 'button_press',
      device_id: 'careband_xyz456',
      button_action,
      medication_id,
      scheduled_time: now.toISOString(),
      timestamp: now.toISOString()
    };

    // Find and acknowledge dose
    const todayDoses = db.getTodayDoses();
    const scheduledDose = todayDoses.find(dose => 
      dose.medication_id === medication_id && 
      dose.status === 'pending'
    );

    if (scheduledDose) {
      db.updateDose(scheduledDose.id, {
        acknowledged: true
      });
      console.log(`[TEST] Dose ${scheduledDose.id} acknowledged by user`);
    }

    res.json({
      message: 'CareBand button press simulated',
      event: buttonEvent
    });
  } catch (error) {
    console.error('Error simulating band button press:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/test/scenarios - List available test scenarios
router.get('/scenarios', async (req: Request, res: Response) => {
  const scenarios = [
    {
      id: 'dispense_and_take',
      name: 'Successful Dispense and Take',
      description: 'Simulates pill dispensing followed by retrieval within 30 minutes',
      endpoint: 'POST /api/test/simulate-dispense',
      follow_up: 'POST /api/test/simulate-retrieval'
    },
    {
      id: 'dispense_timeout',
      name: 'Dispense with Timeout',
      description: 'Simulates pill dispensing that times out after 30 minutes',
      endpoint: 'POST /api/test/simulate-timeout'
    },
    {
      id: 'dispense_error',
      name: 'Dispense Error',
      description: 'Simulates mechanical failure during dispensing',
      endpoint: 'POST /api/test/simulate-error'
    },
    {
      id: 'band_reminder',
      name: 'CareBand Reminder',
      description: 'Simulates haptic reminder sent to CareBand',
      endpoint: 'POST /api/test/simulate-band-alert'
    },
    {
      id: 'band_acknowledge',
      name: 'CareBand Acknowledgment',
      description: 'Simulates user pressing acknowledgment button on CareBand',
      endpoint: 'POST /api/test/simulate-band-button'
    }
  ];

  res.json({
    available_scenarios: scenarios,
    usage: 'Send POST requests to the listed endpoints with optional parameters'
  });
});

// GET /api/test/clear-data - Clear all test data
router.get('/clear-data', async (req: Request, res: Response) => {
  try {
    // This would clear test data in a real implementation
    // For now, just return a message
    res.json({
      message: 'Test data cleared (simulated)',
      note: 'In a real implementation, this would reset the database'
    });
  } catch (error) {
    console.error('Error clearing test data:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;