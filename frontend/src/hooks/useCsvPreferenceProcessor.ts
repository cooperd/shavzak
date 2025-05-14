import { useState } from 'react';
import type { Employee, EmployeePreferences } from '../types';
import { DAYS_OF_WEEK, SHIFT_TYPES } from '../types';

interface UseCsvPreferenceProcessorOptions {
  employees: Employee[];
  currentPreferences: EmployeePreferences;
  onSuccess: (
    updatedPreferences: EmployeePreferences,
    message: string,
    warnings: string[],
    preferencesApplied: boolean
  ) => void;
  // Error state will be managed and returned by the hook
}

export const useCsvPreferenceProcessor = ({
  employees,
  currentPreferences,
  onSuccess,
}: UseCsvPreferenceProcessorOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  // Message state can be handled by the component based on onSuccess callback's message

  const parseAndApplyCsv = (csvString: string) => {
    const lines = csvString.trim().split(/\r\n|\n/);

    if (lines.length < 2) {
      setProcessingError("CSV file must have a header row and at least one data row.");
      return null;
    }

    const headerCells = lines[0].trim().split(',').map(h => h.trim());
    if (headerCells[0].toLowerCase() !== "employee") {
      setProcessingError(`CSV header mismatch. Expected first column to be 'Employee'. Got '${headerCells[0]}'.`);
      return null;
    }

    const employeeNameToIdMap = employees.reduce((acc, emp) => {
      acc[emp.name.toLowerCase()] = emp.id;
      return acc;
    }, {} as Record<string, string>);

    const csvColumnToShiftSlotMap: Record<number, string> = {};
    const validShiftSlots = new Set<string>();
    DAYS_OF_WEEK.forEach(day => SHIFT_TYPES.forEach(type => validShiftSlots.add(`${day}_${type}`)));

    for (let i = 1; i < headerCells.length; i++) {
      const shiftSlotFromCsv = headerCells[i];
      if (validShiftSlots.has(shiftSlotFromCsv)) {
        csvColumnToShiftSlotMap[i] = shiftSlotFromCsv;
      } else {
        console.warn(`Warning: CSV header '${shiftSlotFromCsv}' is not a recognized shift slot and will be ignored.`);
      }
    }

    const updatedPreferences: EmployeePreferences = JSON.parse(JSON.stringify(currentPreferences));
    let preferencesAppliedCount = 0;
    const warnings: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const dataCells = lines[i].trim().split(',').map(c => c.trim());
      if (dataCells.length === 1 && dataCells[0] === "") continue;

      if (dataCells.length !== headerCells.length) {
        warnings.push(`Row ${i + 1} in CSV has ${dataCells.length} cells, expected ${headerCells.length}. Skipping row.`);
        continue;
      }

      const employeeNameFromCsv = dataCells[0];
      const employeeId = employeeNameToIdMap[employeeNameFromCsv.toLowerCase()];

      if (!employeeId) {
        warnings.push(`Employee '${employeeNameFromCsv}' from CSV (row ${i + 1}) not found. Skipping their preferences.`);
        continue;
      }

      if (!updatedPreferences[employeeId]) {
        updatedPreferences[employeeId] = {};
        DAYS_OF_WEEK.forEach(day => SHIFT_TYPES.forEach(type => {
          updatedPreferences[employeeId][`${day}_${type}`] = "";
        }));
      }

      for (let j = 1; j < dataCells.length; j++) {
        const shiftSlot = csvColumnToShiftSlotMap[j];
        if (shiftSlot) {
          const preferenceValue = dataCells[j];
          if (["0", "1", ""].includes(preferenceValue)) {
            updatedPreferences[employeeId][shiftSlot] = preferenceValue;
            if (preferenceValue !== "") preferencesAppliedCount++; // Count if not empty
          } else {
            warnings.push(`Invalid value '${preferenceValue}' for ${employeeNameFromCsv} in ${shiftSlot}. Setting to empty.`);
            updatedPreferences[employeeId][shiftSlot] = "";
          }
        }
      }
    }
    return { updatedPreferences, preferencesAppliedCount, warnings };
  };

  const processCsvFile = (file: File) => {
    if (employees.length === 0) {
      setProcessingError("Employee data not loaded. Cannot process CSV.");
      return;
    }
    setIsProcessing(true);
    setProcessingError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setIsProcessing(false);
      const csvString = event.target?.result as string;
      const result = parseAndApplyCsv(csvString);
      if (result) {
        const { updatedPreferences, preferencesAppliedCount, warnings } = result;
        const message = preferencesAppliedCount > 0 ? `Preferences successfully loaded. ${warnings.length > 0 ? `${warnings.length} warnings.` : ''}` : `CSV processed. ${warnings.length > 0 ? `${warnings.length} warnings.` : ''} No new preferences applied.`;
        onSuccess(updatedPreferences, message, warnings, preferencesAppliedCount > 0);
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setProcessingError("Error reading the CSV file.");
    };
    reader.readAsText(file);
  };

  return { processCsvFile, isProcessing, processingError };
};