import { Employee, EmployeePreferencesPayload } from './types'; // Assuming types.ts exists or define inline

interface ScheduleGeneratorOutput {
  proposed_schedule_with_ids: Record<string, string[]>;
  proposed_schedule_with_names: Record<string, string>;
  unfilled_shifts: string[];
  employee_shifts_this_week: Record<string, number>;
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

export function createWeeklySchedule(
  employeePreferencesRaw: EmployeePreferencesPayload,
  employeesDict: Record<string, Employee>,
  daysOfWeek: string[], // This should be the ordered list of days
  shiftTypes: string[],
  maxShiftsPerWeek: number
): ScheduleGeneratorOutput {
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
  Object.keys(employeesDict).forEach(empId => {
    employee_shifts_this_week[empId] = 0;
  });

  // Convert preferences to a more usable format: {shift_slot: {emp_id: preference_value}}
  const shiftSpecificPreferences: Record<string, Record<string, string>> = {};
  shiftsToFill.forEach(shift => shiftSpecificPreferences[shift] = {});

  for (const empId in employeePreferencesRaw) {
    if (employeesDict[empId]) { // Only consider known employees
      for (const shiftSlot in employeePreferencesRaw[empId]) {
        if (shiftSpecificPreferences[shiftSlot]) { // Ensure shiftSlot is valid
            shiftSpecificPreferences[shiftSlot][empId] = employeePreferencesRaw[empId][shiftSlot];
        }
      }
    }
  }

  // Assign shifts, trying to fill up to 2 spots per shift
  for (const shiftSlot of shiftsToFill) {
    while (proposed_schedule_with_ids[shiftSlot].length < 2) {
      const eligibleCandidates: Employee[] = [];

      for (const empId in employeesDict) {
        const empDetails = employeesDict[empId];

        // Rule 1: Employee not already assigned to this specific shift slot
        if (proposed_schedule_with_ids[shiftSlot].includes(empId)) {
          continue;
        }

        const empPrefForShift = shiftSpecificPreferences[shiftSlot]?.[empId];

        // Rule 2: Cannot work (preference "0")
        if (empPrefForShift === "0") {
          continue;
        }

        // Rule 3: Max shifts per week
        if ((employee_shifts_this_week[empId] || 0) >= maxShiftsPerWeek) {
          continue;
        }

        // Rule 4: Not consecutive
        if (!isNotConsecutive(empId, shiftSlot, proposed_schedule_with_ids, daysOfWeek)) {
          continue;
        }

        eligibleCandidates.push(empDetails);
      }

      if (eligibleCandidates.length === 0) {
        break; // No more eligible candidates for this slot in this iteration
      }

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

        return empA.id.localeCompare(empB.id); // Tie-breaking by ID
      });

      const chosenEmp = eligibleCandidates[0];
      proposed_schedule_with_ids[shiftSlot].push(chosenEmp.id);
      employee_shifts_this_week[chosenEmp.id] = (employee_shifts_this_week[chosenEmp.id] || 0) + 1;
    }
  }

  const unfilled_shifts = shiftsToFill.filter(shift => proposed_schedule_with_ids[shift].length < 2);

  const proposed_schedule_with_names: Record<string, string> = {};
  for (const shift in proposed_schedule_with_ids) {
    const empIdsList = proposed_schedule_with_ids[shift];
    if (!empIdsList || empIdsList.length === 0) {
      proposed_schedule_with_names[shift] = "UNFILLED";
    } else {
      const names = empIdsList.map(id => employeesDict[id]?.name).filter(name => name);
      proposed_schedule_with_names[shift] = names.length > 0 ? names.join(", ") : "UNFILLED";
    }
  }

  return {
    proposed_schedule_with_ids,
    proposed_schedule_with_names,
    unfilled_shifts,
    employee_shifts_this_week,
  };
}