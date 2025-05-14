from collections import defaultdict

def _is_not_consecutive(employee_id, target_shift_slot, proposed_schedule_with_ids, days_of_week_ordered):
    """
    Checks if assigning employee_id to target_shift_slot would result in a consecutive shift.
    - Day shift cannot follow the previous day's Night shift.
    - Night shift cannot follow the same day's Day shift.
    """
    target_day, target_type = target_shift_slot.split('_')

    if target_type == "Day":
        try:
            current_day_index = days_of_week_ordered.index(target_day)
            if current_day_index > 0:  # If it's not the first day of the week
                previous_day = days_of_week_ordered[current_day_index - 1]
                previous_night_shift = f"{previous_day}_Night"
                if employee_id in proposed_schedule_with_ids.get(previous_night_shift, []):
                    return False  # Cannot work Day after previous Night
        except ValueError: # Should not happen if days_of_week_ordered is correct and target_day is valid
            pass # If day not found, assume it's okay for now or handle error
    elif target_type == "Night":
        same_day_day_shift = f"{target_day}_Day"
        if employee_id in proposed_schedule_with_ids.get(same_day_day_shift, []):
            return False  # Cannot work Night after same day Day
    return True # It's not a consecutive shift violation

def get_preference_score(pref_val):
    if pref_val == "1": return 0  # Most preferred
    if pref_val == "": return 1   # Available (less preferred than "1")
    return float('inf') # Effectively excludes "0" or other invalid values if not filtered earlier

def create_weekly_schedule(employee_preferences_raw, employees_dict, days_of_week, shift_types, max_shifts_per_week):
    """
    Generates a weekly shift schedule.

    Args:
        employee_preferences_raw (dict): Raw preferences from the request {emp_id: {shift_slot: "0"/"1"/""}}.
        employees_dict (dict): Dictionary of employee details {emp_id: employee_object}.
        days_of_week (list): List of day names.
        shift_types (list): List of shift types (e.g., ['Day', 'Night']).
        max_shifts_per_week (int): Maximum number of shifts an employee can be assigned in a week.

    Returns:
        tuple: proposed_schedule_with_ids, proposed_schedule_with_names,
               unfilled_shifts, employee_shifts_this_week
    """
    shifts_to_fill = [f"{day}_{stype}" for day in days_of_week for stype in shift_types]
    proposed_schedule_with_ids = {shift: [] for shift in shifts_to_fill} # {shift_slot: [emp_id1, emp_id2]}
    employee_shifts_this_week = defaultdict(int) # {emp_id: count_this_week}
    # Convert preferences to a more usable format: {shift_slot: {emp_id: preference_value}}
    shift_specific_preferences = defaultdict(dict)
    for emp_id, prefs in employee_preferences_raw.items():
        for shift_slot, pref_val in prefs.items():
            if emp_id in employees_dict: # Only consider known employees
                 shift_specific_preferences[shift_slot][emp_id] = pref_val
    # Assign shifts, trying to fill up to 2 spots per shift
    for shift_slot in shifts_to_fill:
        # Try to fill up to 2 spots for this shift
        while len(proposed_schedule_with_ids[shift_slot]) < 2:
            eligible_candidates = []
            for emp_id, emp_details in employees_dict.items():
                # Rule 1: Employee not already assigned to this specific shift slot
                if emp_id in proposed_schedule_with_ids[shift_slot]:
                    continue

                emp_pref_for_shift = shift_specific_preferences.get(shift_slot, {}).get(emp_id, "") # Default to ""
                
                # Rule 2: Cannot work (preference "0")
                if emp_pref_for_shift == "0":
                    continue

                # Rule 3: Max shifts per week
                if employee_shifts_this_week[emp_id] >= max_shifts_per_week:
                    continue
                
                # Rule 4: Not consecutive
                if not _is_not_consecutive(emp_id, shift_slot, proposed_schedule_with_ids, days_of_week):
                    continue
                
                # If all rules pass, add to candidates
                eligible_candidates.append(emp_details)
            
            if not eligible_candidates:
                break # No more eligible candidates for this slot in this iteration (or for the second spot)

            eligible_candidates.sort(key=lambda emp: (
                    employee_shifts_this_week.get(emp['id'], 0), # Prioritize by shifts this week
                    emp.get('total_shifts_assigned', 0),
                    get_preference_score(shift_specific_preferences.get(shift_slot, {}).get(emp['id'], "")), # Then by preference
                    emp.get('total_day_shifts_assigned', 0) if "Day" in shift_slot else emp.get('total_night_shifts_assigned', 0),
                    emp['id'] 
                ))
            
            chosen_emp = eligible_candidates[0]
            proposed_schedule_with_ids[shift_slot].append(chosen_emp['id'])
            employee_shifts_this_week[chosen_emp['id']] += 1
            # The while loop will continue to try and fill the second spot if len < 2
    
    unfilled_shifts = [shift for shift, emp_ids_list in proposed_schedule_with_ids.items() if len(emp_ids_list) < 2]
    
    # Prepare schedule with employee names for easier display
    proposed_schedule_with_names = {}
    for shift, emp_ids_list in proposed_schedule_with_ids.items():
        if not emp_ids_list:
            proposed_schedule_with_names[shift] = "UNFILLED"
        else:
            names = [employees_dict[emp_id]['name'] for emp_id in emp_ids_list if emp_id in employees_dict]
            proposed_schedule_with_names[shift] = ", ".join(names) if names else "UNFILLED"

    return (
        proposed_schedule_with_ids,
        proposed_schedule_with_names,
        unfilled_shifts,
        dict(employee_shifts_this_week) # Convert defaultdict to dict
    )