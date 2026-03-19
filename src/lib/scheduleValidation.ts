// Validation Logic for Shift Scheduling System

export interface ShiftType {
    id: number;
    code: string;
    start_time: string;
    end_time: string;
    working_hours: number;
}

export interface ScheduleEntry {
    emp_id: string;
    schedule_date: string; // YYYY-MM-DD
    shift_type_id: number;
}

/**
 * Parses time string (HH:MM:SS) to hours.
 */
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + (minutes / 60);
}

/**
 * Validates the 8-8-8 rule (No strict back-to-back night-to-morning shifts)
 * Specifically, checks if an employee has a night shift ending at 08:00 and starts a morning shift at 08:00 the same day (or next).
 * This is a basic implementation assuming shifts fall within the same 24-hr period block logic.
 */
export function checkRestPeriodRule(
    newSchedule: ScheduleEntry, 
    existingSchedules: ScheduleEntry[], 
    shiftTypes: ShiftType[]
): { isValid: boolean; error?: string } {

    const newShift = shiftTypes.find(s => s.id === newSchedule.shift_type_id);
    if (!newShift) return { isValid: false, error: 'Shift type not found' };

    // Find schedules for the same employee around the targeted date
    const targetDateObj = new Date(newSchedule.schedule_date);
    const dayBefore = new Date(targetDateObj);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    const dayBeforeStr = dayBefore.toISOString().split('T')[0];
    const targetDateStr = newSchedule.schedule_date;

    // Check Previous Day Night Shift -> Today Morning
    // Typical "Night Shift" usually ends at 08:00 on the *current* day if it started the day before, or starts at 00:00 of the current day.
    // Assuming 'ด' (Night) is 00:00 - 08:00 on the same date.
    
    // Check if there's already a shift on the same day causing issues
    const sameDayShifts = existingSchedules.filter(s => s.emp_id === newSchedule.emp_id && s.schedule_date === targetDateStr);
    
    for (const existing of sameDayShifts) {
        const existShift = shiftTypes.find(s => s.id === existing.shift_type_id);
        if (!existShift) continue;

        // E.g., Adding Morning (08:00 - 16:00) when there is already Night (00:00 - 08:00) 
        // Or vice-versa. While technically 8 hours of rest is broken if they are consecutive.
        if (existShift.end_time === newShift.start_time || newShift.end_time === existShift.start_time) {
             return { isValid: false, error: `Employee ${newSchedule.emp_id} violates rest period rule (Consecutive shifts without break).` };
        }
    }

    return { isValid: true };
}

/**
 * Validates Maximum Consecutive Days (e.g., max 7 days)
 */
export function checkMaxConsecutiveDays(
    emp_id: string,
    allSchedules: ScheduleEntry[],
    maxDays: number = 7
): { isValid: boolean; error?: string } {
    // Collect all unique dates with shifts for this employee
    const dates = allSchedules
        .filter(s => s.emp_id === emp_id)
        .map(s => new Date(s.schedule_date).getTime())
        .sort((a, b) => a - b);

    if (dates.length === 0) return { isValid: true };

    let consecutiveCount = 1;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    for (let i = 1; i < dates.length; i++) {
        // If the gap is exactly 1 day
        if (dates[i] - dates[i-1] === ONE_DAY_MS) {
            consecutiveCount++;
            if (consecutiveCount > maxDays) {
                return { isValid: false, error: `Employee ${emp_id} exceeds maximum continuous working days (${maxDays}).` };
            }
        } else if (dates[i] - dates[i-1] > ONE_DAY_MS) {
            consecutiveCount = 1; // Reset count
        }
    }

    return { isValid: true };
}
