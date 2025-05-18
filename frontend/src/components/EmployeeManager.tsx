import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';
import { db } from '../utils/firebase.config'; // Import Firestore instance
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'; // Import Firestore functions
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeNameInput, setEmployeeNameInput] = useState('');
  const [dialogError, setDialogError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const employeesCollectionRef = collection(db, "employees");
      const querySnapshot = await getDocs(employeesCollectionRef);
      const fetchedEmployees: Employee[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Employee', // Default if name is missing
          total_shifts_assigned: data.total_shifts_assigned || 0,
          total_day_shifts_assigned: data.total_day_shifts_assigned || 0,
          total_night_shifts_assigned: data.total_night_shifts_assigned || 0,
        };
      });
      setEmployees(fetchedEmployees);
    } catch (e: any) {
      console.error("Failed to fetch employees:", e);
      setError(`Failed to load employees from Firestore: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenAddDialog = () => {
    setEditingEmployee(null);
    setEmployeeNameInput('');
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeNameInput(employee.name);
    setDialogError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setEmployeeNameInput('');
    setDialogError(null);
  };

  const handleSaveEmployee = async () => {
    if (!employeeNameInput.trim()) {
      setDialogError("Employee name cannot be empty.");
      return;
    }
    setDialogError(null);

    try {
      if (editingEmployee) {
        // Update existing employee
        const employeeDocRef = doc(db, "employees", editingEmployee.id);
        await updateDoc(employeeDocRef, {
          name: employeeNameInput,
          // Note: We are only updating the name here.
          // If other fields like shift counts are managed elsewhere or calculated,
          // this is fine. If they are meant to be directly editable or reset,
          // you might need to adjust this.
        });
      } else {
        // Add new employee
        // For a new employee, we'll initialize shift counts to 0.
        await addDoc(collection(db, "employees"), {
          name: employeeNameInput,
          total_shifts_assigned: 0,
          total_day_shifts_assigned: 0,
          total_night_shifts_assigned: 0,
        });
      }
      await fetchEmployees(); // Refresh the list
      handleCloseDialog();
      props.onEmployeeChange(); // Notify parent
    } catch (e: any) {
      console.error("Failed to save employee:", e);
      setDialogError(`Failed to save employee to Firestore: ${e.message}`);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
        return;
    }
    try {
      const employeeDocRef = doc(db, "employees", employeeId);
      await deleteDoc(employeeDocRef);
      await fetchEmployees(); // Refresh the list
      props.onEmployeeChange(); // Notify parent
    } catch (e: any) {
      console.error("Failed to delete employee:", e);
      setError(`Failed to delete employee: ${e.message}`); // Show error in main area or a snackbar
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

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

      <TableContainer component={Paper} elevation={0}> {/* Use Paper for container */}
        <Table size="small" aria-label="employee table">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
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
                <TableCell align="right">{employee.total_shifts_assigned}</TableCell>
                <TableCell align="right">{employee.total_day_shifts_assigned}</TableCell>
                <TableCell align="right">{employee.total_night_shifts_assigned}</TableCell>
                <TableCell align="right">
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditDialog(employee)} sx={{marginRight: 1}}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteEmployee(employee.id)}>
                  <DeleteIcon />
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
          <DialogContentText sx={{marginBottom: 2}}>
            Please enter the name for the employee.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Employee Name"
            type="text"
            fullWidth
            variant="standard"
            value={employeeNameInput}
            onChange={(e) => setEmployeeNameInput(e.target.value)}
            error={!!dialogError}
            helperText={dialogError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveEmployee}>{editingEmployee ? 'Save Changes' : 'Add Employee'}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmployeeManager;