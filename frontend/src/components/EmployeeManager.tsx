import React, { useState, useMemo } from 'react';
import type { Employee } from '../types'; // Assuming Employee type is in ../types
import { useEmployees, useAddEmployee, useUpdateEmployee, useDeleteEmployee } from '../data/firestoreHooks'; // Import custom hooks
import {
  Button,
  CircularProgress,
  Paper,
  Typography,
  Table, // Added
  TableBody, // Added
  TableCell, // Added
  TableContainer, // Added
  TableHead, // Added
  TableRow, // Added
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface EmployeeManagerProps {
  onEmployeeChange: () => void; // Callback to notify parent when employees change
}

const EmployeeManager: React.FC<EmployeeManagerProps> = (props) => {
  // Use custom hooks for Firestore operations
  const { data: fetchedEmployees, isLoading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployees();
  const { mutate: addEmployeeMutate, isPending: isAddingEmployee, error: addEmployeeError } = useAddEmployee();
  const { mutate: updateEmployeeMutate, isPending: isUpdatingEmployee, error: updateEmployeeError } = useUpdateEmployee();
  const { mutate: deleteEmployeeMutate, isPending: isDeletingEmployee, error: deleteEmployeeError } = useDeleteEmployee();

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeNameInput, setEmployeeNameInput] = useState('');
  const [employeeDepartmentInput, setEmployeeDepartmentInput] = useState(''); // New state for department
  const [dialogFormError, setDialogFormError] = useState<string | null>(null); // For dialog-specific form errors

  const employees = useMemo(() => fetchedEmployees || [], [fetchedEmployees]);

  const handleOpenAddDialog = () => {
    setEditingEmployee(null);
    setEmployeeNameInput('');
    setEmployeeDepartmentInput('');
    setDialogFormError(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeNameInput(employee.name);
    setEmployeeDepartmentInput(employee.department || ''); // Set department, default to empty if undefined
    setDialogFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setEmployeeNameInput('');
    setEmployeeDepartmentInput('');
    setDialogFormError(null);
  };

  const handleSaveEmployee = async () => {
    if (!employeeNameInput.trim()) {
      setDialogFormError("Employee name cannot be empty.");
      return;
    }
    setDialogFormError(null);

    const commonSuccessHandler = () => {
      refetchEmployees();
      handleCloseDialog();
      props.onEmployeeChange();
    };

    const commonErrorHandler = (e: Error) => {
      console.error("Failed to save employee:", e);
      setDialogFormError(`Failed to save employee: ${e.message}`);
    };

    if (editingEmployee) {
      // Update existing employee
      // The useUpdateEmployee hook expects the full Employee object.
      // We only want to update name and department. The hook itself handles this.
      const updatedEmployeeData: Employee = {
        ...editingEmployee, // Spread existing fields to satisfy the type
        name: employeeNameInput,
        department: employeeDepartmentInput.trim() || 'N/A',
      };
      updateEmployeeMutate(updatedEmployeeData, {
        onSuccess: commonSuccessHandler,
        onError: commonErrorHandler,
      });
    } else {
      // Add new employee
      // The useAddEmployee hook expects Omit<Employee, 'id'>.
      // The hook internally initializes stats, createdAt, updatedAt.
      // We provide the fields required by Omit<Employee, 'id'>.
      // total_shifts_assigned etc. are part of Employee type, so we provide them as 0.
      // The hook's `stats` object will be the source of truth for these values on read.
      const newEmployeeData: Omit<Employee, 'id'> = {
        name: employeeNameInput,
        department: employeeDepartmentInput.trim() || 'N/A',
        total_shifts_assigned: 0,
        total_day_shifts_assigned: 0,
        total_night_shifts_assigned: 0,
        // Assuming weekend_shifts_assigned is also part of Employee type
        // If not, it should be removed or the type updated.
        // For now, let's assume it's there based on firestoreHooks.ts
        weekend_shifts_assigned: 0,
      };
      addEmployeeMutate(newEmployeeData, {
        onSuccess: commonSuccessHandler,
        onError: commonErrorHandler,
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      return;
    }
    deleteEmployeeMutate(employeeId, {
      onSuccess: () => {
        refetchEmployees();
        props.onEmployeeChange();
      },
      onError: (e: Error) => {
        console.error("Failed to delete employee:", e);
        // Display this error more prominently if needed, e.g., using a snackbar
        // For now, using dialogFormError or a general error display
        setDialogFormError(`Failed to delete employee: ${e.message}`);
      },
    });
  };

  if (employeesLoading) return <CircularProgress />;
  if (employeesError) return <Typography color="error" sx={{ mt: 2 }}>{`Error fetching employees: ${employeesError.message}`}</Typography>;
  // Display mutation errors if they occur outside the dialog context (e.g., delete error if dialog is closed)
  const generalMutationError = deleteEmployeeError; // Add other general mutation errors if applicable

  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom component="div">
          Employee List
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpenAddDialog}>
          Add Employee
        </Button>
      </Box>
      {generalMutationError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {`Error: ${generalMutationError.message}`}
        </Typography>
      )}

      <TableContainer component={Paper} elevation={0}> {/* Use Paper for container */}
        <Table size="small" aria-label="employee table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell> {/* New Column */}
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Shifts</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Day Shifts</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Night Shifts</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell> {/* Column for buttons */}
            </TableRow>
          </TableHead>
          <TableBody>
        {employees.map((employee) => (
              <TableRow
                key={employee.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {employee.name}
                </TableCell>
                <TableCell>{employee.department || 'N/A'}</TableCell> {/* Display Department */}
                <TableCell align="right">{employee.total_shifts_assigned}</TableCell>
                <TableCell align="right">{employee.total_day_shifts_assigned}</TableCell>
                <TableCell align="right">{employee.total_night_shifts_assigned}</TableCell>
                <TableCell align="right">
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(employee)} sx={{marginRight: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEmployee(employee.id)} disabled={isDeletingEmployee}>
                  {isDeletingEmployee && editingEmployee?.id === employee.id ? <CircularProgress size={24} /> : <DeleteIcon />}
                </IconButton>
              </>
                </TableCell>
              </TableRow>
        ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ marginBottom: 1 }}>
            Please enter the details for the employee.
          </DialogContentText>
          <TextField
            autoFocus={!editingEmployee} // Autofocus name only when adding
            margin="dense"
            id="name"
            label="Employee Name"
            type="text"
            fullWidth
            variant="standard"
            value={employeeNameInput}
            onChange={(e) => setEmployeeNameInput(e.target.value)}
            error={!!dialogFormError && employeeNameInput.trim() === ''} // Show error only if name is empty
            helperText={
              (!!dialogFormError && employeeNameInput.trim() === '' ? dialogFormError : '') ||
              addEmployeeError?.message ||
              updateEmployeeError?.message
            }
          />
          <TextField
            margin="dense"
            id="department"
            label="Department"
            type="text"
            fullWidth
            variant="standard"
            value={employeeDepartmentInput}
            onChange={(e) => setEmployeeDepartmentInput(e.target.value)}
            // No specific error for department for now, but can be added
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEmployee} disabled={isAddingEmployee || isUpdatingEmployee}>
            {isAddingEmployee || isUpdatingEmployee ? <CircularProgress size={24} /> : (editingEmployee ? 'Save Changes' : 'Add Employee')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmployeeManager;