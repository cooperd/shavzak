import express, { Request, Response, Router } from 'express';
import { EMPLOYEES_COLLECTION } from '../config';
import {
  getCollectionDocs,
  getOnCallConfig,
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

// GET /api/on_call - Get current on-call information
router.get('/on_call', async (req: Request, res: Response): Promise<void> => {
  try {
    const onCallData = await getOnCallConfig();
    const employees = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);

    let currentEmployeeName = "N/A";
    let currentEmpIdOnCall: string | null = null;

    if (onCallData.rotation_order && onCallData.rotation_order.length > 0) {
      const currentIndex = onCallData.current_on_call_index || 0;
      if (currentIndex >= 0 && currentIndex < onCallData.rotation_order.length) {
        currentEmpIdOnCall = onCallData.rotation_order[currentIndex];
        const currentEmployee = employees.find(emp => emp.id === currentEmpIdOnCall);
        if (currentEmployee) {
          currentEmployeeName = currentEmployee.name;
        }
      }
    }
    res.status(200).json({
      current_on_call_employee_name: currentEmployeeName,
      current_on_call_employee_id: currentEmpIdOnCall || "N/A",
      rotation_order_ids: onCallData.rotation_order || [],
    });
  } catch (error) {
    console.error("Error fetching on-call info:", error);
    res.status(500).json({ message: "Error fetching on-call information" });
  }
});

export default router;