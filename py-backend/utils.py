import json
import os
from firebase_init import db # Import the initialized db client
from config import EMPLOYEES_COLLECTION, ON_CALL_COLLECTION # Import collection names

def get_all_docs(collection_name):
    """Fetches all documents from a Firestore collection."""
    docs_ref = db.collection(collection_name).stream()
    docs_list = []
    for doc in docs_ref:
        doc_data = doc.to_dict()
        doc_data['id'] = doc.id # Use Firestore document ID as 'id'
        docs_list.append(doc_data)
    return docs_list

def get_doc(collection_name, doc_id):
    """Fetches a single document by ID from a Firestore collection."""
    doc_ref = db.collection(collection_name).document(doc_id)
    doc = doc_ref.get()
    if doc.exists:
        doc_data = doc.to_dict()
        doc_data['id'] = doc.id
        return doc_data
    return None

def set_doc(collection_name, doc_id, data):
    """Sets (overwrites) a document in a Firestore collection."""
    db.collection(collection_name).document(doc_id).set(data)

def add_doc(collection_name, data):
    """Adds a new document with an auto-generated ID to a Firestore collection."""
    # Exclude 'id' field if present, as Firestore will generate it
    data_to_add = {k: v for k, v in data.items() if k != 'id'}
    _, doc_ref = db.collection(collection_name).add(data_to_add)
    return doc_ref.id

def update_doc(collection_name, doc_id, data_to_update):
    """Updates fields in an existing document."""
    db.collection(collection_name).document(doc_id).update(data_to_update)

def delete_doc(collection_name, doc_id):
    """Deletes a document from a Firestore collection."""
    db.collection(collection_name).document(doc_id).delete()


def get_on_call_config():
    """Gets the on-call configuration (assuming a single doc named 'current')."""
    doc = get_doc(ON_CALL_COLLECTION, "current") # Using a fixed document ID "current"
    if doc:
        return doc
    # Default if not found
    default_config = {"current_on_call_index": 0, "rotation_order": []}
    set_doc(ON_CALL_COLLECTION, "current", default_config) # Create it if it doesn't exist
    return default_config

def save_on_call_config(data):
    """Saves the on-call configuration."""
    set_doc(ON_CALL_COLLECTION, "current", data)

def initialize_databases():
    """Initializes database files with default structures if they don't exist."""
   # Ensure default on-call config exists
    get_on_call_config() # This will create it if it doesn't exist

    # Check if employees collection is empty (optional: add default data or log)
    employees = get_all_docs(EMPLOYEES_COLLECTION)
    if not employees:
        print(f"'{EMPLOYEES_COLLECTION}' collection is empty. Consider adding initial data via Firebase console or a migration script.")
