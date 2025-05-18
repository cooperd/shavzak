import type { Employee, EmployeePreferences } from '../types'; // Use frontend types

// This will be the return type of our main function
export interface FrontendScheduleOutput {
  proposed_schedule_with_ids: Record<string, string[]>; // employee IDs
  // proposed_schedule_with_names: Record<string, string>; // We can reconstruct this in App.tsx if needed
  unfilled_shifts: string[];
  employee_shifts_this_week: Record<string, number>; // employeeId -> count of shifts this week
  // We'll also count day/night shifts per employee for this week to help update totals
  employee_day_shifts_this_week: Record<string, number>;
  employee_night_shifts_this_week: Record<string, number>;
}

function getPreferenceScore(prefVal: string | undefined): number {
  if (prefVal === "1") return 0; // Most preferred
  if (prefVal === "" || prefVal === undefined) return 1; // Available (less preferred than "1")
  return Infinity; // Effectively excludes "0" (cannot work) or other invalid values
}

function isNotConsecutive(
  employeeId: string,
  targetShiftSlot: string,
  proposedScheduleWithIds: Record<string, string[]>,
  daysOfWeekOrdered: string[]
): boolean {
  const [targetDay, targetType] = targetShiftSlot.split('_');

  if (targetType === "Day") {
    const currentDayIndex = daysOfWeekOrdered.indexOf(targetDay);
    if (currentDayIndex > 0) { // If it's not the first day of the week
      const previousDay = daysOfWeekOrdered[currentDayIndex - 1];
      const previousNightShift = `${previousDay}_Night`;
      if (proposedScheduleWithIds[previousNightShift]?.includes(employeeId)) {
        return false; // Cannot work Day after previous Night
      }
    }
  } else if (targetType === "Night") {
    const sameDayDayShift = `${targetDay}_Day`;
    if (proposedScheduleWithIds[sameDayDayShift]?.includes(employeeId)) {
      return false; // Cannot work Night after same day Day
    }
  }
  return true; // It's not a consecutive shift violation
}

export function createWeeklyScheduleFrontend(
  employeePreferences: EmployeePreferences, // Use frontend type
  employeesDict: Record<string, Employee>, // Use frontend type
  daysOfWeek: string[],
  shiftTypes: string[],
  maxShiftsPerWeek: number
): FrontendScheduleOutput {
  const shiftsToFill: string[] = [];
  daysOfWeek.forEach(day => {
    shiftTypes.forEach(stype => {
      shiftsToFill.push(`${day}_${stype}`);
    });
  });

  const proposed_schedule_with_ids: Record<string, string[]> = {};
  shiftsToFill.forEach(shift => {
    proposed_schedule_with_ids[shift] = [];
  });

  const employee_shifts_this_week: Record<string, number> = {};
  const employee_day_shifts_this_week: Record<string, number> = {};
  const employee_night_shifts_this_week: Record<string, number> = {};

  Object.keys(employeesDict).forEach(empId => {
    employee_shifts_this_week[empId] = 0;
    employee_day_shifts_this_week[empId] = 0;
    employee_night_shifts_this_week[empId] = 0;
  });

  const shiftSpecificPreferences: Record<string, Record<string, string>> = {};
  shiftsToFill.forEach(shift => shiftSpecificPreferences[shift] = {});

  for (const empId in employeePreferences) {
    if (employeesDict[empId]) {
      for (const shiftSlot in employeePreferences[empId]) {
        if (shiftSpecificPreferences[shiftSlot]) {
            shiftSpecificPreferences[shiftSlot][empId] = employeePreferences[empId][shiftSlot];
        }
      }
    }
  }

  for (const shiftSlot of shiftsToFill) {
    while (proposed_schedule_with_ids[shiftSlot].length < 2) { // Assuming 2 spots per shift
      const eligibleCandidates: Employee[] = Object.values(employeesDict)
        .filter(empDetails => {
          if (proposed_schedule_with_ids[shiftSlot].includes(empDetails.id)) return false;
          const empPrefForShift = shiftSpecificPreferences[shiftSlot]?.[empDetails.id];
          if (empPrefForShift === "0") return false;
          if ((employee_shifts_this_week[empDetails.id] || 0) >= maxShiftsPerWeek) return false;
          if (!isNotConsecutive(empDetails.id, shiftSlot, proposed_schedule_with_ids, daysOfWeek)) return false;
          return true;
        });

      if (eligibleCandidates.length === 0) break;

      eligibleCandidates.sort((empA, empB) => {
        const shiftsA = employee_shifts_this_week[empA.id] || 0;
        const shiftsB = employee_shifts_this_week[empB.id] || 0;
        if (shiftsA !== shiftsB) return shiftsA - shiftsB;

        const totalShiftsA = empA.total_shifts_assigned || 0;
        const totalShiftsB = empB.total_shifts_assigned || 0;
        if (totalShiftsA !== totalShiftsB) return totalShiftsA - totalShiftsB;

        const prefScoreA = getPreferenceScore(shiftSpecificPreferences[shiftSlot]?.[empA.id]);
        const prefScoreB = getPreferenceScore(shiftSpecificPreferences[shiftSlot]?.[empB.id]);
        if (prefScoreA !== prefScoreB) return prefScoreA - prefScoreB;

        const relevantTotalA = shiftSlot.includes("_Day") ? (empA.total_day_shifts_assigned || 0) : (empA.total_night_shifts_assigned || 0);
        const relevantTotalB = shiftSlot.includes("_Day") ? (empB.total_day_shifts_assigned || 0) : (empB.total_night_shifts_assigned || 0);
        if (relevantTotalA !== relevantTotalB) return relevantTotalA - relevantTotalB;

        return empA.id.localeCompare(empB.id);
      });

      const chosenEmp = eligibleCandidates[0];
      proposed_schedule_with_ids[shiftSlot].push(chosenEmp.id);
      employee_shifts_this_week[chosenEmp.id] = (employee_shifts_this_week[chosenEmp.id] || 0) + 1;
      if (shiftSlot.includes("_Day")) {
        employee_day_shifts_this_week[chosenEmp.id] = (employee_day_shifts_this_week[chosenEmp.id] || 0) + 1;
      } else if (shiftSlot.includes("_Night")) {
        employee_night_shifts_this_week[chosenEmp.id] = (employee_night_shifts_this_week[chosenEmp.id] || 0) + 1;
      }
    }
  }

  const unfilled_shifts = shiftsToFill.filter(shift => proposed_schedule_with_ids[shift].length < 2);

  return {
    proposed_schedule_with_ids,
    unfilled_shifts,
    employee_shifts_this_week,
    employee_day_shifts_this_week,
    employee_night_shifts_this_week,
  };
}