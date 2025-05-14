from flask import Flask, request, jsonify, render_template
from collections import defaultdict

from config import EMPLOYEES_DB_FILE, ON_CALL_DB_FILE, DAYS_OF_WEEK, SHIFT_TYPES, MAX_SHIFTS_PER_WEEK
from utils import load_json_data, save_json_data, initialize_databases
from routes.employee_routes import employee_bp # Import from the routes package
from routes.schedule_routes import schedule_bp # Import from the routes package


app = Flask(__name__,
            template_folder="../frontend/dist",  # Point to the dist folder for templates
            static_folder="../frontend/dist",    # Point to the dist folder for static files
            static_url_path=''                # Serve static files from the root (e.g., /assets/main.js)
            )

# Initialize DB files if they don't exist
initialize_databases()

# Register Blueprints
app.register_blueprint(employee_bp)
app.register_blueprint(schedule_bp)


# --- Routes ---
@app.route('/')
def index():
    """Serves the main HTML page."""
    return render_template('index.html') # Flask will now look in 'frontend/dist/index.html'

@app.route('/api/on_call', methods=['GET'])
def get_on_call_info():
    """Returns the current on-call rotation information."""
    on_call_data = load_json_data(ON_CALL_DB_FILE, {"current_on_call_index": 0, "rotation_order": []})
    employees = load_json_data(EMPLOYEES_DB_FILE, [])
    
    current_employee_name = "N/A"
    if on_call_data.get("rotation_order") and len(on_call_data["rotation_order"]) > 0:
        current_index = on_call_data.get("current_on_call_index", 0)
        if 0 <= current_index < len(on_call_data["rotation_order"]):
            current_emp_id = on_call_data["rotation_order"][current_index]
            for emp in employees:
                if emp["id"] == current_emp_id:
                    current_employee_name = emp["name"]
                    break
    
    return jsonify({
        "current_on_call_employee_name": current_employee_name,
        "current_on_call_employee_id": on_call_data["rotation_order"][on_call_data["current_on_call_index"]] if on_call_data.get("rotation_order") else "N/A",
        "rotation_order_ids": on_call_data.get("rotation_order", [])
    })


@app.route('/api/finalize_schedule', methods=['POST'])
def finalize_schedule_api():
    """Finalizes the schedule, updates employee load, and advances on-call."""
    try:
        final_schedule_data = request.json
        # Expects {"schedule_to_finalize": {"Monday_Day": "emp001", ...}}
        finalized_schedule_with_ids = final_schedule_data.get("schedule_to_finalize")
    except Exception as e:
        return jsonify({"error": f"Invalid JSON input for finalization: {str(e)}"}), 400

    if not finalized_schedule_with_ids:
        return jsonify({"error": "No schedule data provided for finalization"}), 400

    employees_data = load_json_data(EMPLOYEES_DB_FILE, [])
    if not employees_data:
        return jsonify({"error": "Cannot finalize, no employee data found."}), 500
        
    employees_dict = {emp['id']: emp for emp in employees_data}

    # Update employee load counts
    for shift_slot, emp_id in finalized_schedule_with_ids.items():
        if emp_id and emp_id in employees_dict: # Ensure emp_id is valid and not None/"UNFILLED"
            employees_dict[emp_id]['total_shifts_assigned'] = employees_dict[emp_id].get('total_shifts_assigned', 0) + 1
            if "Day" in shift_slot:
                employees_dict[emp_id]['total_day_shifts_assigned'] = employees_dict[emp_id].get('total_day_shifts_assigned', 0) + 1
            elif "Night" in shift_slot:
                employees_dict[emp_id]['total_night_shifts_assigned'] = employees_dict[emp_id].get('total_night_shifts_assigned', 0) + 1
    
    save_json_data(list(employees_dict.values()), EMPLOYEES_DB_FILE)

    # Advance on-call rotation
    on_call_data = load_json_data(ON_CALL_DB_FILE, {"current_on_call_index": 0, "rotation_order": []})
    if on_call_data.get("rotation_order"):
        current_index = on_call_data.get("current_on_call_index", 0)
        on_call_data["current_on_call_index"] = (current_index + 1) % len(on_call_data["rotation_order"])
        save_json_data(on_call_data, ON_CALL_DB_FILE)
    
    return jsonify({"message": "Schedule finalized, employee data updated, and on-call advanced."})

if __name__ == '__main__':
    # Ensure Flask runs on 0.0.0.0 to be accessible on the local network if needed,
    # otherwise 127.0.0.1 is fine for purely local access.
    # debug=True is for development, turn off for any "production" use.
    app.run(host='127.0.0.1', port=5000, debug=True)
