import express, { Request, Response, Router } from 'express';
import { EMPLOYEES_COLLECTION } from '../config';
import {
  getCollectionDocs,
  getOnCallConfig,
  saveOnCallConfig,
  updateDocById,
} from '../utils/firestoreUtils';

// Define a type for your Employee data (mirroring frontend/types.ts)
interface Employee {
  id: string;
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

const router: Router = express.Router();

// POST /api/finalize_schedule - Finalize the schedule
router.post('/finalize_schedule', async (req: Request, res: Response): Promise<any> => {
  try {
    const { schedule_to_finalize: finalizedScheduleWithIds } = req.body as { schedule_to_finalize: Record<string, string[]> };

    if (!finalizedScheduleWithIds || typeof finalizedScheduleWithIds !== 'object') {
      return res.status(400).json({ message: "No schedule data provided for finalization or invalid format" });
    }

    const employeesData = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);
    if (!employeesData || employeesData.length === 0) {
      return res.status(500).json({ message: "Cannot finalize, no employee data found." });
    }

    const employeesDict: { [id: string]: Employee } = {};
    employeesData.forEach(emp => employeesDict[emp.id] = { ...emp });

    for (const shiftSlot in finalizedScheduleWithIds) {
      for (const employeeId of finalizedScheduleWithIds[shiftSlot]) {
        if (employeeId && employeesDict[employeeId]) {
          employeesDict[employeeId].total_shifts_assigned = (employeesDict[employeeId].total_shifts_assigned || 0) + 1;
          if (shiftSlot.includes("_Day")) {
            employeesDict[employeeId].total_day_shifts_assigned = (employeesDict[employeeId].total_day_shifts_assigned || 0) + 1;
          } else if (shiftSlot.includes("_Night")) {
            employeesDict[employeeId].total_night_shifts_assigned = (employeesDict[employeeId].total_night_shifts_assigned || 0) + 1;
          }
        }
      }
    }

    for (const empId in employeesDict) {
      await updateDocById(EMPLOYEES_COLLECTION, empId, employeesDict[empId]);
    }

    const onCallData = await getOnCallConfig();
    if (onCallData.rotation_order && onCallData.rotation_order.length > 0) {
      const currentIndex = onCallData.current_on_call_index || 0;
      onCallData.current_on_call_index = (currentIndex + 1) % onCallData.rotation_order.length;
      await saveOnCallConfig(onCallData);
    }

    res.status(200).json({ message: "Schedule finalized, employee data updated, and on-call advanced." });
  } catch (error) {
    console.error("Error finalizing schedule:", error);
    res.status(500).json({ message: "Error finalizing schedule" });
  }
});

export default router;