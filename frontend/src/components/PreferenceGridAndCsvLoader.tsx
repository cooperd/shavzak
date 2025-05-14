// /Users/dvircooper/projects/shavzak/frontend/src/components/PreferenceGridAndCsvLoader.tsx
import React, { useState, useEffect } from 'react';
import type { Employee, EmployeePreferences} from '../types';
import { DAYS_OF_WEEK, SHIFT_TYPES } from '../types';
import {
  Paper,
  Typography,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  CircularProgress,
} from '@mui/material';
import DownloadCsvTemplateButton from './DownloadCsvTemplateButton';
import CsvImportButton from './CsvImportButton'; // Import the new component
import { useCsvPreferenceProcessor } from '../hooks/useCsvPreferenceProcessor'; // Import the hook

interface PreferenceGridAndCsvLoaderProps {
  employees: Employee[];
  preferences: EmployeePreferences; // Preferences state managed by parent
  onPreferencesUpdate: (preferences: EmployeePreferences) => void; // Callback to update parent state
  loadingEmployees: boolean; // Prop to indicate if employee data is loading
  onScheduleGenerateRequest?: () => void; // Callback to request schedule generation
  employeeError: string | null; // Prop to indicate if there was an error loading employees
}

const PreferenceGridAndCsvLoader: React.FC<PreferenceGridAndCsvLoaderProps> = ({
  employees,
  preferences,
  onPreferencesUpdate,
  loadingEmployees,
  onScheduleGenerateRequest,
  employeeError,
}) => {
  // const [csvLoading, setCsvLoading] = useState(false); // Will be replaced by hook's isProcessing
  // const [csvError, setCsvError] = useState<string | null>(null); // Will be replaced by hook's processingError
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  const handleCsvProcessingSuccess = (
    updatedPreferences: EmployeePreferences,
    message: string,
    warnings: string[], // We can log these or display them more prominently if needed
    preferencesWereApplied: boolean
  ) => {
    onPreferencesUpdate(updatedPreferences);
    setCsvMessage(message + (warnings.length > 0 ? ` (${warnings.join(', ')})` : ''));
    if (preferencesWereApplied && onScheduleGenerateRequest) {
      onScheduleGenerateRequest();
    }
  };


  // Effect to initialize preferences when employees load or change
  // This ensures the grid structure matches the current employees
  useEffect(() => {
    if (employees.length > 0 && Object.keys(preferences).length === 0) {
      const initialPreferences: EmployeePreferences = {};
      employees.forEach(emp => {
        initialPreferences[emp.id] = {};
        DAYS_OF_WEEK.forEach(day => {
          SHIFT_TYPES.forEach(type => {
            initialPreferences[emp.id][`${day}_${type}`] = ""; // Default to empty (available)
          });
        });
      });
      onPreferencesUpdate(initialPreferences);
    } else if (employees.length === 0 && Object.keys(preferences).length > 0) {
        // Clear preferences if employees are removed
         onPreferencesUpdate({});
    }
  }, [employees, onPreferencesUpdate, preferences]); // Depend on employees, preferences, and onPreferencesUpdate

  const {
    processCsvFile,
    isProcessing: csvLoading, // Use the hook's state
    processingError: csvError, // Use the hook's state
  } = useCsvPreferenceProcessor({
    employees,
    currentPreferences: preferences,
    onSuccess: handleCsvProcessingSuccess,
  });

  // This function will be passed to CsvImportButton
  const handleCsvFileSelected = (file: File) => {
    setCsvMessage(null); // Clear previous messages before processing a new file
    processCsvFile(file);
  };

  const handlePreferenceChange = (employeeId: string, shiftSlot: string, value: string) => {
    const updatedPreferences = {
      ...preferences,
      [employeeId]: {
        ...preferences[employeeId],
        [shiftSlot]: value,
      },
    };
    onPreferencesUpdate(updatedPreferences); // Update parent state
  };

  const getShiftSlotLabel = (day: string, type: string) => `${day}_${type}`;

  if (loadingEmployees) {
      return <CircularProgress sx={{ marginTop: 2 }} />;
  }

  if (employeeError) {
      return <Typography color="error" sx={{ marginTop: 2 }}>{employeeError}</Typography>;
  }

  if (employees.length === 0) {
       return <Typography sx={{ marginTop: 2 }}>No employees available. Please add employees first.</Typography>;
  }


  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
      <Typography variant="h5" gutterBottom>
        Weekly Preferences
      </Typography>

      <Box sx={{ marginBottom: 2 }}>
        <Typography variant="body2" gutterBottom>
          CSV Format: First column "Employee" (matching names). Subsequent columns "Day_ShiftType" (e.g., "Sunday_Day"). Values: "1" (unavailable), "0" (cannot work/strong preference against), empty (available).
        </Typography>
        <CsvImportButton
          onFileSelected={handleCsvFileSelected}
          isLoading={csvLoading}
          isDisabled={loadingEmployees}
        />
        <DownloadCsvTemplateButton employees={employees} /> {/* Use the new component */}
        {csvError && <Typography color="error" sx={{ marginTop: 1 }}>{csvError}</Typography>}
        {csvMessage && <Typography color="success" sx={{ marginTop: 1 }}>{csvMessage}</Typography>}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
              {DAYS_OF_WEEK.map(day => (
                <React.Fragment key={day}>
                  {SHIFT_TYPES.map(type => (
                    <TableCell key={`${day}-${type}`} align="center" sx={{ fontWeight: 'bold' }}>
                      {day}<br/>{type}
                    </TableCell>
                  ))}
                </React.Fragment>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map(employee => (
              <TableRow key={employee.id}>
                <TableCell sx={{ fontWeight: 'bold' }}>{employee.name}</TableCell>
                {DAYS_OF_WEEK.map(day => (
                  <React.Fragment key={`${employee.id}-${day}`}>
                    {SHIFT_TYPES.map(type => {
                      const shiftSlot = getShiftSlotLabel(day, type);
                      const preferenceValue = preferences[employee.id]?.[shiftSlot] ?? ""; // Use ?? "" for safety

                      return (
                        <TableCell key={`${employee.id}-${shiftSlot}`} align="center">
                          <TextField
                            variant="outlined"
                            size="small"
                            value={preferenceValue}
                            onChange={(e) => handlePreferenceChange(employee.id, shiftSlot, e.target.value)}
                            inputProps={{
                              maxLength: 1, // Limit input to 1 character
                              style: { textAlign: 'center' }
                            }}
                            sx={{ width: 40 }} // Adjust width as needed
                          />
                        </TableCell>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default PreferenceGridAndCsvLoader;