import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { Box, Button, CircularProgress, Typography } from '@mui/material'; // Import MUI components
import EmployeeManager from './components/EmployeeManager';
import PreferenceGridAndCsvLoader from './components/PreferenceGridAndCsvLoader';
import ProposedScheduleDisplay from './components/ProposedScheduleDisplay';
import DashboardLayout from './components/DashboardLayout'; // Import the DashboardLayout
import type { Employee, EmployeePreferences, ScheduleGenerationResponse } from './types'; // Ensure Employee type is imported

const API_BASE_URL = ''; // Assuming Flask serves from root, same as before

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(true);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<EmployeePreferences>({});

  // State for schedule generation
  const [scheduleLoading, setScheduleLoading] = useState<boolean>(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null); // For success/info messages
  const [proposedSchedule, setProposedSchedule] = useState<Record<string, string[]> | null>(null);

  // Function to fetch employees
  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    setEmployeeError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) { // Ensure it's an array
        setEmployees(data as Employee[]);
      } else {
        console.error("Fetched employees data is not an array:", data);
        setEmployees([]); // Default to empty array if data is not as expected
        throw new Error("Received invalid employee data format from server.");
      }
    } catch (e: any) {
      console.error("Failed to fetch employees:", e);
      setEmployeeError(`Failed to load employees: ${e.message}`);
      setEmployees([]); // Fallback to empty array on any error during fetch
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchEmployees(); // Fetch employees when the app mounts
  }, []);

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

    try {
      const payload = {
        preferences: preferences,
        employees: employees,
      };
      // console.log("Sending to /api/generate_schedule:", payload);

      const response = await fetch(`${API_BASE_URL}/api/generate_schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await response.json() as ScheduleGenerationResponse; // Use the new type here
      } catch (jsonError) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}. Server response was not valid JSON.`);
        }
        throw new Error("Failed to parse server response as JSON, though request seemed successful.");
      }

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }

      // Validate the structure of the successful response
      if (data && typeof data.proposed_schedule_with_ids === 'object' && Array.isArray(data.updated_employees)) {
        setProposedSchedule(data.proposed_schedule_with_ids);
        setEmployees(data.updated_employees); // Update employees with new shift counts
        setScheduleMessage(data.message || "Schedule generated successfully!");
        // console.log("Schedule proposed:", data.proposed_schedule_with_ids);
      } else {
        console.error("Unexpected data structure from /api/generate_schedule:", data);
        throw new Error("Received invalid data structure from server after generating schedule.");
      }
    } catch (e: any) {
      console.error("Failed to generate schedule:", e);
      setScheduleError(e.message || "An unknown error occurred while generating the schedule.");
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
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
                    disabled={employees.length === 0 || loadingEmployees || scheduleLoading}
                  >
                    {scheduleLoading ? <CircularProgress size={24} sx={{ color: 'white', mr:1 }} /> : null}
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
            element={<EmployeeManager onEmployeeChange={fetchEmployees} />} 
          />
          <Route 
            path="preferences" 
            element={
              <PreferenceGridAndCsvLoader
                employees={employees}
                preferences={preferences}
                onPreferencesUpdate={handlePreferencesUpdate}
                loadingEmployees={loadingEmployees}
                onScheduleGenerateRequest={handleGenerateSchedule}
                employeeError={employeeError}
              />
            } 
          />
          {/* You can add more routes here as needed */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
