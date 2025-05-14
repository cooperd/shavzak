from flask import Blueprint, request, jsonify
from ..config import EMPLOYEES_COLLECTION
from ..utils import get_all_docs, get_doc, add_doc, set_doc, update_doc, delete_doc # Use Firestore utils

# Using a relative import for utils and config assumes 'shavzak' is a package
# or that the app is run from the 'shavzak' directory.
# If running app.py directly from its location, you might need to adjust sys.path or use absolute imports if shavzak is installed.

employee_bp = Blueprint('employee_api', __name__, url_prefix='/api')

def _generate_employee_id(employees_data):
    """Generates a new unique employee ID (if not using Firestore auto-IDs).
    This needs rethinking with Firestore. For now, let's assume Firestore auto-IDs.
    If using numeric IDs, you'd need a counter in Firestore."""
    # This function might not be directly used if relying on Firestore auto-IDs.
    # For simplicity, we'll let Firestore handle ID generation in add_employee.
    pass 

def _sort_employees(employees_list):
    """Sorts a list of employees by name, case-insensitively."""
    return sorted(employees_list, key=lambda emp: emp['name'].lower())

@employee_bp.route('/employees', methods=['GET'])
def get_employees():
    """Returns the list of all employees with their load data."""
    # The employees.json file is kept sorted by add/update/delete operations.
    all_employees = get_all_docs(EMPLOYEES_COLLECTION)
    return jsonify(_sort_employees(all_employees)) # Sort after fetching

@employee_bp.route('/employees', methods=['POST'])
def add_employee():
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({"message": "Employee name is required"}), 400

    all_employees = get_all_docs(EMPLOYEES_COLLECTION) # For duplicate check
    new_name = data['name'].strip()
    if any(emp['name'].lower() == new_name.lower() for emp in all_employees):
        return jsonify({"message": f"Employee with name '{new_name}' already exists"}), 409

    new_employee_data = {
        "name": new_name,
        "total_shifts_assigned": 0, "total_day_shifts_assigned": 0, "total_night_shifts_assigned": 0
    }
    new_id = add_doc(EMPLOYEES_COLLECTION, new_employee_data)
    new_employee_data['id'] = new_id # Add the Firestore generated ID to the response
    return jsonify(new_employee_data), 201

@employee_bp.route('/employees/<string:employee_id>', methods=['PUT'])
def update_employee(employee_id):
    data = request.get_json()
    if not data or 'name' not in data or not data['name'].strip():
        return jsonify({"message": "Employee name is required for update"}), 400

    employee_to_update = get_doc(EMPLOYEES_COLLECTION, employee_id)

    if not employee_to_update:
        return jsonify({"message": "Employee not found"}), 404

    updated_name = data['name'].strip()
    all_employees = get_all_docs(EMPLOYEES_COLLECTION) # Needed for duplicate check
    if employee_to_update['name'].lower() != updated_name.lower() and \
       any(emp['name'].lower() == updated_name.lower() and emp['id'] != employee_id for emp in all_employees):
        return jsonify({"message": f"Another employee with name '{updated_name}' already exists"}), 409

    update_doc(EMPLOYEES_COLLECTION, employee_id, {"name": updated_name})
    employee_to_update['name'] = updated_name # Update the object for the response
    return jsonify(employee_to_update), 200

@employee_bp.route('/employees/<string:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    employee_to_delete = get_doc(EMPLOYEES_COLLECTION, employee_id) # Check if doc exists

    if not employee_to_delete:
        return jsonify({"message": "Employee not found"}), 404

    delete_doc(EMPLOYEES_COLLECTION, employee_id) # Use the Firestore delete function
    return jsonify({"message": "Employee deleted successfully"}), 200