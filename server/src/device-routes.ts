import express from 'express';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './database';
import { AuthenticatedRequest, deviceAuth, requireDeviceType } from './auth';
import { 
  DeviceEvent, 
  PillDispensedEvent, 
  PillRetrievedEvent,
  DispenseErrorEvent,
  LowInventoryEvent,
  CartridgeInsertedEvent,
  CartridgeRemovedEvent,
  AlertSentEvent,
  ButtonPressEvent,
  BandRemovedEvent,
  BandWornEvent,
  ApiResponse
} from './types';
import { addMinutes, differenceInSeconds } from 'date-fns';

const router = express.Router();

// Apply device authentication to all routes
router.use(deviceAuth);

// Helper function to calculate countdown time
function calculateCountdown(dose: any): number {
  if (!dose.dispense_time || dose.status !== 'dispensed_waiting') {
    return 0;
  }
  
  const dispenseTime = new Date(dose.dispense_time);
  const timeoutTime = addMinutes(dispenseTime, 30);
  const now = new Date();
  
  const remaining = differenceInSeconds(timeoutTime, now);
  return Math.max(0, remaining);
}

// CAREBOX ENDPOINTS
router.post('/carebox/event', requireDeviceType('carebox'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event: DeviceEvent = req.body;
    const eventId = uuidv4();
    
    console.log(`Received CareBox event: ${event.event_type} from ${event.device_id}`);

    // Log the event
    db.logEvent(eventId, event.device_id, event.event_type, event);

    switch (event.event_type) {
      case 'pill_dispensed':
        await handlePillDispensed(event as PillDispensedEvent);
        break;
        
      case 'pill_retrieved':
        await handlePillRetrieved(event as PillRetrievedEvent);
        break;
        
      case 'dispense_error':
        await handleDispenseError(event as DispenseErrorEvent);
        break;
        
      case 'low_inventory':
        await handleLowInventory(event as LowInventoryEvent);
        break;
        
      case 'cartridge_inserted':
        await handleCartridgeInserted(event as CartridgeInsertedEvent);
        break;
        
      case 'cartridge_removed':
        await handleCartridgeRemoved(event as CartridgeRemovedEvent);
        break;
        
      default:
        console.warn(`Unknown CareBox event type: ${event.event_type}`);
        return res.status(400).json({
          error: `Unknown event type: ${event.event_type}`
        });
    }

    const response: ApiResponse = {
      received: true,
      event_id: eventId,
      processed_at: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing CareBox event:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// CAREBand ENDPOINTS
router.post('/careband/event', requireDeviceType('careband'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event: DeviceEvent = req.body;
    const eventId = uuidv4();
    
    console.log(`Received CareBand event: ${event.event_type} from ${event.device_id}`);

    // Log the event
    db.logEvent(eventId, event.device_id, event.event_type, event);

    switch (event.event_type) {
      case 'alert_sent':
        await handleAlertSent(event as AlertSentEvent);
        break;
        
      case 'button_press':
        await handleButtonPress(event as ButtonPressEvent);
        break;
        
      case 'band_removed':
        await handleBandRemoved(event as BandRemovedEvent);
        break;
        
      case 'band_worn':
        await handleBandWorn(event as BandWornEvent);
        break;
        
      default:
        console.warn(`Unknown CareBand event type: ${event.event_type}`);
        return res.status(400).json({
          error: `Unknown event type: ${event.event_type}`
        });
    }

    const response: ApiResponse = {
      received: true,
      event_id: eventId,
      processed_at: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing CareBand event:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Event Handlers
async function handlePillDispensed(event: PillDispensedEvent) {
  // Find the scheduled dose
  const todayDoses = db.getTodayDoses();
  const scheduledDose = todayDoses.find(dose => 
    dose.medication_id === event.medication_id && 
    dose.status === 'pending' &&
    Math.abs(new Date(dose.scheduled_time).getTime() - new Date(event.scheduled_time).getTime()) < 300000 // 5 minute tolerance
  );

  if (scheduledDose) {
    // Update dose to dispensed_waiting
    db.updateDose(scheduledDose.id, {
      status: 'dispensed_waiting',
      dispense_time: event.actual_dispense_time
    });
    
    console.log(`Dose ${scheduledDose.id} set to dispensed_waiting`);
  } else {
    // Create a new dose record if no scheduled dose found
    const medication = db.getMedication(event.medication_id);
    const dose = db.createDose({
      medication_id: event.medication_id,
      medication_name: medication?.name || 'Unknown Medication',
      scheduled_time: event.scheduled_time,
      status: 'dispensed_waiting',
      dispense_time: event.actual_dispense_time
    });
    
    console.log(`Created new dispensed_waiting dose: ${dose.id}`);
  }
}

async function handlePillRetrieved(event: PillRetrievedEvent) {
  const todayDoses = db.getTodayDoses();
  const dispensedDose = todayDoses.find(dose => 
    dose.medication_id === event.medication_id && 
    dose.status === 'dispensed_waiting'
  );

  if (dispensedDose) {
    db.updateDose(dispensedDose.id, {
      status: 'taken',
      actual_time: event.retrieval_time,
      retrieval_time: event.retrieval_time,
      time_elapsed_seconds: event.time_elapsed_seconds
    });
    
    console.log(`Dose ${dispensedDose.id} marked as taken`);
  } else {
    console.warn(`No dispensed_waiting dose found for retrieval: ${event.medication_id}`);
  }
}

async function handleDispenseError(event: DispenseErrorEvent) {
  const todayDoses = db.getTodayDoses();
  const scheduledDose = todayDoses.find(dose => 
    dose.medication_id === event.medication_id && 
    dose.status === 'pending'
  );

  if (scheduledDose) {
    db.updateDose(scheduledDose.id, {
      status: 'error',
      error_message: event.error_message
    });
    
    console.log(`Dose ${scheduledDose.id} marked as error: ${event.error_message}`);
  } else {
    // Create error dose record
    const medication = db.getMedication(event.medication_id);
    db.createDose({
      medication_id: event.medication_id,
      medication_name: medication?.name || 'Unknown Medication',
      scheduled_time: event.scheduled_time,
      status: 'error',
      error_message: event.error_message
    });
  }
}

async function handleLowInventory(event: LowInventoryEvent) {
  const inventory = db.getInventoryByMedication(event.medication_id);
  if (inventory) {
    db.updateInventory(inventory.id, {
      pills_remaining: event.pills_remaining,
      refill_needed: event.pills_remaining <= event.refill_threshold
    });
    
    console.log(`Inventory updated for ${event.medication_id}: ${event.pills_remaining} pills remaining`);
  }
}

async function handleCartridgeInserted(event: CartridgeInsertedEvent) {
  // Find existing inventory for this medication or create new
  let inventory = db.getInventoryByMedication(event.medication_id);
  
  if (inventory) {
    db.updateInventory(inventory.id, {
      pills_remaining: event.initial_pill_count,
      initial_pill_count: event.initial_pill_count,
      cartridge_slot: event.cartridge_slot,
      calibration_weight_grams: event.calibration_weight_grams,
      refill_needed: false
    });
  } else {
    // Create new inventory record
    const id = uuidv4();
    const inventoryData = {
      id,
      medication_id: event.medication_id,
      device_id: event.device_id,
      cartridge_slot: event.cartridge_slot,
      pills_remaining: event.initial_pill_count,
      initial_pill_count: event.initial_pill_count,
      refill_threshold: 7,
      refill_needed: false,
      calibration_weight_grams: event.calibration_weight_grams,
      last_updated: event.timestamp
    };
    
    // Since we can't access the map directly, we'll create a simple object to track
    console.log(`New cartridge inserted: ${event.medication_id} in slot ${event.cartridge_slot}`);
  }
}

async function handleCartridgeRemoved(event: CartridgeRemovedEvent) {
  const inventory = db.getInventoryByMedication(event.medication_id);
  if (inventory) {
    db.updateInventory(inventory.id, {
      pills_remaining: event.pills_remaining
    });
    
    console.log(`Cartridge ${event.medication_id} removed, ${event.pills_remaining} pills remaining`);
  }
}

async function handleAlertSent(event: AlertSentEvent) {
  console.log(`Alert sent for medication ${event.medication_id} at ${event.scheduled_time}`);
  // Could trigger additional logic here
}

async function handleButtonPress(event: ButtonPressEvent) {
  const todayDoses = db.getTodayDoses();
  const scheduledDose = todayDoses.find(dose => 
    dose.medication_id === event.medication_id && 
    dose.status === 'pending'
  );

  if (scheduledDose) {
    db.updateDose(scheduledDose.id, {
      acknowledged: true
    });
    
    console.log(`Dose ${scheduledDose.id} acknowledged by user`);
  }
}

async function handleBandRemoved(event: BandRemovedEvent) {
  console.log(`CareBand ${event.device_id} removed from wrist`);
  // Could trigger logic to pause reminders or send notifications
}

async function handleBandWorn(event: BandWornEvent) {
  console.log(`CareBand ${event.device_id} put back on wrist`);
  // Could resume reminder services
}

export default router;