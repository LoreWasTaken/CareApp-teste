import { db } from './database';
import { Dose, DoseState, TIMEOUT_MINUTES } from './types';
import { addMinutes, isAfter, differenceInMinutes } from 'date-fns';

export class StateMachine {
  private static instance: StateMachine;
  private timeoutCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): StateMachine {
    if (!StateMachine.instance) {
      StateMachine.instance = new StateMachine();
    }
    return StateMachine.instance;
  }

  // Start the timeout detection service
  public startTimeoutService(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
    }

    // Check for timeouts every minute
    this.timeoutCheckInterval = setInterval(() => {
      this.checkForTimeouts();
    }, 60000); // 60 seconds

    console.log('State machine timeout service started - checking every 60 seconds');
  }

  // Stop the timeout detection service
  public stopTimeoutService(): void {
    if (this.timeoutCheckInterval) {
      clearInterval(this.timeoutCheckInterval);
      this.timeoutCheckInterval = null;
      console.log('State machine timeout service stopped');
    }
  }

  // Check for doses that have timed out
  private checkForTimeouts(): void {
    const timeoutDoses = db.getTimeoutDoses();
    
    timeoutDoses.forEach(dose => {
      const timeoutResult = this.transitionDoseToMissed(dose);
      if (timeoutResult.success) {
        console.log(`Dose ${dose.id} automatically marked as missed due to timeout`);
        
        // TODO
        // - Send caregiver notification
        // - Update adherence metrics
        // - Log the timeout event
        this.handleMissedDoseNotification(dose);
      } else {
        console.error(`Failed to transition dose ${dose.id} to missed:`, timeoutResult.error);
      }
    });
  }

  // Transition a dose to missed status
  public transitionDoseToMissed(dose: Dose): { success: boolean; error?: string; dose?: Dose } {
    if (dose.status !== 'dispensed_waiting') {
      return { 
        success: false, 
        error: `Cannot transition dose from status ${dose.status} to missed` 
      };
    }

    if (!dose.dispense_time) {
      return { 
        success: false, 
        error: 'Cannot determine timeout without dispense_time' 
      };
    }

    const dispenseTime = new Date(dose.dispense_time);
    const timeoutTime = addMinutes(dispenseTime, TIMEOUT_MINUTES);
    const now = new Date();

    if (!isAfter(now, timeoutTime)) {
      return { 
        success: false, 
        error: 'Timeout condition not met yet' 
      };
    }

    const updatedDose = db.updateDose(dose.id, {
      status: 'missed',
      reason: 'timeout_not_retrieved',
      timeout_time: timeoutTime.toISOString()
    });

    return {
      success: true,
      dose: updatedDose || undefined
    };
  }

  private handleMissedDoseNotification(dose: Dose): void {
    // TODO:
    // 1. Send push notification to caregiver
    // 2. Update adherence dashboard
    // 3. Log the event for analytics
    // 4. Trigger follow-up reminders

    console.log(`Missed dose notification: ${dose.medication_name} at ${dose.scheduled_time}`);
  }

  public isValidTransition(from: DoseState, to: DoseState): boolean {
    const validTransitions: Record<DoseState, DoseState[]> = {
      'pending': ['dispensed_waiting', 'error', 'skipped'],
      'dispensed_waiting': ['taken', 'missed'],
      'taken': [], // Terminal state
      'missed': [], // Terminal state
      'error': ['pending'], // Can retry
      'skipped': [] // Terminal state
    };

    return validTransitions[from]?.includes(to) || false;
  }

  // Attempt a state transition
  public transitionDose(
    doseId: string, 
    toState: DoseState, 
    additionalData?: Partial<Dose>
  ): { success: boolean; error?: string; dose?: Dose } {
    const dose = db.getDose(doseId);
    if (!dose) {
      return { success: false, error: 'Dose not found' };
    }

    if (!this.isValidTransition(dose.status, toState)) {
      return { 
        success: false, 
        error: `Invalid transition from ${dose.status} to ${toState}` 
      };
    }

    const updates: Partial<Dose> = {
      status: toState,
      ...additionalData
    };

    // Add timestamp for certain transitions
    if (toState === 'taken' && additionalData?.actual_time) {
      updates.actual_time = additionalData.actual_time;
    }

    if (toState === 'error' && additionalData?.error_message) {
      updates.error_message = additionalData.error_message;
    }

    const updatedDose = db.updateDose(doseId, updates);
    return { success: true, dose: updatedDose || undefined };
  }

  // Get current countdown for a dispensed waiting dose
  public getCountdownSeconds(dose: Dose): number {
    if (dose.status !== 'dispensed_waiting' || !dose.dispense_time) {
      return 0;
    }

    const dispenseTime = new Date(dose.dispense_time);
    const timeoutTime = addMinutes(dispenseTime, TIMEOUT_MINUTES);
    const now = new Date();

    const remainingMs = timeoutTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }

  // Get time until timeout for a dispensed waiting dose
  public getTimeUntilTimeout(dose: Dose): { minutes: number; seconds: number } | null {
    if (dose.status !== 'dispensed_waiting' || !dose.dispense_time) {
      return null;
    }

    const dispenseTime = new Date(dose.dispense_time);
    const timeoutTime = addMinutes(dispenseTime, TIMEOUT_MINUTES);
    const now = new Date();

    const totalSeconds = differenceInMinutes(timeoutTime, now) * 60;
    const remainingSeconds = Math.max(0, totalSeconds);

    return {
      minutes: Math.floor(remainingSeconds / 60),
      seconds: remainingSeconds % 60
    };
  }

  // Get all doses that need attention (pending, dispensed_waiting, error)
  public getDosesNeedingAttention(): Dose[] {
    const allDoses = db.getAllDoses();
    const today = new Date().toISOString().split('T')[0];
    
    return allDoses.filter(dose => 
      dose.scheduled_time.startsWith(today) &&
      ['pending', 'dispensed_waiting', 'error'].includes(dose.status)
    );
  }

  // Get adherence summary for a date range
  public getAdherenceSummary(startDate: Date, endDate: Date): {
    total: number;
    taken: number;
    missed: number;
    error: number;
    skipped: number;
    pending: number;
    adherenceRate: number;
  } {
    const allDoses = db.getAllDoses();
    
    const periodDoses = allDoses.filter(dose => {
      const doseDate = new Date(dose.scheduled_time);
      return doseDate >= startDate && doseDate <= endDate;
    });

    const total = periodDoses.length;
    const taken = periodDoses.filter(dose => dose.status === 'taken').length;
    const missed = periodDoses.filter(dose => dose.status === 'missed').length;
    const error = periodDoses.filter(dose => dose.status === 'error').length;
    const skipped = periodDoses.filter(dose => dose.status === 'skipped').length;
    const pending = periodDoses.filter(dose => dose.status === 'pending').length;
    
    const adherenceRate = total > 0 ? (taken / total) * 100 : 100;

    return {
      total,
      taken,
      missed,
      error,
      skipped,
      pending,
      adherenceRate: Math.round(adherenceRate * 100) / 100
    };
  }
}

// Export singleton instance
export const stateMachine = StateMachine.getInstance();