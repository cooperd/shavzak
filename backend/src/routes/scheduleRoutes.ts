import express, { Request, Response, Router } from 'express';
import {
  EMPLOYEES_COLLECTION,
  DAYS_OF_WEEK,
  SHIFT_TYPES,
  MAX_SHIFTS_PER_WEEK,
} from '../config';
import { getCollectionDocs, updateDocById } from '../utils/firestoreUtils';
// We'll create and import this next
// import { createWeeklySchedule } from '../scheduleGenerator'; 

// Define a type for your Employee data (mirroring frontend/types.ts and backend/routes/employeeRoutes.ts)
interface Employee {
  id: string; // Firestore ID will be a string
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
  // Add any other fields your Employee object might have
}

// Define a type for the preferences payload from the frontend
interface EmployeePreferencesPayload {
  [employeeId: string]: {
    [shiftSlot: string]: string; // "0", "1", or ""
  };
}

const router: Router = express.Router();

router.post('/generate_schedule', async (req: Request, res: Response): Promise<any> => {
  try {
    const { preferences: employeePreferencesRaw } = req.body as { preferences: EmployeePreferencesPayload };

    if (!employeePreferencesRaw || typeof employeePreferencesRaw !== 'object') {
      return res.status(400).json({ message: "Invalid 'preferences' data in request body" });
    }

    const employeesData = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);
    if (!employeesData || employeesData.length === 0) {
      return res.status(400).json({ message: "No employee data found. Please add employees." });
    }

    const employeesDict: { [id: string]: Employee } = {};
    employeesData.forEach(emp => {
      employeesDict[emp.id] = { ...emp }; // Create a mutable copy
    });

    // Placeholder for the actual schedule generation logic
    // This will be replaced by a call to the translated createWeeklySchedule function
    // For now, let's mock the output structure
    const mockScheduleOutput = {
        proposed_schedule_with_ids: {} as Record<string, string[]>, // e.g., { "Sunday_Day": ["id1", "id2"] }
        proposed_schedule_with_names: {} as Record<string, string>, // e.g., { "Sunday_Day": "Alice, Bob" }
        unfilled_shifts: [] as string[],
        employee_shifts_this_week: {} as Record<string, number>, // e.g., { "id1": 2 }
    };
    // TODO: Replace mockScheduleOutput with actual call:
    // const { proposed_schedule_with_ids, proposed_schedule_with_names, unfilled_shifts, employee_shifts_this_week } = 
    //   await createWeeklySchedule(employeePreferencesRaw, employeesDict, DAYS_OF_WEEK, SHIFT_TYPES, MAX_SHIFTS_PER_WEEK);

    const { proposed_schedule_with_ids, proposed_schedule_with_names, unfilled_shifts, employee_shifts_this_week } = mockScheduleOutput;

    // Update total employee shift counts based on the generated schedule for *this* week
    const updatedEmployeesForResponse = { ...employeesDict }; // Work with copies

    for (const shiftSlot in proposed_schedule_with_ids) {
      for (const employeeId of proposed_schedule_with_ids[shiftSlot]) {
        if (updatedEmployeesForResponse[employeeId]) {
          const empToUpdate = updatedEmployeesForResponse[employeeId];
          empToUpdate.total_shifts_assigned = (empToUpdate.total_shifts_assigned || 0) + 1;
          if (shiftSlot.includes("_Day")) {
            empToUpdate.total_day_shifts_assigned = (empToUpdate.total_day_shifts_assigned || 0) + 1;
          } else if (shiftSlot.includes("_Night")) {
            empToUpdate.total_night_shifts_assigned = (empToUpdate.total_night_shifts_assigned || 0) + 1;
          }
        }
      }
    }
    const updatedEmployeesList = Object.values(updatedEmployeesForResponse).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    res.status(200).json({
      message: "Schedule generation (mocked) successful.",
      proposed_schedule_with_ids,
      proposed_schedule_with_names,
      unfilled_shifts,
      employee_shifts_this_week,
      updated_employees: updatedEmployeesList,
    });

  } catch (error) {
    console.error("Error generating schedule:", error);
    res.status(500).json({ message: "Error generating schedule" });
  }
});

export default router;