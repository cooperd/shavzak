export interface Employee {
  id: string;
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const SHIFT_TYPES = ['Day', 'Night'];

export type EmployeePreferences = {
  [employeeId: string]: {
    [shiftSlot: string]: string; // "" | "0" | "1"
  };
};

export interface ScheduleGenerationResponse {
  message?: string; // Optional success or info message
  proposed_schedule_with_ids: Record<string, string[]>; // e.g., { "Sunday_Day": ["employee_id_1", "employee_id_2"] }
  updated_employees: Employee[]; // The full list of employees with updated shift counts
  // Optional fields that were in your example response, include them if your backend consistently sends them:
  employee_shifts_this_week?: Record<string, number>; // e.g., { "employee_id_1": 3 }
  proposed_schedule_with_names?: Record<string, string>; // e.g., { "Sunday_Day": "Alice, Bob" }
  unfilled_shifts?: string[]; // e.g., ["Tuesday_Night"]
}