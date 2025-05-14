import json
import os
from config import EMPLOYEES_DB_FILE, ON_CALL_DB_FILE # Import constants

def load_json_data(file_path, default_data=None):
    """Loads JSON data from a file. If file doesn't exist, creates it with default_data."""
    if not os.path.exists(file_path):
        if default_data is not None:
            save_json_data(default_data, file_path)
            return default_data
        # Determine default based on typical usage for known files
        return {} if file_path == ON_CALL_DB_FILE else []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return default_data if default_data is not None else ({} if file_path == ON_CALL_DB_FILE else [])

def save_json_data(data, file_path):
    """Saves data to a JSON file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except IOError as e:
        print(f"Error saving data to {file_path}: {e}")

def initialize_databases():
    """Initializes database files with default structures if they don't exist."""
    load_json_data(EMPLOYEES_DB_FILE, default_data=[])
    load_json_data(ON_CALL_DB_FILE, default_data={"current_on_call_index": 0, "rotation_order": []})