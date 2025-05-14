import firebase_admin
from firebase_admin import credentials, firestore
import os

# Construct the absolute path to the service account key file
# This assumes firebase_init.py is in the same directory as the key file
script_dir = os.path.dirname(os.path.abspath(__file__))
key_file_path = os.path.join(script_dir, "shavzak-firebase-adminsdk.json")

# Initialize Firebase Admin - This will run once when this module is first imported
if not firebase_admin._apps: # Check if already initialized to prevent re-initialization
    cred = credentials.Certificate(key_file_path)
    firebase_admin.initialize_app(cred)

db = firestore.client() # Firestore database client