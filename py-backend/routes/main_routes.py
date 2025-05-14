from flask import Blueprint, request, jsonify, render_template
from ..config import EMPLOYEES_COLLECTION # Import necessary configs
from ..utils import get_all_docs, get_on_call_config, save_on_call_config, update_doc # Import necessary utils

main_bp = Blueprint('main_api', __name__) # No url_prefix for the root route

@main_bp.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html')

@main_bp.route('/api/on_call', methods=['GET'])
def get_on_call_info():
    """Returns the current on-call rotation information."""
    on_call_data = get_on_call_config()
    employees = get_all_docs(EMPLOYEES_COLLECTION)
    
    current_employee_name = "N/A"
    current_emp_id_on_call = None

    if on_call_data.get("rotation_order") and len(on_call_data["rotation_order"]) > 0:
        current_index = on_call_data.get("current_on_call_index", 0)
        if 0 <= current_index < len(on_call_data["rotation_order"]):
            current_emp_id_on_call = on_call_data["rotation_order"][current_index]
            for emp in employees:
                if emp["id"] == current_emp_id_on_call:
                    current_employee_name = emp["name"]
                    break
    
    return jsonify({
        "current_on_call_employee_name": current_employee_name,
        "current_on_call_employee_id": current_emp_id_on_call if current_emp_id_on_call else "N/A",
        "rotation_order_ids": on_call_data.get("rotation_order", [])
    })

@main_bp.route('/api/finalize_schedule', methods=['POST'])
def finalize_schedule_api():
    """Finalizes the schedule, updates employee load, and advances on-call."""
    try:
        final_schedule_data = request.json
        finalized_schedule_with_ids = final_schedule_data.get("schedule_to_finalize")
    except Exception as e:
        return jsonify({"error": f"Invalid JSON input for finalization: {str(e)}"}), 400

    if not finalized_schedule_with_ids:
        return jsonify({"error": "No schedule data provided for finalization"}), 400

    employees_data = get_all_docs(EMPLOYEES_COLLECTION)
    if not employees_data:
        return jsonify({"error": "Cannot finalize, no employee data found."}), 500
        
    employees_dict = {emp['id']: emp.copy() for emp in employees_data}

    for shift_slot, emp_id in finalized_schedule_with_ids.items():
        if emp_id and emp_id in employees_dict:
            employees_dict[emp_id]['total_shifts_assigned'] = employees_dict[emp_id].get('total_shifts_assigned', 0) + 1
            if "Day" in shift_slot:
                employees_dict[emp_id]['total_day_shifts_assigned'] = employees_dict[emp_id].get('total_day_shifts_assigned', 0) + 1
            elif "Night" in shift_slot:
                employees_dict[emp_id]['total_night_shifts_assigned'] = employees_dict[emp_id].get('total_night_shifts_assigned', 0) + 1
    
    for emp_id, emp_data in employees_dict.items():
        data_to_save = {k: v for k, v in emp_data.items() if k != 'id'}
        update_doc(EMPLOYEES_COLLECTION, emp_id, data_to_save)

    on_call_data = get_on_call_config()
    if on_call_data.get("rotation_order") and len(on_call_data["rotation_order"]) > 0 : # Check list not empty
        current_index = on_call_data.get("current_on_call_index", 0)
        on_call_data["current_on_call_index"] = (current_index + 1) % len(on_call_data["rotation_order"])
        save_on_call_config(on_call_data)
    
    return jsonify({"message": "Schedule finalized, employee data updated, and on-call advanced."})