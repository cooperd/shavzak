import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase.config'; // Assuming your Firestore instance is exported as 'db'
import type { Employee } from '../types'; // Assuming you have an Employee type defined

// Define query keys
const EMPLOYEE_QUERY_KEY = ['employees'];

// --- Hooks for Employee Data ---

/**
 * Hook to fetch all employees from Firestore.
 */
export function useEmployees() {
  return useQuery<Employee[], Error>({
    queryKey: EMPLOYEE_QUERY_KEY,
    queryFn: async () => {
      const employeesCollectionRef = collection(db, "employees");
      const querySnapshot = await getDocs(employeesCollectionRef);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Map Firestore data to your Employee type, including the document ID
        return {
          id: doc.id,
          name: data.name || 'Unnamed Employee', // Default if name is missing
          department: data.department || '', // Include department
          total_shifts_assigned: data.stats?.totalShifts || 0, // Access nested stats
          day_shifts_assigned: data.stats?.dayShifts || 0,
          night_shifts_assigned: data.stats?.nightShifts || 0,
          weekend_shifts_assigned: data.stats?.weekendShifts || 0,
        } as unknown as Employee;
      });
    },
  });
}

/**
 * Hook to add a new employee to Firestore.
 */
export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Omit<Employee, 'id'>>({
    mutationFn: async (newEmployeeData) => {
      // Initialize stats for a new employee
      await addDoc(collection(db, "employees"), {
        ...newEmployeeData,
        stats: {
          totalShifts: 0,
          dayShifts: 0,
          nightShifts: 0,
          weekendShifts: 0,
        },
        createdAt: new Date(), // Add timestamps
        updatedAt: new Date(),
      });
    },
    onSuccess: () => {
      // Invalidate the employees query to refetch the list after adding
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing employee in Firestore.
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Employee>({
    mutationFn: async (employeeToUpdate) => {
      const employeeDocRef = doc(db, "employees", employeeToUpdate.id);
      // Update only the fields that are meant to be editable via this mutation
      await updateDoc(employeeDocRef, {
        name: employeeToUpdate.name,
        department: employeeToUpdate.department,
        // Note: Shift stats are typically updated via shift assignments,
        // not directly edited here. Adjust if your requirements differ.
        updatedAt: new Date(), // Update timestamp
      });
    },
    onSuccess: () => {
      // Invalidate the employees query to refetch the list after updating
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
      // Optionally, you could update the cache more granularly here
      // queryClient.setQueryData(EMPLOYEE_QUERY_KEY, (oldData) =>
      //   oldData?.map(emp => emp.id === variables.id ? variables : emp)
      // );
    },
  });
}

/**
 * Hook to delete an employee from Firestore.
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (employeeId) => {
      const employeeDocRef = doc(db, "employees", employeeId);
      await deleteDoc(employeeDocRef);
    },
    onSuccess: () => {
      // Invalidate the employees query to refetch the list after deleting
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_QUERY_KEY });
    },
  });
}

// --- Hooks for Shift Data (Example - you'll need to build these out) ---

// Define query keys for shifts (e.g., by week, by employee)
const SHIFTS_QUERY_KEY = ['shifts'];

/**
 * Example hook to fetch shifts for a specific week.
 * You would likely need more complex queries here.
 */
export function useWeeklyShifts(weekId: string) {
  return useQuery({
    queryKey: [SHIFTS_QUERY_KEY, weekId],
    queryFn: async () => {
      // Implement fetching shifts from the 'shifts' collection for the given weekId
      // Example: const querySnapshot = await getDocs(collection(db, "shifts"), where("weekId", "==", weekId));
      // return querySnapshot.docs.map(doc => doc.data());
      console.warn("useWeeklyShifts hook is not fully implemented.");
      return []; // Placeholder
    },
    enabled: !!weekId, // Only run the query if weekId is provided
  });
}

// You would add similar hooks for adding, updating, and deleting shifts
// using useMutation and invalidating the relevant SHIFTS_QUERY_KEY.