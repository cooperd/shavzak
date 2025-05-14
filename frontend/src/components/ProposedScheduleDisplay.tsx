import React from 'react';
import type { Employee, EmployeePreferences } from '../types';
import { DAYS_OF_WEEK, SHIFT_TYPES } from '../types';
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

interface ProposedScheduleDisplayProps {
  proposedSchedule: Record<string, string[]>; // { shift_slot: [employee_id1, employee_id2] }
  employees: Employee[];
  preferences: EmployeePreferences; // Pass original preferences
}

const ProposedScheduleDisplay: React.FC<ProposedScheduleDisplayProps> = ({
  proposedSchedule,
  employees,
  preferences,
}) => {
  if (!proposedSchedule || Object.keys(proposedSchedule).length === 0) {
    return null; // Don't render anything if there's no schedule
  }

  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 3 }}>
      <Typography variant="h5" gutterBottom>
        Proposed Schedule & Preferences
      </Typography>
      <Typography variant="caption" display="block" gutterBottom>
        Grid shows: [Preference] / "2" if assigned. (e.g., "1 / 2" means preferred not to, but assigned)
      </Typography>
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
                      const shiftSlot = `${day}_${type}`;
                      const originalPreference = preferences[employee.id]?.[shiftSlot] ?? "";
                      const isAssigned = proposedSchedule[shiftSlot]?.includes(employee.id);
                      
                      let displayValue = originalPreference || "-"; // Show '-' if preference was empty
                      if (isAssigned) {
                        displayValue += " / 2";
                      }

                      return (
                        <TableCell 
                          key={`${employee.id}-${shiftSlot}`} 
                          align="center"
                          sx={{ backgroundColor: isAssigned ? 'lightgreen' : 'inherit' }} // Highlight assigned cells
                        >
                          {displayValue}
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

export default ProposedScheduleDisplay;