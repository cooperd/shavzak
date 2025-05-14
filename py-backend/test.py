import json
import os # Import the os module
import firebase_admin
from firebase_admin import credentials, firestore
from config import EMPLOYEES_COLLECTION, ON_CALL_COLLECTION # Your new config.py

# Construct the absolute path to the service account key file
script_dir = os.path.dirname(os.path.abspath(__file__))
key_file_path = os.path.join(script_dir, "shavzak-firebase-adminsdk.json")

# Initialize Firebase Admin (same as in app.py)
cred = credentials.Certificate(key_file_path) # Use the absolute path
firebase_admin.initialize_app(cred)
db = firestore.client()

def migrate_employees():
    print(f"Migrating employees to Firestore collection: {EMPLOYEES_COLLECTION}...")
    try:
        # Construct path to employees.json relative to this script's location
        # script_dir is /Users/dvircooper/projects/shavzak/backend/
        # project_root_dir is /Users/dvircooper/projects/shavzak/
        project_root_dir = os.path.dirname(script_dir) 
        employees_json_path = os.path.join(project_root_dir, 'db', 'employees.json')
        with open(employees_json_path, 'r', encoding='utf-8') as f: 
            employees_from_json = json.load(f)

        batch = db.batch()
        count = 0
        for emp_data in employees_from_json:
            emp_id = emp_data.pop('id', None) # Get and remove old ID
            if emp_id:
                # Use the old ID as the document ID in Firestore
                doc_ref = db.collection(EMPLOYEES_COLLECTION).document(emp_id)
                batch.set(doc_ref, emp_data)
                print(f"  Staging employee {emp_data.get('name')} with ID {emp_id}")
                count += 1
                if count % 400 == 0: # Commit batch every 400 operations
                    batch.commit()
                    batch = db.batch()
            else:
                print(f"  Skipping employee without ID: {emp_data.get('name')}")
        if count % 400 != 0 : # Commit any remaining operations
             batch.commit()
        print(f"Employee migration complete. {count} employees processed.")
    except FileNotFoundError:
        print(f"{employees_json_path} not found. Skipping employee migration.")
    except Exception as e:
        print(f"Error during employee migration: {e}")

if __name__ == "__main__":
    migrate_employees()
