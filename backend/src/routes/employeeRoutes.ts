import express, { Request, Response, Router } from 'express';
import { EMPLOYEES_COLLECTION } from '../config';
import {
  getCollectionDocs,
  getDocById,
  addDoc,
  updateDocById,
  deleteDocById,
} from '../utils/firestoreUtils';

// Define a type for your Employee data (similar to your frontend types.ts)
interface Employee {
  id?: string; // Firestore ID will be a string, optional when creating
  name: string;
  total_shifts_assigned: number;
  total_day_shifts_assigned: number;
  total_night_shifts_assigned: number;
}

const router: Router = express.Router();

const sortEmployees = (employeesList: Employee[]): Employee[] => {
  return [...employeesList].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
};

// GET /api/employees - Get all employees
router.get('/employees', async (req: Request, res: Response): Promise<void> => {
  try {
    const allEmployees = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);
    res.status(200).json(sortEmployees(allEmployees));
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ message: "Error fetching employees" });
  }
});

// POST /api/employees - Add a new employee
router.post('/employees', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: "Employee name is required and must be a non-empty string" });
    }

    const allEmployees = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);
    if (allEmployees.some(emp => emp.name.toLowerCase() === name.trim().toLowerCase())) {
      return res.status(409).json({ message: `Employee with name '${name.trim()}' already exists` });
    }

    const newEmployeeData: Omit<Employee, 'id'> = { // Omit 'id' as Firestore will generate it
      name: name.trim(),
      total_shifts_assigned: 0,
      total_day_shifts_assigned: 0,
      total_night_shifts_assigned: 0,
    };

    const newId = await addDoc(EMPLOYEES_COLLECTION, newEmployeeData);
    const addedEmployee: Employee = { ...newEmployeeData, id: newId };

    res.status(201).json(addedEmployee);
  } catch (error) {
    console.error("Error adding employee:", error);
    res.status(500).json({ message: "Error adding employee" });
  }
});

// PUT /api/employees/:employeeId - Update an employee
router.put('/employees/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: "Employee name is required for update" });
    }

    const employeeToUpdate = await getDocById<Employee>(EMPLOYEES_COLLECTION, employeeId);
    if (!employeeToUpdate) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const updatedName = name.trim();
    // Check for duplicate names only if the name is actually changing
    if (employeeToUpdate.name.toLowerCase() !== updatedName.toLowerCase()) {
      const allEmployees = await getCollectionDocs<Employee>(EMPLOYEES_COLLECTION);
      if (allEmployees.some(emp => emp.name.toLowerCase() === updatedName.toLowerCase() && emp.id !== employeeId)) {
        return res.status(409).json({ message: `Another employee with name '${updatedName}' already exists` });
      }
    }

    await updateDocById(EMPLOYEES_COLLECTION, employeeId, { name: updatedName });
    const updatedEmployee: Employee = { ...employeeToUpdate, name: updatedName };

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ message: "Error updating employee" });
  }
});

// DELETE /api/employees/:employeeId - Delete an employee
router.delete('/employees/:employeeId', async (req: Request, res: Response): Promise<any> => {
  try {
    const { employeeId } = req.params;

    const employeeToDelete = await getDocById<Employee>(EMPLOYEES_COLLECTION, employeeId);
    if (!employeeToDelete) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await deleteDocById(EMPLOYEES_COLLECTION, employeeId);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Error deleting employee" });
  }
});

export default router;