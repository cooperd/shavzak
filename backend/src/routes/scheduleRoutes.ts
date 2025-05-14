import express, { Request, Response, Router } from 'express';
import {
  EMPLOYEES_COLLECTION,
  DAYS_OF_WEEK,
  SHIFT_TYPES,
  MAX_SHIFTS_PER_WEEK,
} from '../config';
import { getCollectionDocs, updateDocById } from '../utils/firestoreUtils';
import { createWeeklySchedule } from '../scheduleGenerator';
import { Employee, EmployeePreferencesPayload } from '../types'; // Assuming types.ts exists

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

    const { 
      proposed_schedule_with_ids, 
      proposed_schedule_with_names, 
      unfilled_shifts, 
      employee_shifts_this_week 
    } = createWeeklySchedule(employeePreferencesRaw, employeesDict, DAYS_OF_WEEK, SHIFT_TYPES, MAX_SHIFTS_PER_WEEK);
    // Note: createWeeklySchedule is synchronous in this translation, matching the Python version.
    // If it were to become async (e.g., for more complex DB lookups within), you'd use 'await'.

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
      message: "Schedule generated successfully.",
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