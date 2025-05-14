from flask import Blueprint, request, jsonify
from config import EMPLOYEES_DB_FILE
from utils import load_json_data, save_json_data

# Using a relative import for utils and config assumes 'shavzak' is a package
# or that the app is run from the 'shavzak' directory.
# If running app.py directly from its location, you might need to adjust sys.path or use absolute imports if shavzak is installed.

employee_bp = Blueprint('employee_api', __name__, url_prefix='/api')

def _generate_employee_id(employees_data):
    """Generates a new unique employee ID."""
    if not employees_data:
        return "1"
    ids = [int(emp['id']) for emp in employees_data if emp.get('id', '').isdigit()]
    return str(max(ids) + 1 if ids else 1)

def _sort_employees(employees_list):
    """Sorts a list of employees by name, case-insensitively."""
    return sorted(employees_list, key=lambda emp: emp['name'].lower())

@employee_bp.route('/employees', methods=['GET'])
def get_employees():
    """Returns the list of all employees with their load data."""
    # The employees.json file is kept sorted by add/update/delete operations.
    employees = load_json_data(EMPLOYEES_DB_FILE, default_data=[])
    return jsonify(employees)

@employee_bp.route('/employees', methods=['POST'])
def add_employee():
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({"message": "Employee name is required"}), 400

    employees_list = load_json_data(EMPLOYEES_DB_FILE, default_data=[])
    new_name = data['name'].strip()
    if any(emp['name'].lower() == new_name.lower() for emp in employees_list):
        return jsonify({"message": f"Employee with name '{new_name}' already exists"}), 409

    new_employee_id = _generate_employee_id(employees_list)
    new_employee = {
        "id": new_employee_id, "name": new_name,
        "total_shifts_assigned": 0, "total_day_shifts_assigned": 0, "total_night_shifts_assigned": 0
    }
    employees_list.append(new_employee)
    save_json_data(_sort_employees(employees_list), EMPLOYEES_DB_FILE)
    return jsonify(new_employee), 201

@employee_bp.route('/employees/<string:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({"message": "Employee name is required for update"}), 400

    employees_list = load_json_data(EMPLOYEES_DB_FILE, default_data=[])
    employee_to_update = next((emp for emp in employees_list if emp['id'] == employee_id), None)

    if not employee_to_update:
        return jsonify({"message": "Employee not found"}), 404

    updated_name = data['name'].strip()
    if employee_to_update['name'].lower() != updated_name.lower() and \
       any(emp['name'].lower() == updated_name.lower() and emp['id'] != employee_id for emp in employees_list):
        return jsonify({"message": f"Another employee with name '{updated_name}' already exists"}), 409

    employee_to_update['name'] = updated_name
    save_json_data(_sort_employees(employees_list), EMPLOYEES_DB_FILE)
    return jsonify(employee_to_update), 200

@employee_bp.route('/employees/<string:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    employees_list = load_json_data(EMPLOYEES_DB_FILE, default_data=[])
    original_length = len(employees_list)
    updated_employees_list = [emp for emp in employees_list if emp['id'] != employee_id]

    if len(updated_employees_list) == original_length:
        return jsonify({"message": "Employee not found"}), 404

    save_json_data(_sort_employees(updated_employees_list), EMPLOYEES_DB_FILE)
    return jsonify({"message": "Employee deleted successfully"}), 200