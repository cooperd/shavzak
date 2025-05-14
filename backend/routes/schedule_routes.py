from flask import Blueprint, request, jsonify
from config import EMPLOYEES_DB_FILE, DAYS_OF_WEEK, SHIFT_TYPES, MAX_SHIFTS_PER_WEEK
from utils import load_json_data
from schedule_generator import create_weekly_schedule

schedule_bp = Blueprint('schedule_api', __name__, url_prefix='/api')

@schedule_bp.route('/generate_schedule', methods=['POST'])
def generate_schedule_api():
    """Generates a shift schedule based on employee preferences and load."""
    try:
        request_data = request.json
        employee_preferences_raw = request_data.get('preferences', {})
    except Exception as e:
        return jsonify({"error": f"Invalid JSON input: {str(e)}"}), 400

    employees_data = load_json_data(EMPLOYEES_DB_FILE, [])
    if not employees_data:
        return jsonify({"error": "No employee data found. Please add employees."}), 500

    employees_dict = {emp['id']: emp.copy() for emp in employees_data}

    (
        proposed_schedule_with_ids,
        proposed_schedule_with_names,
        unfilled_shifts,
        employee_shifts_this_week,
    ) = create_weekly_schedule(
        employee_preferences_raw,
        employees_dict,
        DAYS_OF_WEEK,
        SHIFT_TYPES,
        MAX_SHIFTS_PER_WEEK
    )

    # --- Update total employee shift counts based on the generated schedule for *this* week ---
    updated_employees_for_response = {emp_id: emp.copy() for emp_id, emp in employees_dict.items()}

    for shift_slot, employee_id_list in proposed_schedule_with_ids.items(): # employee_id_list is a list
        for employee_id in employee_id_list: # Iterate through each ID in the list
            if employee_id and employee_id in updated_employees_for_response:
                emp_to_update = updated_employees_for_response[employee_id]
                emp_to_update['total_shifts_assigned'] = emp_to_update.get('total_shifts_assigned', 0) + 1
                if "_Day" in shift_slot:
                    emp_to_update['total_day_shifts_assigned'] = emp_to_update.get('total_day_shifts_assigned', 0) + 1
                elif "_Night" in shift_slot:
                    emp_to_update['total_night_shifts_assigned'] = emp_to_update.get('total_night_shifts_assigned', 0) + 1
    
    updated_employees_list = sorted(list(updated_employees_for_response.values()), key=lambda emp: emp['name'].lower())

    return jsonify({
        "message": "Schedule generated successfully.",
        "proposed_schedule_with_ids": proposed_schedule_with_ids,
        "proposed_schedule_with_names": proposed_schedule_with_names,
        "unfilled_shifts": unfilled_shifts,
        "employee_shifts_this_week": employee_shifts_this_week,
        "updated_employees": updated_employees_list
    })