// /Users/dvircooper/projects/shavzak/backend/src/types.ts
export interface Employee {
  id: string;
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

export interface EmployeePreferencesPayload {
  [employeeId: string]: {
    [shiftSlot: string]: string; // "0", "1", or ""
  };
}
