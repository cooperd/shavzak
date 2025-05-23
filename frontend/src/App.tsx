import { useState, useEffect } from 'react';
import { useSession, useDescope } from '@descope/react-sdk';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEmployees } from './data/firestoreHooks'; // Import the useEmployees hook
import './App.css';
import { Box, Button, CircularProgress, Typography } from '@mui/material'; // Import MUI components
import EmployeeManager from './components/EmployeeManager';
import PreferenceGridAndCsvLoader from './components/PreferenceGridAndCsvLoader';
import ProposedScheduleDisplay from './components/ProposedScheduleDisplay';
import DashboardLayout from './components/DashboardLayout'; // Import the DashboardLayout
import AuthPage from './components/AuthPage'; // Import the AuthPage
import type { Employee, EmployeePreferences } from './types'; // Ensure Employee type is imported
import { createWeeklyScheduleFrontend, type FrontendScheduleOutput } from './utils/scheduleGenerator'; // Import frontend scheduler

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHIFT_TYPES = ["Day", "Night"];
const MAX_SHIFTS_PER_WEEK = 5; // Example: Make this configurable if needed
function App() {
  const { isAuthenticated, isSessionLoading: isAuthLoading } = useSession(); // Renamed to avoid conflict
  const { logout } = useDescope();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<EmployeePreferences>({});

  // State for schedule generation
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null); // For success/info messages
  const [proposedSchedule, setProposedSchedule] = useState<Record<string, string[]> | null>(null);

  // Use the custom hook for fetching employees
  const { data: fetchedEmployeesData, isLoading: employeesDataLoading, error: employeesDataError, refetch: refetchEmployeesData } = useEmployees();

  useEffect(() => {
    if (isAuthenticated) {
      if (fetchedEmployeesData) {
        setEmployees(fetchedEmployeesData);
        setLoadingEmployees(false);
        setEmployeeError(null);
      } else if (employeesDataError) {
        setEmployeeError(`Failed to load employees: ${employeesDataError.message}`);
        setLoadingEmployees(false);
        setEmployees([]);
      } else if (employeesDataLoading) {
        setLoadingEmployees(true);
      }
    }
  }, [isAuthenticated, fetchedEmployeesData, employeesDataLoading, employeesDataError]);

  const handlePreferencesUpdate = (newPreferences: EmployeePreferences) => {
    setPreferences(newPreferences);
  };

  const handleGenerateSchedule = async () => {
    // Ensure employees state is an array and not empty
    if (!Array.isArray(employees) || employees.length === 0) {
      setScheduleError("Cannot generate schedule: No employees loaded or employee data is invalid.");
      setScheduleMessage(null);
      return;
    }

    setScheduleLoading(true);
    setScheduleError(null);
    setScheduleMessage(null);
    setProposedSchedule(null); // Clear previous schedule

    // Convert employees array to dictionary for the scheduler
    const employeesDict: Record<string, Employee> = employees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {} as Record<string, Employee>);

    try {
      // Call the local schedule generation function
      const scheduleOutput: FrontendScheduleOutput = createWeeklyScheduleFrontend(
        preferences,
        employeesDict,
        DAYS_OF_WEEK,
        SHIFT_TYPES,
        MAX_SHIFTS_PER_WEEK
      );

      // Update employee shift counts
      const updatedEmployees = employees.map(emp => {
        const dayShiftsThisWeek = scheduleOutput.employee_day_shifts_this_week[emp.id] || 0;
        const nightShiftsThisWeek = scheduleOutput.employee_night_shifts_this_week[emp.id] || 0;
        const totalShiftsThisWeek = dayShiftsThisWeek + nightShiftsThisWeek; // or scheduleOutput.employee_shifts_this_week[emp.id]

        return {
          ...emp,
          total_shifts_assigned: (emp.total_shifts_assigned || 0) + totalShiftsThisWeek,
          total_day_shifts_assigned: (emp.total_day_shifts_assigned || 0) + dayShiftsThisWeek,
          total_night_shifts_assigned: (emp.total_night_shifts_assigned || 0) + nightShiftsThisWeek,
        };
      });

      setProposedSchedule(scheduleOutput.proposed_schedule_with_ids);
      setEmployees(updatedEmployees);

      let message = "Schedule generated successfully!";
      if (scheduleOutput.unfilled_shifts.length > 0) {
        message += ` However, ${scheduleOutput.unfilled_shifts.length} shift(s) could not be fully staffed: ${scheduleOutput.unfilled_shifts.join(', ')}.`;
      }
      setScheduleMessage(message);

    } catch (e: any) {
      console.error("Failed to generate schedule with frontend logic:", e);
      // Check if it's an error object with a message property
      if (e && typeof e.message === 'string') {
        setScheduleError(e.message);
      } else {
        // Fallback for other types of thrown errors
        setScheduleError("An unknown error occurred while generating the schedule with frontend logic.");
      }
    } finally {
      setScheduleLoading(false);
    }
  };

  if (isAuthLoading || (isAuthenticated && loadingEmployees)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }


  return (
    <BrowserRouter>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </>
        ) : (
          <Route path="/" element={<DashboardLayout onLogout={logout} />}> {/* Pass logout to DashboardLayout */}
            {/* Default route: Weekly Schedule & Preferences */}
            <Route
              index
              element={
                <>
                  {/* Moved Generate Schedule button and messages to the main view */}
                  <Box sx={{ marginBottom: 2, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleGenerateSchedule}
                      disabled={employees.length === 0 || loadingEmployees || scheduleLoading || !!employeeError}
                    >
                      {scheduleLoading ? <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} /> : null}
                      {scheduleLoading ? 'Generating...' : 'Generate Schedule'}
                    </Button>
                  </Box>
                  {scheduleError && <Typography color="error" align="center" sx={{ marginBottom: 2 }}>Error: {scheduleError}</Typography>}
                  {scheduleMessage && !scheduleError && <Typography color="success.main" align="center" sx={{ marginBottom: 2 }}>{scheduleMessage}</Typography>}
                  {proposedSchedule && Object.keys(proposedSchedule).length > 0 && !scheduleError && (
                    <ProposedScheduleDisplay
                      proposedSchedule={proposedSchedule}
                      employees={employees}
                      preferences={preferences}
                    />
                  )}
                  {!proposedSchedule && !scheduleLoading && !scheduleError && (
                    <Typography align="center" sx={{ marginTop: 2 }}>Click "Generate Schedule" to create a new weekly plan.</Typography>
                  )}
                </>
              }
            />
            <Route
              path="employees"
              element={<EmployeeManager onEmployeeChange={refetchEmployeesData} />}
            />
            <Route
              path="preferences"
              element={
                <PreferenceGridAndCsvLoader
                  employees={employees}
                  preferences={preferences}
                  onPreferencesUpdate={handlePreferencesUpdate}
                  loadingEmployees={loadingEmployees} // Keep using local loadingEmployees for this component
                  onScheduleGenerateRequest={handleGenerateSchedule}
                  employeeError={employeeError}
                />
              }
            />
            {/* You can add more routes here as needed */}
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  )
}

export default App
